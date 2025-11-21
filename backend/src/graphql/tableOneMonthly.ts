// src/graphql/tableOneMonthly.ts
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export const tableOneMonthlyTypeDefs = `#graphql
  type TableOneMonthlyRow {
    month: String!  # e.g. "2025-01"
    numOfAdverseReactionCases: Int!
    numOfInadequateAnalgesia: Int!
    numOfPostoperativeAnalgesiaCases: Int!
    numOfPostoperativeVisits: Int!
  }

  extend type Query {
    tableOneMonthly(year: Int!): [TableOneMonthlyRow!]!
  }
`;

type TableOneMonthlyRowDB = {
    month: string;
    numOfAdverseReactionCases: number | null;
    numOfInadequateAnalgesia: number | null;
    numOfPostoperativeAnalgesiaCases: number | null;
    numOfPostoperativeVisits: number | null;
};

export const tableOneMonthlyResolvers = {
    Query: {
        async tableOneMonthly(
            _: unknown,
            args: { year: number },
            ctx: { user?: { id: number } }
        ) {
            if (!ctx.user) {
                throw new Error("Unauthorized");
            }
            const userId = ctx.user.id;
            const year = args.year;

            // MySQL aggregation by month:
            // DATE_FORMAT(date, '%Y-%m') gives "2025-01", "2025-02", etc.
            const rows = await prisma.$queryRaw<TableOneMonthlyRowDB[]>(
                Prisma.sql`
          SELECT
            DATE_FORMAT(date, '%Y-%m') AS month,
            COALESCE(SUM(numOfAdverseReactionCases), 0) AS numOfAdverseReactionCases,
            COALESCE(SUM(numOfInadequateAnalgesia), 0) AS numOfInadequateAnalgesia,
            COALESCE(SUM(numOfPostoperativeAnalgesiaCases), 0) AS numOfPostoperativeAnalgesiaCases,
            COALESCE(SUM(numOfPostoperativeVisits), 0) AS numOfPostoperativeVisits
          FROM AfterSurgeryTableOne
          WHERE userId = ${userId}
            AND YEAR(date) = ${year}
          GROUP BY DATE_FORMAT(date, '%Y-%m')
          ORDER BY DATE_FORMAT(date, '%Y-%m')
        `
            );

            // Normalize null → 0 to satisfy non-nullable Int! fields
            return rows.map((r) => ({
                month: r.month,
                numOfAdverseReactionCases: r.numOfAdverseReactionCases ?? 0,
                numOfInadequateAnalgesia: r.numOfInadequateAnalgesia ?? 0,
                numOfPostoperativeAnalgesiaCases:
                    r.numOfPostoperativeAnalgesiaCases ?? 0,
                numOfPostoperativeVisits: r.numOfPostoperativeVisits ?? 0,
            }));
        },
    },
};
