// src/routes/tableThreeQuarterly.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

type TableThreeQuarterlyRowDB = {
    q: number; // 1..4 from QUARTER()
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

type TableThreeQuarterlyRow = {
    quarter: string; // e.g. "Q1", "Q2", ...
    numOfJointComplicationCount: number;
    numOfMotorDysfunctionCount: number;
    numOfTraumaComplicationCount: number;
    numOfAnkleComplicationCount: number;
    numOfPediatricAdverseEventCount: number;
    numOfSpinalComplicationCount: number;
    numOfHandSurgeryComplicationCount: number;
    numOfObstetricAdverseEventCount: number;
    numOfGynecologicalAdverseEventCount: number;
    numOfSurgicalTreatmentCount: number;
};

/**
 * RPC endpoint:
 *   POST /rpc/tableThreeQuarterly
 * Body:
 *   { "year": 2025 }
 *
 * Response:
 *   TableThreeQuarterlyRow[]
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
        const rows = await prisma.$queryRaw<TableThreeQuarterlyRowDB[]>`
      SELECT
        QUARTER(date) AS q,
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
      GROUP BY QUARTER(date)
      ORDER BY QUARTER(date)
    `;

        const result: TableThreeQuarterlyRow[] = rows.map((r) => ({
            quarter: `Q${r.q}`, // "Q1", "Q2", "Q3", "Q4"
            numOfJointComplicationCount: r.numOfJointComplicationCount ?? 0,
            numOfMotorDysfunctionCount: r.numOfMotorDysfunctionCount ?? 0,
            numOfTraumaComplicationCount: r.numOfTraumaComplicationCount ?? 0,
            numOfAnkleComplicationCount:
                r.numOfAnkleComplicationCount ?? 0,
            numOfPediatricAdverseEventCount: r.numOfPediatricAdverseEventCount ?? 0,
            numOfSpinalComplicationCount: r.numOfSpinalComplicationCount ?? 0,
            numOfHandSurgeryComplicationCount: r.numOfHandSurgeryComplicationCount ?? 0,
            numOfObstetricAdverseEventCount: r.numOfObstetricAdverseEventCount ?? 0,
            numOfGynecologicalAdverseEventCount: r.numOfGynecologicalAdverseEventCount ?? 0,
            numOfSurgicalTreatmentCount: r.numOfSurgicalTreatmentCount ?? 0,
        }));

        return res.json(result);
    } catch (err) {
        console.error("[tableThreeQuarterly] error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
