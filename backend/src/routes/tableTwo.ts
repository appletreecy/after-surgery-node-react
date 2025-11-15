import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const tableTwo = Router();

/**
 * GET /api/table-two
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
tableTwo.get("/", requireAuth, async (req, res) => {
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
        if (to) where.date.lte = new Date(to);
    } else if (since) {
        where.date = { gte: new Date(since) };
    } else {
        const last30 = new Date();
        last30.setDate(last30.getDate() - 30);
        where.date = { gte: last30 };
    }

    // Optional q: numeric columns OR same-day date OR text fields
    if (q && q.trim() !== "") {
        const n = Number(q);
        const isNum = Number.isFinite(n);

        let sameDayRange: { gte?: Date; lt?: Date } | null = null;
        const asDate = new Date(q);
        if (!isNaN(asDate.getTime())) {
            const start = new Date(asDate.getFullYear(), asDate.getMonth(), asDate.getDate());
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            sameDayRange = { gte: start, lt: end };
        }

        const textFilters = [
            {
                otherComments: {
                    contains: q,
                    mode: "insensitive" as const,
                },
            },
        ];

        where.OR = [
            ...(isNum
                ? [
                    { numOfAbdominalDistension: n },
                    { numOfAllergicRash: n },
                    { numOfChestDiscomfort: n },
                    { numOfDelirium: n },
                    { numOfDizziness: n },
                    { numOfEndotrachealIntubationDiscomfort: n },
                    { numOfEpigastricPain: n },
                    { numOfItching: n },
                    { numOfNauseaAndVomiting: n },
                    { numOfNauseaAndVomitingAndDizziness: n },
                    { numOfOther: n },
                    { numOfProlongedAnestheticRecovery: n },
                    { numOfPunctureSiteAbnormality: n },
                    { numOfTourniquetReaction: n },
                ]
                : textFilters),
            ...(sameDayRange ? [{ date: sameDayRange }] : []),
        ];
    }

    const [total, items, agg] = await Promise.all([
        prisma.afterSurgeryTableTwo.count({ where }),
        prisma.afterSurgeryTableTwo.findMany({
            where,
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
            skip,
            take,
        }),
        prisma.afterSurgeryTableTwo.aggregate({
            where,
            _sum: {
                numOfAbdominalDistension: true,
                numOfAllergicRash: true,
                numOfChestDiscomfort: true,
                numOfDelirium: true,
                numOfDizziness: true,
                numOfEndotrachealIntubationDiscomfort: true,
                numOfEpigastricPain: true,
                numOfItching: true,
                numOfNauseaAndVomiting: true,
                numOfNauseaAndVomitingAndDizziness: true,
                numOfOther: true,
                numOfProlongedAnestheticRecovery: true,
                numOfPunctureSiteAbnormality: true,
                numOfTourniquetReaction: true,
            },
        }),
    ]);

    res.json({
        total,
        page: _page,
        pageSize: _pageSize,
        items,
        sums: {
            numOfAbdominalDistension: agg._sum.numOfAbdominalDistension ?? 0,
            numOfAllergicRash: agg._sum.numOfAllergicRash ?? 0,
            numOfChestDiscomfort: agg._sum.numOfChestDiscomfort ?? 0,
            numOfDelirium: agg._sum.numOfDelirium ?? 0,
            numOfDizziness: agg._sum.numOfDizziness ?? 0,
            numOfEndotrachealIntubationDiscomfort: agg._sum.numOfEndotrachealIntubationDiscomfort ?? 0,
            numOfEpigastricPain: agg._sum.numOfEpigastricPain ?? 0,
            numOfItching: agg._sum.numOfItching ?? 0,
            numOfNauseaAndVomiting: agg._sum.numOfNauseaAndVomiting ?? 0,
            numOfNauseaAndVomitingAndDizziness: agg._sum.numOfNauseaAndVomitingAndDizziness ?? 0,
            numOfOther: agg._sum.numOfOther ?? 0,
            numOfProlongedAnestheticRecovery: agg._sum.numOfProlongedAnestheticRecovery ?? 0,
            numOfPunctureSiteAbnormality: agg._sum.numOfPunctureSiteAbnormality ?? 0,
            numOfTourniquetReaction: agg._sum.numOfTourniquetReaction ?? 0,
        },
    });
});

/**
 * POST /api/table-two
 * Body:
 *  - date?: string (YYYY-MM-DD) – defaults to now

 */
tableTwo.post("/", requireAuth, async (req, res) => {
    const b = req.body || {};
    const toNullableInt = (v: any): number | null => {
        if (v === "" || v === null || v === undefined) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };
    const toNullableString = (v: any): string | null => {
        if (v === "" || v === null || v === undefined) return null;
        const s = String(v).trim();
        return s.length ? s : null;
    };

    const dateVal: Date = b.date ? new Date(b.date) : new Date();

    const created = await prisma.afterSurgeryTableTwo.create({
        data: {
            userId: req.user!.id,
            date: dateVal,
            otherComments: toNullableString(b.otherComments),
            numOfAbdominalDistension: toNullableInt(b.numOfAbdominalDistension),
            numOfAllergicRash: toNullableInt(b.numOfAllergicRash),
            numOfChestDiscomfort: toNullableInt(b.numOfChestDiscomfort),
            numOfDelirium: toNullableInt(b.numOfDelirium),
            numOfDizziness: toNullableInt(b.numOfDizziness),
            numOfEndotrachealIntubationDiscomfort: toNullableInt(b.numOfEndotrachealIntubationDiscomfort),
            numOfEpigastricPain: toNullableInt(b.numOfEpigastricPain),
            numOfItching: toNullableInt(b.numOfItching),
            numOfNauseaAndVomiting: toNullableInt(b.numOfNauseaAndVomiting),
            numOfNauseaAndVomitingAndDizziness: toNullableInt(b.numOfNauseaAndVomitingAndDizziness),
            numOfOther: toNullableInt(b.numOfOther),
            numOfProlongedAnestheticRecovery: toNullableInt(b.numOfProlongedAnestheticRecovery),
            numOfPunctureSiteAbnormality: toNullableInt(b.numOfPunctureSiteAbnormality),
            numOfTourniquetReaction: toNullableInt(b.numOfTourniquetReaction),
        },
    });

    res.json(created);
});

/**
 * DELETE /api/table-two/:id
 */
tableTwo.delete("/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const row = await prisma.afterSurgeryTableTwo.findUnique({ where: { id } });
    if (!row || row.userId !== req.user!.id) {
        return res.status(404).json({ error: "Not found" });
    }

    await prisma.afterSurgeryTableTwo.delete({ where: { id } }); // fixed: was TableFour
    res.json({ ok: true });
});
