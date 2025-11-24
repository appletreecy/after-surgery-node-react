// src/graphql/tableTwoMonthly.ts
import { prisma } from "../lib/prisma";

export const tableTwoMonthlyTypeDefs = `#graphql
  "Monthly aggregated row for AfterSurgeryTableTwo"
  type TableTwoMonthlyRow {
    month: String!  # e.g. "2025-01"
    numOfAbdominalDistension: Int!
    numOfAllergicRash: Int!
    numOfChestDiscomfort: Int!
    numOfDelirium: Int!
    numOfDizziness: Int!
    numOfEndotrachealIntubationDiscomfort: Int!
    numOfEpigastricPain: Int!
    numOfItching: Int!
    numOfNauseaAndVomiting: Int!
    numOfNauseaAndVomitingAndDizziness: Int!
    numOfOther: Int!
    numOfProlongedAnestheticRecovery: Int!
    numOfPunctureSiteAbnormality: Int!
    numOfTourniquetReaction: Int!
  }

  extend type Query {
    tableTwoMonthly(year: Int!): [TableTwoMonthlyRow!]!
  }
`;

type TableTwoMonthlyRowDB = {
    month: string;
    numOfAbdominalDistension: number | null;
    numOfAllergicRash: number | null;
    numOfChestDiscomfort: number | null;
    numOfDelirium: number | null;
    numOfDizziness: number | null;
    numOfEndotrachealIntubationDiscomfort: number | null;
    numOfEpigastricPain: number | null;
    numOfItching: number | null;
    numOfNauseaAndVomiting: number | null;
    numOfNauseaAndVomitingAndDizziness: number | null;
    numOfOther: number | null;
    numOfProlongedAnestheticRecovery: number | null;
    numOfPunctureSiteAbnormality: number | null;
    numOfTourniquetReaction: number | null;
};

export const tableTwoMonthlyResolvers = {
    Query: {
        async tableTwoMonthly(
            _: unknown,
            args: { year: number },
            ctx: { user?: { id: number } }
        ) {
            if (!ctx.user) {
                throw new Error("Unauthorized");
            }

            const userId = ctx.user.id;
            const year = args.year;

            const rows = await prisma.$queryRaw<TableTwoMonthlyRowDB[]>`
        SELECT
          DATE_FORMAT(date, '%Y-%m') AS month,
          COALESCE(SUM(numOfAbdominalDistension), 0) AS numOfAbdominalDistension,
          COALESCE(SUM(numOfAllergicRash), 0) AS numOfAllergicRash,
          COALESCE(SUM(numOfChestDiscomfort), 0) AS numOfChestDiscomfort,
          COALESCE(SUM(numOfDelirium), 0) AS numOfDelirium,
          COALESCE(SUM(numOfDizziness), 0) AS numOfDizziness,
          COALESCE(SUM(numOfEndotrachealIntubationDiscomfort), 0) AS numOfEndotrachealIntubationDiscomfort,
          COALESCE(SUM(numOfEpigastricPain), 0) AS numOfEpigastricPain,
          COALESCE(SUM(numOfItching), 0) AS numOfItching,
          COALESCE(SUM(numOfNauseaAndVomiting), 0) AS numOfNauseaAndVomiting,
          COALESCE(SUM(numOfNauseaAndVomitingAndDizziness), 0) AS numOfNauseaAndVomitingAndDizziness,
          COALESCE(SUM(numOfOther), 0) AS numOfOther,
          COALESCE(SUM(numOfProlongedAnestheticRecovery), 0) AS numOfProlongedAnestheticRecovery,
          COALESCE(SUM(numOfPunctureSiteAbnormality), 0) AS numOfPunctureSiteAbnormality,
          COALESCE(SUM(numOfTourniquetReaction), 0) AS numOfTourniquetReaction
        FROM AfterSurgeryTableTwo
        WHERE userId = ${userId}
          AND YEAR(date) = ${year}
        GROUP BY DATE_FORMAT(date, '%Y-%m')
        ORDER BY DATE_FORMAT(date, '%Y-%m')
      `;

            return rows.map((r) => ({
                month: r.month,
                numOfAbdominalDistension: r.numOfAbdominalDistension ?? 0,
                numOfAllergicRash: r.numOfAllergicRash ?? 0,
                numOfChestDiscomfort: r.numOfChestDiscomfort ?? 0,
                numOfDelirium: r.numOfDelirium ?? 0,
                numOfDizziness: r.numOfDizziness ?? 0,
                numOfEndotrachealIntubationDiscomfort:
                    r.numOfEndotrachealIntubationDiscomfort ?? 0,
                numOfEpigastricPain: r.numOfEpigastricPain ?? 0,
                numOfItching: r.numOfItching ?? 0,
                numOfNauseaAndVomiting: r.numOfNauseaAndVomiting ?? 0,
                numOfNauseaAndVomitingAndDizziness:
                    r.numOfNauseaAndVomitingAndDizziness ?? 0,
                numOfOther: r.numOfOther ?? 0,
                numOfProlongedAnestheticRecovery:
                    r.numOfProlongedAnestheticRecovery ?? 0,
                numOfPunctureSiteAbnormality:
                    r.numOfPunctureSiteAbnormality ?? 0,
                numOfTourniquetReaction: r.numOfTourniquetReaction ?? 0,
            }));
        },
    },
};
