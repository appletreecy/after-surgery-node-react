// src/graphql/tableThreeMonthly.ts
import { prisma } from "../lib/prisma";

export const tableThreeMonthlyTypeDefs = `#graphql
  type TableThreeMonthlyRow {
    month: String!  # e.g. "2025-01"
    numOfJointComplicationCount: Int!
    numOfMotorDysfunctionCount: Int!
    numOfTraumaComplicationCount: Int!
    numOfAnkleComplicationCount: Int!
    numOfPediatricAdverseEventCount: Int!
    numOfSpinalComplicationCount: Int!
    numOfHandSurgeryComplicationCount: Int!
    numOfObstetricAdverseEventCount: Int!
    numOfGynecologicalAdverseEventCount: Int!
    numOfSurgicalTreatmentCount: Int!
  }

  extend type Query {
    tableThreeMonthly(year: Int!): [TableThreeMonthlyRow!]!
  }
`;

type TableThreeMonthlyRowDB = {
    month: string;
    numOfJointComplicationCount: number | null;
    numOfMotorDysfunctionCount: number | null;
    numOfTraumaComplicationCount: number | null;
    numOfAnkleComplicationCount: number | null;
    numOfPediatricAdverseEventCount: number | null;
    numOfSpinalComplicationCount: number | null;
    numOfHandSurgeryComplicationCount: number | null;
    numOfObstetricAdverseEventCount: number | null;
    numOfGynecologicalAdverseEventCount: number | null;
    numOfSurgicalTreatmentCount: number | null;
};

export const tableThreeMonthlyResolvers = {
    Query: {
        async tableThreeMonthly(
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
            const rows = await prisma.$queryRaw<TableThreeMonthlyRowDB[]>`
        SELECT
          DATE_FORMAT(date, '%Y-%m') AS month,
          COALESCE(SUM(numOfJointComplicationCount), 0) AS numOfJointComplicationCount,
          COALESCE(SUM(numOfMotorDysfunctionCount), 0) AS numOfMotorDysfunctionCount,
          COALESCE(SUM(numOfTraumaComplicationCount), 0) AS numOfTraumaComplicationCount,
          COALESCE(SUM(numOfAnkleComplicationCount), 0) AS numOfAnkleComplicationCount,
          COALESCE(SUM(numOfPediatricAdverseEventCount), 0) AS numOfPediatricAdverseEventCount,
          COALESCE(SUM(numOfSpinalComplicationCount), 0) AS numOfSpinalComplicationCount,
          COALESCE(SUM(numOfHandSurgeryComplicationCount), 0) AS numOfHandSurgeryComplicationCount,
          COALESCE(SUM(numOfObstetricAdverseEventCount), 0) AS numOfObstetricAdverseEventCount,
          COALESCE(SUM(numOfGynecologicalAdverseEventCount), 0) AS numOfGynecologicalAdverseEventCount,
          COALESCE(SUM(numOfSurgicalTreatmentCount), 0) AS numOfSurgicalTreatmentCount
        FROM AfterSurgeryTableThree
        WHERE userId = ${userId}
          AND YEAR(date) = ${year}
        GROUP BY DATE_FORMAT(date, '%Y-%m')
        ORDER BY DATE_FORMAT(date, '%Y-%m')
      `;

            // Normalize null → 0 to satisfy non-nullable Int! fields
            return rows.map((r: TableThreeMonthlyRowDB) => ({
                month: r.month,
                numOfJointComplicationCount: r.numOfJointComplicationCount ?? 0,
                numOfMotorDysfunctionCount: r.numOfMotorDysfunctionCount ?? 0,
                numOfTraumaComplicationCount:
                    r.numOfTraumaComplicationCount ?? 0,
                numOfAnkleComplicationCount: r.numOfAnkleComplicationCount ?? 0,
                numOfPediatricAdverseEventCount: r.numOfPediatricAdverseEventCount ?? 0,
                numOfSpinalComplicationCount: r.numOfSpinalComplicationCount ?? 0,
                numOfHandSurgeryComplicationCount: r.numOfHandSurgeryComplicationCount ?? 0,
                numOfObstetricAdverseEventCount: r.numOfObstetricAdverseEventCount ?? 0,
                numOfGynecologicalAdverseEventCount: r.numOfGynecologicalAdverseEventCount ?? 0,
                numOfSurgicalTreatmentCount: r.numOfSurgicalTreatmentCount ?? 0,
            }));
        },
    },
};
