import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const tableFour = Router();

/**
 * GET /api/table-four
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
tableFour.get("/", requireAuth, async (req, res) => {
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
                { numOfFormulationOne: n },
                { numOfFormulationTwo: n },
                { numOfFormulationThree: n },
                { numOfFormulationFour: n },
                { numOfFormulationFive: n },
                { numOfFormulationSix: n },
            ] : []),
            ...(sameDayRange ? [{ date: sameDayRange }] : []),
        ];
    }

    const [total, items, agg] = await Promise.all([
        prisma.afterSurgeryTableFour.count({ where }),
        prisma.afterSurgeryTableFour.findMany({
            where,
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
            skip,
            take,
        }),
        prisma.afterSurgeryTableFour.aggregate({
            where,
            _sum: {
                numOfFormulationOne: true,
                numOfFormulationTwo: true,
                numOfFormulationThree: true,
                numOfFormulationFour: true,
                numOfFormulationFive: true,
                numOfFormulationSix: true,
            },
        }),
    ]);

    res.json({
        total,
        page: _page,
        pageSize: _pageSize,
        items,
        sums: {
            numOfFormulationOne: agg._sum.numOfFormulationOne ?? 0,
            numOfFormulationTwo: agg._sum.numOfFormulationTwo ?? 0,
            numOfFormulationThree: agg._sum.numOfFormulationThree ?? 0,
            numOfFormulationFour: agg._sum.numOfFormulationFour ?? 0,
            numOfFormulationFive: agg._sum.numOfFormulationFive ?? 0,
            numOfFormulationSix: agg._sum.numOfFormulationSix ?? 0,
        },
    });
});

/**
 * POST /api/table-four
 * Body:
 *  - date?: string (YYYY-MM-DD) – defaults to now
 *  - numOfAdverseReactionCases?: number | null
 *  - numOfInadequateAnalgesia?: number | null
 *  - numOfPostoperativeAnalgesiaCases?: number | null
 *  - numOfPostoperativeVisits?: number | null
 */
tableFour.post("/", requireAuth, async (req, res) => {
    const b = req.body || {};
    const toNullableInt = (v: any): number | null => {
        if (v === "" || v === null || v === undefined) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };

    const dateVal: Date = b.date ? new Date(b.date) : new Date();

    const created = await prisma.afterSurgeryTableFour.create({
        data: {
            userId: req.user!.id,
            date: dateVal,
            numOfFormulationOne:        toNullableInt(b.numOfFormulationOne),
            numOfFormulationTwo:         toNullableInt(b.numOfFormulationTwo),
            numOfFormulationThree: toNullableInt(b.numOfFormulationThree),
            numOfFormulationFour:         toNullableInt(b.numOfFormulationFour),
            numOfFormulationFive:        toNullableInt(b.numOfFormulationFive),
            numOfFormulationSix:         toNullableInt(b.numOfFormulationSix),
        },
    });

    res.json(created);
});

/**
 * DELETE /api/table-four/:id
 */
tableFour.delete("/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const row = await prisma.afterSurgeryTableFour.findUnique({ where: { id } });
    if (!row || row.userId !== req.user!.id) {
        return res.status(404).json({ error: "Not found" });
    }

    await prisma.afterSurgeryTableFour.delete({ where: { id } });
    res.json({ ok: true });
});
