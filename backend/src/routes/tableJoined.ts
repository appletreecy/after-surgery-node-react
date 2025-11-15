import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const tableJoined = Router();

/**
 * One row from the AfterSurgeryJoined view.
 * Joined by (userId, date) across all 5 tables.
 */
type JoinedRow = {
    userId: number;
    date: Date;

    // ----- tableOne -----
    numOfAdverseReactionCases: number | null;
    numOfInadequateAnalgesia: number | null;
    numOfPostoperativeAnalgesiaCases: number | null;
    numOfPostoperativeVisits: number | null;

    // ----- tableTwo -----
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
    otherComments: string | null; // tableTwo string column

    // ----- tableThree -----
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

    // ----- tableFour -----
    numOfFormulationOne: number | null;
    numOfFormulationTwo: number | null;
    numOfFormulationThree: number | null;
    numOfFormulationFour: number | null;
    numOfFormulationFive: number | null;
    numOfFormulationSix: number | null;

    // ----- tableFive -----
    criticalPatientsName: string | null;
    visitFindingsForCriticalPatient: string | null;
    numberOfCriticalRescueCases: number | null;
    numberOfDeaths: number | null;
    numberOfFollowUpsForCriticallyIllPatients: number | null;
};

/**
 * GET /table-joined
 *
 * Query:
 *  - from?: YYYY-MM-DD
 *  - to?:   YYYY-MM-DD
 *  - since?: YYYY-MM-DD (fallback if from/to not provided)
 *  - page?: number (default 1)
 *  - pageSize?: number (default 20; max 100)
 *
 * Default behavior: last 30 days.
 *
 * Data source: MySQL VIEW `AfterSurgeryJoined`.
 */
tableJoined.get("/", requireAuth, async (req, res) => {
    const { from, to, since, page = "1", pageSize = "20" } = req.query as Record<
        string,
        string | undefined
    >;

    const userId = req.user!.id;
    const _page = Math.max(1, parseInt(page || "1", 10));
    const _pageSize = Math.min(100, Math.max(1, parseInt(pageSize || "20", 10)));
    const offset = (_page - 1) * _pageSize;

    // Build WHERE clause for raw SQL (user + date range)
    const whereParts: string[] = ["userId = ?"];
    const params: any[] = [userId];

    if (from || to) {
        if (from) {
            whereParts.push("date >= ?");
            params.push(from);
        }
        if (to) {
            whereParts.push("date <= ?");
            params.push(to);
        }
    } else if (since) {
        whereParts.push("date >= ?");
        params.push(since);
    } else {
        // default last 30 days
        const last30 = new Date();
        last30.setDate(last30.getDate() - 30);
        const iso = last30.toISOString().slice(0, 10); // YYYY-MM-DD
        whereParts.push("date >= ?");
        params.push(iso);
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    try {
        // --- total row count ---
        const totalRows = (await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) AS count FROM AfterSurgeryJoined ${whereSql}`,
            ...params
        )) as { count: bigint }[];

        const total = Number(totalRows[0]?.count ?? 0);

        // --- paged items (ALL columns from the view) ---
        const items = (await prisma.$queryRawUnsafe(
            `
            SELECT *
            FROM AfterSurgeryJoined
            ${whereSql}
            ORDER BY date DESC
            LIMIT ? OFFSET ?
            `,
            ...params,
            _pageSize,
            offset
        )) as JoinedRow[];

        res.json({
            total,
            page: _page,
            pageSize: _pageSize,
            items,
        });
    } catch (err) {
        console.error("[table-joined] error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
