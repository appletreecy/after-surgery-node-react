import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const tableFive = Router();

/**
 * GET /api/table-five
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
tableFive.get("/", requireAuth, async (req, res) => {
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
                criticalPatientsName: {
                    contains: q,
                    mode: "insensitive" as const,
                },
            },
            {
                visitFindingsForCriticalPatient: {
                    contains: q,
                    mode: "insensitive" as const,
                },
            },
        ];

        where.OR = [
            ...(isNum
                ? [
                    { numberOfCriticalRescueCases: n },
                    { numberOfDeaths: n },
                    { numberOfFollowUpsForCriticallyIllPatients: n },
                ]
                : textFilters),
            ...(sameDayRange ? [{ date: sameDayRange }] : []),
        ];
    }

    const [total, items, agg] = await Promise.all([
        prisma.afterSurgeryTableFive.count({ where }),
        prisma.afterSurgeryTableFive.findMany({
            where,
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
            skip,
            take,
        }),
        prisma.afterSurgeryTableFive.aggregate({
            where,
            _sum: {
                numberOfCriticalRescueCases: true,
                numberOfDeaths: true,
                numberOfFollowUpsForCriticallyIllPatients: true,
            },
        }),
    ]);

    res.json({
        total,
        page: _page,
        pageSize: _pageSize,
        items,
        sums: {
            numberOfCriticalRescueCases: agg._sum.numberOfCriticalRescueCases ?? 0,
            numberOfDeaths: agg._sum.numberOfDeaths ?? 0,
            numberOfFollowUpsForCriticallyIllPatients: agg._sum.numberOfFollowUpsForCriticallyIllPatients ?? 0,
        },
    });
});

/**
 * POST /api/table-five
 * Body:
 *  - date?: string (YYYY-MM-DD) – defaults to now
 *  - criticalPatientsName?: string
 *  - visitFindingsForCriticalPatient?: string
 *  - numberOfCriticalRescueCases?: number
 *  - numberOfDeaths?: number
 *  - numberOfFollowUpsForCriticallyIllPatients?: number
 */
tableFive.post("/", requireAuth, async (req, res) => {
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

    const created = await prisma.afterSurgeryTableFive.create({
        data: {
            userId: req.user!.id,
            date: dateVal,
            criticalPatientsName: toNullableString(b.criticalPatientsName),
            visitFindingsForCriticalPatient: toNullableString(b.visitFindingsForCriticalPatient),
            numberOfCriticalRescueCases: toNullableInt(b.numberOfCriticalRescueCases),
            numberOfDeaths: toNullableInt(b.numberOfDeaths),
            numberOfFollowUpsForCriticallyIllPatients: toNullableInt(b.numberOfFollowUpsForCriticallyIllPatients),
        },
    });

    res.json(created);
});

/**
 * DELETE /api/table-five/:id
 */
tableFive.delete("/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const row = await prisma.afterSurgeryTableFive.findUnique({ where: { id } });
    if (!row || row.userId !== req.user!.id) {
        return res.status(404).json({ error: "Not found" });
    }

    await prisma.afterSurgeryTableFive.delete({ where: { id } }); // fixed: was TableFour
    res.json({ ok: true });
});
