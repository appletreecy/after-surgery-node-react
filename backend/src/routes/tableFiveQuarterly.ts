// src/routes/tableFiveQuarterly.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

type TableFiveQuarterlyRowDB = {
    q: number; // 1..4 from QUARTER()
    numberOfCriticalRescueCases: number | null;
    numberOfDeaths: number | null;
    numberOfFollowUpsForCriticallyIllPatients: number | null;
};

type TableFiveQuarterlyRow = {
    quarter: string; // e.g. "Q1", "Q2", ...
    numberOfCriticalRescueCases: number;
    numberOfDeaths: number;
    numberOfFollowUpsForCriticallyIllPatients: number;
};

/**
 * RPC endpoint:
 *   POST /rpc/tableFiveQuarterly
 * Body:
 *   { "year": 2025 }
 *
 * Response:
 *   TableFiveQuarterlyRow[]
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
        const rows = await prisma.$queryRaw<TableFiveQuarterlyRowDB[]>`
      SELECT
        QUARTER(date) AS q,
        COALESCE(SUM(numberOfCriticalRescueCases), 0) AS numberOfCriticalRescueCases,
        COALESCE(SUM(numberOfDeaths), 0) AS numberOfDeaths,
        COALESCE(SUM(numberOfFollowUpsForCriticallyIllPatients), 0) AS numberOfFollowUpsForCriticallyIllPatients
      FROM AfterSurgeryTableFive
      WHERE userId = ${userId}
        AND YEAR(date) = ${year}
      GROUP BY QUARTER(date)
      ORDER BY QUARTER(date)
    `;

        const result: TableFiveQuarterlyRow[] = rows.map((r) => ({
            quarter: `Q${r.q}`, // "Q1", "Q2", "Q3", "Q4"
            numberOfCriticalRescueCases: r.numberOfCriticalRescueCases ?? 0,
            numberOfDeaths: r.numberOfDeaths ?? 0,
            numberOfFollowUpsForCriticallyIllPatients:
                r.numberOfFollowUpsForCriticallyIllPatients ?? 0,
        }));

        return res.json(result);
    } catch (err) {
        console.error("[tableFiveQuarterly] error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
