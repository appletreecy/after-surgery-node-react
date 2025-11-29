// src/graphql/tableThreeMonthly.ts
import { prisma } from "../lib/prisma";

export const tableFiveMonthlyTypeDefs = `#graphql
  type TableFiveMonthlyRow {
    month: String!  # e.g. "2025-01"
    numberOfCriticalRescueCases: Int!
    numberOfDeaths: Int!
    numberOfFollowUpsForCriticallyIllPatients: Int!
  }

  extend type Query {
    tableFiveMonthly(year: Int!): [TableFiveMonthlyRow!]!
  }
`;

type TableFiveMonthlyRowDB = {
    month: string;
    numberOfCriticalRescueCases: number | null;
    numberOfDeaths: number | null;
    numberOfFollowUpsForCriticallyIllPatients: number | null;
};

export const tableFiveMonthlyResolvers = {
    Query: {
        async tableFiveMonthly(
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
            // ✅ Use tagged template form of $queryRaw; no Prisma.sql needed.
            const rows = await prisma.$queryRaw<TableFiveMonthlyRowDB[]>`
        SELECT
          DATE_FORMAT(date, '%Y-%m') AS month,
          COALESCE(SUM(numberOfCriticalRescueCases), 0) AS numberOfCriticalRescueCases,
          COALESCE(SUM(numberOfDeaths), 0) AS numberOfDeaths,
          COALESCE(SUM(numberOfFollowUpsForCriticallyIllPatients), 0) AS numberOfFollowUpsForCriticallyIllPatients
        FROM AfterSurgeryTableFive
        WHERE userId = ${userId}
          AND YEAR(date) = ${year}
        GROUP BY DATE_FORMAT(date, '%Y-%m')
        ORDER BY DATE_FORMAT(date, '%Y-%m')
      `;

            // Normalize null → 0 to satisfy non-nullable Int! fields
            return rows.map((r: TableFiveMonthlyRowDB) => ({
                month: r.month,
                numberOfCriticalRescueCases: r.numberOfCriticalRescueCases ?? 0,
                numberOfDeaths: r.numberOfDeaths ?? 0,
                numberOfFollowUpsForCriticallyIllPatients:
                    r.numberOfFollowUpsForCriticallyIllPatients ?? 0,
            }));
        },
    },
};
