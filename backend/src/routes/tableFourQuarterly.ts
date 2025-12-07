// src/routes/tableFourQuarterly.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

type TableFourQuarterlyRowDB = {
    q: number; // 1..4 from QUARTER()
    numOfFormulationOne: number | null;
    numOfFormulationTwo: number | null;
    numOfFormulationThree: number | null;
    numOfFormulationFour: number | null;
    numOfFormulationFive: number | null;
    numOfFormulationSix: number | null;
};

type TableFourQuarterlyRow = {
    quarter: string; // e.g. "Q1", "Q2", ...
    numOfFormulationOne: number;
    numOfFormulationTwo: number;
    numOfFormulationThree: number;
    numOfFormulationFour: number;
    numOfFormulationFive: number;
    numOfFormulationSix: number;
};

/**
 * RPC endpoint:
 *   POST /rpc/tableFourQuarterly
 * Body:
 *   { "year": 2025 }
 *
 * Response:
 *   TableFourQuarterlyRow[]
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
        const rows = await prisma.$queryRaw<TableFourQuarterlyRowDB[]>`
      SELECT
        QUARTER(date) AS q,
        COALESCE(SUM(numOfFormulationOne), 0) AS numOfFormulationOne,
        COALESCE(SUM(numOfFormulationTwo), 0) AS numOfFormulationTwo,
        COALESCE(SUM(numOfFormulationThree), 0) AS numOfFormulationThree,
        COALESCE(SUM(numOfFormulationFour), 0) AS numOfFormulationFour,
        COALESCE(SUM(numOfFormulationFive), 0) AS numOfFormulationFive,
        COALESCE(SUM(numOfFormulationSix), 0) AS numOfFormulationSix
      FROM AfterSurgeryTableFour
      WHERE userId = ${userId}
        AND YEAR(date) = ${year}
      GROUP BY QUARTER(date)
      ORDER BY QUARTER(date)
    `;

        const result: TableFourQuarterlyRow[] = rows.map((r) => ({
            quarter: `Q${r.q}`, // "Q1", "Q2", "Q3", "Q4"
            numOfFormulationOne: r.numOfFormulationOne ?? 0,
            numOfFormulationTwo: r.numOfFormulationTwo ?? 0,
            numOfFormulationThree: r.numOfFormulationThree ?? 0,
            numOfFormulationFour: r.numOfFormulationFour ?? 0,
            numOfFormulationFive: r.numOfFormulationFive ?? 0,
            numOfFormulationSix:
                r.numOfFormulationSix ?? 0,
        }));

        return res.json(result);
    } catch (err) {
        console.error("[tableFourQuarterly] error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
