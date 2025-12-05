// src/routes/tableTwoQuarterly.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

type TableTwoQuarterlyRowDB = {
    q: number; // 1..4 from QUARTER()
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

type TableTwoQuarterlyRow = {
    quarter: string; // e.g. "Q1", "Q2", ...
    numOfAbdominalDistension: number;
    numOfAllergicRash: number;
    numOfChestDiscomfort: number;
    numOfDelirium: number;
    numOfDizziness: number;
    numOfEndotrachealIntubationDiscomfort: number;
    numOfEpigastricPain: number;
    numOfItching: number;
    numOfNauseaAndVomiting: number;
    numOfNauseaAndVomitingAndDizziness: number;
    numOfOther: number;
    numOfProlongedAnestheticRecovery: number;
    numOfPunctureSiteAbnormality: number;
    numOfTourniquetReaction: number;
};

/**
 * RPC endpoint:
 *   POST /rpc/tableTwoQuarterly
 * Body:
 *   { "year": 2025 }
 *
 * Response:
 *   TableOneQuarterlyRow[]
 */
router.post("/", async (req, res) => {
    try {
        const user = (req as any).user as { id: number } | undefined;
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const year = Number(req.body?.year);
        if (!Number.isFinite(year) || year <= 0) {
            return res.status(400).json({ error: "Invalid year" });
        }

        const userId = user.id;

        // Group by QUARTER(date) -> 1..4
        const rows = await prisma.$queryRaw<TableTwoQuarterlyRowDB[]>`
      SELECT
        QUARTER(date) AS q,
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
      GROUP BY QUARTER(date)
      ORDER BY QUARTER(date)
    `;

        const result: TableTwoQuarterlyRow[] = rows.map((r) => ({
            quarter: `Q${r.q}`, // "Q1", "Q2", "Q3", "Q4"
            numOfAbdominalDistension: r.numOfAbdominalDistension ?? 0,
            numOfAllergicRash: r.numOfAllergicRash ?? 0,
            numOfChestDiscomfort: r.numOfChestDiscomfort ?? 0,
            numOfDelirium:
                r.numOfDelirium ?? 0,
            numOfDizziness: r.numOfDizziness ?? 0,
            numOfEndotrachealIntubationDiscomfort: r.numOfEndotrachealIntubationDiscomfort ?? 0,
            numOfEpigastricPain: r.numOfEpigastricPain ?? 0,
            numOfItching: r.numOfItching ?? 0,
            numOfNauseaAndVomiting: r.numOfNauseaAndVomiting ?? 0,
            numOfNauseaAndVomitingAndDizziness: r.numOfNauseaAndVomitingAndDizziness ?? 0,
            numOfOther: r.numOfOther ?? 0,
            numOfProlongedAnestheticRecovery: r.numOfProlongedAnestheticRecovery ?? 0,
            numOfPunctureSiteAbnormality: r.numOfPunctureSiteAbnormality ?? 0,
            numOfTourniquetReaction: r.numOfTourniquetReaction ?? 0,

        }));

        return res.json(result);
    } catch (err) {
        console.error("[tableOneQuarterly] error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
