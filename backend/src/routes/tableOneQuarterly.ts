// src/routes/tableFiveQuarterly.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

type TableOneQuarterlyRowDB = {
    q: number; // 1..4 from QUARTER()
    numOfAdverseReactionCases: number | null;
    numOfInadequateAnalgesia: number | null;
    numOfPostoperativeAnalgesiaCases: number | null;
    numOfPostoperativeVisits: number | null;
};

type TableOneQuarterlyRow = {
    quarter: string; // e.g. "Q1", "Q2", ...
    numOfAdverseReactionCases: number;
    numOfInadequateAnalgesia: number;
    numOfPostoperativeAnalgesiaCases: number;
    numOfPostoperativeVisits: number;
};

/**
 * RPC endpoint:
 *   POST /rpc/tableOneQuarterly
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
        const rows = await prisma.$queryRaw<TableOneQuarterlyRowDB[]>`
      SELECT
        QUARTER(date) AS q,
        COALESCE(SUM(numOfAdverseReactionCases), 0) AS numOfAdverseReactionCases,
        COALESCE(SUM(numOfInadequateAnalgesia), 0) AS numOfInadequateAnalgesia,
        COALESCE(SUM(numOfPostoperativeAnalgesiaCases), 0) AS numOfPostoperativeAnalgesiaCases,
        COALESCE(SUM(numOfPostoperativeVisits), 0) AS numOfPostoperativeVisits
      FROM AfterSurgeryTableOne
      WHERE userId = ${userId}
        AND YEAR(date) = ${year}
      GROUP BY QUARTER(date)
      ORDER BY QUARTER(date)
    `;

        const result: TableOneQuarterlyRow[] = rows.map((r) => ({
            quarter: `Q${r.q}`, // "Q1", "Q2", "Q3", "Q4"
            numOfAdverseReactionCases: r.numOfAdverseReactionCases ?? 0,
            numOfInadequateAnalgesia: r.numOfInadequateAnalgesia ?? 0,
            numOfPostoperativeAnalgesiaCases: r.numOfPostoperativeAnalgesiaCases ?? 0,
            numOfPostoperativeVisits:
                r.numOfPostoperativeVisits ?? 0,
        }));

        return res.json(result);
    } catch (err) {
        console.error("[tableOneQuarterly] error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
