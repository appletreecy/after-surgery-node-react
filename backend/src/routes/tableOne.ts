import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const tableOne = Router();

/**
 * GET /api/table-one
 * Query:
 *  - q?: string
 *  - from?: YYYY-MM-DD
 *  - to?:   YYYY-MM-DD
 *  - since?: YYYY-MM-DD (fallback if from/to not provided)
 *  - page?: number (default 1)
 *  - pageSize?: number (default 20; max 100)
 *
 * Default behavior: last 30 days.
 */
tableOne.get("/", requireAuth, async (req, res) => {
    const { q, from, to, since, page = "1", pageSize = "20" } = req.query as Record<string, string | undefined>;
    const userId = req.user!.id;
    const _page = Math.max(1, parseInt(page || "1", 10));
    const _pageSize = Math.min(100, Math.max(1, parseInt(pageSize || "20", 10)));
    const skip = (_page - 1) * _pageSize;
    const take = _pageSize;

    const where: any = { userId };

    // Date window — explicit from/to > since > default last 30 days
    if (from || to) {
        where.date = {};
        if (from) where.date.gte = new Date(from);
        if (to)   where.date.lte = new Date(to);
    } else if (since) {
        where.date = { gte: new Date(since) };
    } else {
        const last30 = new Date();
        last30.setDate(last30.getDate() - 30);
        where.date = { gte: last30 };
    }

    // Optional q: numeric columns or same-day date
    if (q && q.trim() !== "") {
        const n = Number(q);
        const isNum = Number.isFinite(n);

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
    }

    const [total, items, agg] = await Promise.all([
        prisma.afterSurgeryTableOne.count({ where }),
        prisma.afterSurgeryTableOne.findMany({
            where,
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
            skip,
            take,
        }),
        prisma.afterSurgeryTableOne.aggregate({
            where,
            _sum: {
                numOfAdverseReactionCases: true,
                numOfInadequateAnalgesia: true,
                numOfPostoperativeAnalgesiaCases: true,
                numOfPostoperativeVisits: true,
            },
        }),
    ]);

    res.json({
        total,
        page: _page,
        pageSize: _pageSize,
        items,
        sums: {
            numOfAdverseReactionCases: agg._sum.numOfAdverseReactionCases ?? 0,
            numOfInadequateAnalgesia: agg._sum.numOfInadequateAnalgesia ?? 0,
            numOfPostoperativeAnalgesiaCases: agg._sum.numOfPostoperativeAnalgesiaCases ?? 0,
            numOfPostoperativeVisits: agg._sum.numOfPostoperativeVisits ?? 0,
        },
    });
});

/**
 * POST /api/table-one
 * Body:
 *  - date?: string (YYYY-MM-DD) – defaults to now
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

    const row = await prisma.afterSurgeryTableOne.findUnique({ where: { id } });
    if (!row || row.userId !== req.user!.id) {
        return res.status(404).json({ error: "Not found" });
    }

    await prisma.afterSurgeryTableOne.delete({ where: { id } });
    res.json({ ok: true });
});
