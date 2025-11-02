import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const tableOne = Router();

/**
 * GET /api/table-one
 * Query params:
 *  - q?: string (if number, matches any numeric column equal to that number; also matches ISO date)
 *  - from?: YYYY-MM-DD (inclusive)
 *  - to?:   YYYY-MM-DD (inclusive)
 *  - page?: string (default "1")
 *  - pageSize?: string (default "20")
 */
tableOne.get("/", requireAuth, async (req, res) => {
    const { q, from, to, page = "1", pageSize = "20" } = req.query as Record<string, string | undefined>;
    const userId = req.user!.id;
    const skip = (parseInt(page || "1", 10) - 1) * parseInt(pageSize || "20", 10);
    const take = parseInt(pageSize || "20", 10);

    const where: any = { userId };

    // Date range filter (on 'date' field; falls back to createdAt if you prefer)
    if (from || to) {
        where.date = {};
        if (from) where.date.gte = new Date(from);
        if (to)   where.date.lte = new Date(to);
    }

    // q filter — try to coerce to number and also try date string
    if (q && q.trim() !== "") {
        const n = Number(q);
        const isNum = Number.isFinite(n);
        // If q looks like a date (YYYY-MM-DD or similar), try to match same day
        let sameDayRange: { gte?: Date; lt?: Date } | null = null;
        const asDate = new Date(q);
        if (!isNaN(asDate.getTime())) {
            const start = new Date(asDate.getFullYear(), asDate.getMonth(), asDate.getDate());
            const end = new Date(start); end.setDate(end.getDate() + 1);
            sameDayRange = { gte: start, lt: end };
        }

        where.OR = [
            ...(isNum ? [
                { numOfAdverseReactionCases: n },
                { numOfInadequateAnalgesia: n },
                { numOfPostoperativeAnalgesiaCases: n },
                { numOfPostoperativeVisits: n },
            ] : []),
            ...(sameDayRange ? [{ date: sameDayRange }] : []),
        ];

        // If neither numeric nor date-like, we skip OR (no text columns here)
    }

    const [total, items] = await Promise.all([
        prisma.afterSurgeryTableOne.count({ where }),
        prisma.afterSurgeryTableOne.findMany({
            where,
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
            skip,
            take,
        }),
    ]);

    res.json({ total, items });
});

/**
 * POST /api/table-one
 * Body:
 *  - date?: string (YYYY-MM-DD) – stored as DateTime; defaults to now
 *  - numOfAdverseReactionCases?: number | null
 *  - numOfInadequateAnalgesia?: number | null
 *  - numOfPostoperativeAnalgesiaCases?: number | null
 *  - numOfPostoperativeVisits?: number | null
 */
tableOne.post("/", requireAuth, async (req, res) => {
    const b = req.body || {};

    const toNullableInt = (v: any): number | null => {
        if (v === "" || v === null || v === undefined) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };

    const dateVal: Date = b.date ? new Date(b.date) : new Date();

    const created = await prisma.afterSurgeryTableOne.create({
        data: {
            userId: req.user!.id,
            date: dateVal,
            numOfAdverseReactionCases:        toNullableInt(b.numOfAdverseReactionCases),
            numOfInadequateAnalgesia:         toNullableInt(b.numOfInadequateAnalgesia),
            numOfPostoperativeAnalgesiaCases: toNullableInt(b.numOfPostoperativeAnalgesiaCases),
            numOfPostoperativeVisits:         toNullableInt(b.numOfPostoperativeVisits),
        },
    });

    res.json(created);
});

/**
 * DELETE /api/table-one/:id
 */
tableOne.delete("/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    // Optional: ensure row belongs to current user before delete
    const row = await prisma.afterSurgeryTableOne.findUnique({ where: { id } });
    if (!row || row.userId !== req.user!.id) {
        return res.status(404).json({ error: "Not found" });
    }

    await prisma.afterSurgeryTableOne.delete({ where: { id } });
    res.json({ ok: true });
});
