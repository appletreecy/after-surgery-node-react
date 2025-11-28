// src/graphql/tableThreeMonthly.ts
import { prisma } from "../lib/prisma";

export const tableFourMonthlyTypeDefs = `#graphql
  type TableFourMonthlyRow {
    month: String!  # e.g. "2025-01"
    numOfFormulationOne: Int!
    numOfFormulationTwo: Int!
    numOfFormulationThree: Int!
    numOfFormulationFour: Int!
    numOfFormulationFive: Int!
    numOfFormulationSix: Int!
  }

  extend type Query {
    tableFourMonthly(year: Int!): [TableFourMonthlyRow!]!
  }
`;

type TableFourMonthlyRowDB = {
    month: string;
    numOfFormulationOne: number | null;
    numOfFormulationTwo: number | null;
    numOfFormulationThree: number | null;
    numOfFormulationFour: number | null;
    numOfFormulationFive: number | null;
    numOfFormulationSix: number | null;
};

export const tableFourMonthlyResolvers = {
    Query: {
        async tableFourMonthly(
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
            const rows = await prisma.$queryRaw<TableFourMonthlyRowDB[]>`
        SELECT
          DATE_FORMAT(date, '%Y-%m') AS month,
          COALESCE(SUM(numOfFormulationOne), 0) AS numOfFormulationOne,
          COALESCE(SUM(numOfFormulationTwo), 0) AS numOfFormulationTwo,
          COALESCE(SUM(numOfFormulationThree), 0) AS numOfFormulationThree,
          COALESCE(SUM(numOfFormulationFour), 0) AS numOfFormulationFour,
          COALESCE(SUM(numOfFormulationFive), 0) AS numOfFormulationFive,
          COALESCE(SUM(numOfFormulationSix), 0) AS numOfFormulationSix
        FROM AfterSurgeryTableFour
        WHERE userId = ${userId}
          AND YEAR(date) = ${year}
        GROUP BY DATE_FORMAT(date, '%Y-%m')
        ORDER BY DATE_FORMAT(date, '%Y-%m')
      `;

            // Normalize null → 0 to satisfy non-nullable Int! fields
            return rows.map((r: TableFourMonthlyRowDB) => ({
                month: r.month,
                numOfFormulationOne: r.numOfFormulationOne ?? 0,
                numOfFormulationTwo: r.numOfFormulationTwo ?? 0,
                numOfFormulationThree:
                    r.numOfFormulationThree ?? 0,
                numOfFormulationFour: r.numOfFormulationFour ?? 0,
                numOfFormulationFive: r.numOfFormulationFive ?? 0,
                numOfFormulationSix: r.numOfFormulationSix ?? 0,
            }));
        },
    },
};
