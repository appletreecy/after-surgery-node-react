import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    PieChart,
    Pie,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from "recharts";

type Row = {
    id: number;
    date: string | null;
    otherComments: string | null;
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
    createdAt: string;
};

type Sums = {
    numOfAbdominalDistension: number;
    numOfAllergicRash: number;
    numOfChestDiscomfort: number;
    numOfDelirium: number;
    numOfDizziness: number;
    numOfEndotrachealIntubationDiscomfort: number;
    numOfEpigastricPain: number;
    numOfItching: number;
    numOfNauseaAndVomiting: number;
    numOfNauseaAndVomitingAndDizziness: number;
    numOfOther: number;
    numOfProlongedAnestheticRecovery: number;
    numOfPunctureSiteAbnormality: number;
    numOfTourniquetReaction: number;
};

type CreatePayload = {
    date?: string | null;
    otherComments: string | null;
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
};

function fmtDateYYYYMMDD(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function pct(numerator: number, denominator: number, digits = 2) {
    if (!denominator || denominator <= 0) return "0%";
    return `${((numerator / denominator) * 100).toFixed(digits)}%`;
}

// --- i18n ---
type Lang = "en" | "zh";
const STRINGS: Record<Lang, Record<string, string>> = {
    en: {
        startDate: "Start date",
        endDate: "End date",
        to: "to",
        apply: "Apply",
        searchPlaceholder: "Search (optional)",
        search: "Search",
        addRecord: "Add Record",
        exportCsv: "Export CSV",
        exportXlsx: "Export Excel",
        showing: "Showing",
        of: "of",
        date: "Date",
        toggleSort: "Toggle sort",
        delete: "Delete",
        totals: "(Σ)",
        visits: "visits",
        totalXOfSum: "Total {{x}} / {{sum}}",
        noEntries: "No entries found.",
        page: "Page",
        prev: "Prev",
        next: "Next",
        // Field labels
        abdominalDistension: "Abdominal Distension",
        allergicRash: "Allergic Rash",
        chestDiscomfort: "Chest Discomfort",
        delirium: "Delirium",
        dizziness: "Dizziness",
        endotrachealIntubationDiscomfort: "Endotracheal Intubation Discomfort",
        epigastricPain: "Epigastric Pain",
        itching: "Itching",
        nauseaAndVomiting: "Nausea and Vomiting",
        nauseaAndVomitingAndDizziness: "Nausea, Vomiting and Dizziness",
        other: "Other",
        prolongedAnestheticRecovery: "Prolonged Anesthetic Recovery",
        punctureSiteAbnormality: "Puncture Site Abnormality",
        tourniquetReaction: "Tourniquet Reaction",
        otherComments: "Other Comments",
        vsOther: "vs Other",
        // Placeholders
        placeholderAbdominalDistension: "Abdominal distension count",
        placeholderAllergicRash: "Allergic rash count",
        placeholderChestDiscomfort: "Chest discomfort count",
        placeholderDelirium: "Delirium count",
        placeholderDizziness: "Dizziness count",
        placeholderEndotrachealIntubationDiscomfort: "Endotracheal intubation discomfort count",
        placeholderEpigastricPain: "Epigastric pain count",
        placeholderItching: "Itching count",
        placeholderNauseaAndVomiting: "Nausea and vomiting count",
        placeholderNauseaAndVomitingAndDizziness: "Nausea, vomiting and dizziness count",
        placeholderOther: "Other count",
        placeholderProlongedAnestheticRecovery: "Prolonged anesthetic recovery count",
        placeholderPunctureSiteAbnormality: "Puncture site abnormality count",
        placeholderTourniquetReaction: "Tourniquet reaction count",
        placeholderOtherComments: "Additional comments or notes",
    },
    zh: {
        startDate: "开始日期",
        endDate: "结束日期",
        to: "至",
        apply: "应用",
        searchPlaceholder: "搜索（可选）",
        search: "搜索",
        addRecord: "新增记录",
        exportCsv: "导出 CSV",
        exportXlsx: "导出 Excel",
        showing: "显示",
        of: "共",
        date: "日期",
        toggleSort: "切换排序",
        delete: "删除",
        totals: "（合计）",
        visits: "次",
        totalXOfSum: "总{{x}} / {{sum}}",
        noEntries: "暂无数据。",
        page: "第",
        prev: "上一页",
        next: "下一页",
        // Field labels
        abdominalDistension: "腹胀",
        allergicRash: "过敏性皮疹",
        chestDiscomfort: "胸闷",
        delirium: "谵妄",
        dizziness: "头晕",
        endotrachealIntubationDiscomfort: "气管插管不适",
        epigastricPain: "上腹痛",
        itching: "瘙痒",
        nauseaAndVomiting: "恶心呕吐",
        nauseaAndVomitingAndDizziness: "恶心呕吐及头晕",
        other: "其他",
        prolongedAnestheticRecovery: "麻醉恢复延迟",
        punctureSiteAbnormality: "穿刺部位异常",
        tourniquetReaction: "止血带反应",
        otherComments: "其他备注",
        vsOther: "对比其他",
        // Placeholders
        placeholderAbdominalDistension: "腹胀例数",
        placeholderAllergicRash: "过敏性皮疹例数",
        placeholderChestDiscomfort: "胸闷例数",
        placeholderDelirium: "谵妄例数",
        placeholderDizziness: "头晕例数",
        placeholderEndotrachealIntubationDiscomfort: "气管插管不适例数",
        placeholderEpigastricPain: "上腹痛例数",
        placeholderItching: "瘙痒例数",
        placeholderNauseaAndVomiting: "恶心呕吐例数",
        placeholderNauseaAndVomitingAndDizziness: "恶心呕吐及头晕例数",
        placeholderOther: "其他例数",
        placeholderProlongedAnestheticRecovery: "麻醉恢复延迟例数",
        placeholderPunctureSiteAbnormality: "穿刺部位异常例数",
        placeholderTourniquetReaction: "止血带反应例数",
        placeholderOtherComments: "其他备注或说明",
    },
};

function useI18n() {
    const [lang, setLang] = useState<Lang>("en");
    const t = (key: string, vars?: Record<string, string | number>) => {
        const raw = STRINGS[lang][key] ?? key;
        if (!vars) return raw;
        return Object.keys(vars).reduce(
            (s, k) => s.replaceAll(`{{${k}}}`, String(vars[k])),
            raw
        );
    };
    return { lang, setLang, t };
}

// Distinct colors for all 14 pie charts
const OTHER_COLOR = "#E5E7EB"; // gray for "Other"
const PIE_COLORS = [
    "#2563EB", // 0 - blue
    "#EF4444", // 1 - red
    "#10B981", // 2 - emerald
    "#F59E0B", // 3 - amber
    "#8B5CF6", // 4 - violet
    "#EC4899", // 5 - pink
    "#14B8A6", // 6 - teal
    "#F97316", // 7 - orange
    "#3B82F6", // 8 - sky blue
    "#84CC16", // 9 - lime
    "#D946EF", // 10 - fuchsia
    "#A855F7", // 11 - purple
    "#22C55E", // 12 - green
    "#E11D48", // 13 - rose
];

export default function TableTwo() {
    const { lang, setLang, t } = useI18n();

    const [items, setItems] = useState<Row[]>([]);
    const [total, setTotal] = useState(0);
    const [sums, setSums] = useState<Sums>({
        numOfAbdominalDistension: 0,
        numOfAllergicRash: 0,
        numOfChestDiscomfort: 0,
        numOfDelirium: 0,
        numOfDizziness: 0,
        numOfEndotrachealIntubationDiscomfort: 0,
        numOfEpigastricPain: 0,
        numOfItching: 0,
        numOfNauseaAndVomiting: 0,
        numOfNauseaAndVomitingAndDizziness: 0,
        numOfOther: 0,
        numOfProlongedAnestheticRecovery: 0,
        numOfPunctureSiteAbnormality: 0,
        numOfTourniquetReaction: 0,
    });

    const [page, setPage] = useState(1);
    const pageSize = 20;

    const [q, setQ] = useState("");

    // sort state for Date
    const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");

    // default date range = last 30 days to today
    const today = fmtDateYYYYMMDD(new Date());
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const [from, setFrom] = useState(fmtDateYYYYMMDD(last30));
    const [to, setTo] = useState(today);

    // add dialog form
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        date: "",
        otherComments: "",
        numOfAbdominalDistension: "",
        numOfAllergicRash: "",
        numOfChestDiscomfort: "",
        numOfDelirium: "",
        numOfDizziness: "",
        numOfEndotrachealIntubationDiscomfort: "",
        numOfEpigastricPain: "",
        numOfItching: "",
        numOfNauseaAndVomiting: "",
        numOfNauseaAndVomitingAndDizziness: "",
        numOfOther: "",
        numOfProlongedAnestheticRecovery: "",
        numOfPunctureSiteAbnormality: "",
        numOfTourniquetReaction: "",
    });

    // -------- Data fetching ----------
    async function load() {
        const params: any = { page, pageSize };
        if (from) params.from = from;
        if (to) params.to = to;

        const r = await api.get("/table-two", { params });
        setItems(r.data.items || []);
        setTotal(r.data.total || 0);
        if (r.data.sums) setSums(r.data.sums);
    }

    // initial load and whenever page changes
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    function toIntOrNull(v: string) {
        if (v === "" || v == null) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }

    function toStrOrNull(v: string) {
        if (v == null) return null;
        const s = String(v).trim();
        return s.length ? s : null;
    }

    async function create() {
        const payload: CreatePayload = {
            date: form.date || null,
            otherComments: toStrOrNull(form.otherComments),
            numOfAbdominalDistension: toIntOrNull(form.numOfAbdominalDistension),
            numOfAllergicRash: toIntOrNull(form.numOfAllergicRash),
            numOfChestDiscomfort: toIntOrNull(form.numOfChestDiscomfort),
            numOfDelirium: toIntOrNull(form.numOfDelirium),
            numOfDizziness: toIntOrNull(form.numOfDizziness),
            numOfEndotrachealIntubationDiscomfort: toIntOrNull(form.numOfEndotrachealIntubationDiscomfort),
            numOfEpigastricPain: toIntOrNull(form.numOfEpigastricPain),
            numOfItching: toIntOrNull(form.numOfItching),
            numOfNauseaAndVomiting: toIntOrNull(form.numOfNauseaAndVomiting),
            numOfNauseaAndVomitingAndDizziness: toIntOrNull(form.numOfNauseaAndVomitingAndDizziness),
            numOfOther: toIntOrNull(form.numOfOther),
            numOfProlongedAnestheticRecovery: toIntOrNull(form.numOfProlongedAnestheticRecovery),
            numOfPunctureSiteAbnormality: toIntOrNull(form.numOfPunctureSiteAbnormality),
            numOfTourniquetReaction: toIntOrNull(form.numOfTourniquetReaction),
        };
        await api.post("/table-two", payload);
        setOpen(false);
        setForm({
            date: "",
            otherComments: "",
            numOfAbdominalDistension: "",
            numOfAllergicRash: "",
            numOfChestDiscomfort: "",
            numOfDelirium: "",
            numOfDizziness: "",
            numOfEndotrachealIntubationDiscomfort: "",
            numOfEpigastricPain: "",
            numOfItching: "",
            numOfNauseaAndVomiting: "",
            numOfNauseaAndVomitingAndDizziness: "",
            numOfOther: "",
            numOfProlongedAnestheticRecovery: "",
            numOfPunctureSiteAbnormality: "",
            numOfTourniquetReaction: "",
        });
        setPage(1);
        await load();
    }

    async function remove(id: number) {
        await api.delete(`/table-two/${id}`);
        await load();
    }

    function applyDates() {
        // swap if from > to
        if (from && to && new Date(from) > new Date(to)) {
            const tmp = from;
            setFrom(to);
            setTo(tmp);
            setTimeout(() => {
                setPage(1);
                load();
            }, 0);
            return;
        }
        setPage(1);
        load();
    }

    function runSearch() {
        // client-side only for current page (already handled in filtered)
    }

    // helper for sorting by date or createdAt
    function rowTime(r: Row) {
        const d = r.date ? new Date(r.date) : new Date(r.createdAt);
        const t = d.getTime();
        return Number.isFinite(t) ? t : 0;
    }

    // client-side quick filter + sort (totals remain server-side)
    const filtered = useMemo(() => {
        const base = (() => {
            if (!q) return items;
            const tLower = q.toLowerCase();
            return items.filter((r) => {
                const fields = [
                    r.numOfAbdominalDistension,
                    r.numOfAllergicRash,
                    r.numOfChestDiscomfort,
                    r.numOfDelirium,
                    r.numOfDizziness,
                    r.numOfEndotrachealIntubationDiscomfort,
                    r.numOfEpigastricPain,
                    r.numOfItching,
                    r.numOfNauseaAndVomiting,
                    r.numOfNauseaAndVomitingAndDizziness,
                    r.numOfOther,
                    r.numOfProlongedAnestheticRecovery,
                    r.numOfPunctureSiteAbnormality,
                    r.numOfTourniquetReaction,
                    r.otherComments ?? "",
                    r.date ? new Date(r.date).toLocaleDateString() : "",
                    new Date(r.createdAt ?? "").toLocaleDateString(),
                ].map((v) => (v == null ? "" : String(v).toLowerCase()));
                return fields.some((f) => f.includes(tLower));
            });
        })();

        return base.slice().sort((a, b) =>
            dateSort === "asc" ? rowTime(a) - rowTime(b) : rowTime(b) - rowTime(a)
        );
    }, [q, items, dateSort]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const showingFrom = total ? (page - 1) * pageSize + 1 : 0;
    const showingTo = Math.min(total, page * pageSize);

    // -------- Percentages & pies ----------
    const sumTotal =
        (sums.numOfAbdominalDistension || 0) +
        (sums.numOfAllergicRash || 0) +
        (sums.numOfChestDiscomfort || 0) +
        (sums.numOfDelirium || 0) +
        (sums.numOfDizziness || 0) +
        (sums.numOfEndotrachealIntubationDiscomfort || 0) +
        (sums.numOfEpigastricPain || 0) +
        (sums.numOfItching || 0) +
        (sums.numOfNauseaAndVomiting || 0) +
        (sums.numOfNauseaAndVomitingAndDizziness || 0) +
        (sums.numOfOther || 0) +
        (sums.numOfProlongedAnestheticRecovery || 0) +
        (sums.numOfPunctureSiteAbnormality || 0) +
        (sums.numOfTourniquetReaction || 0);

    // ===== Sums =====
    const abdominalDistensionSum = sums.numOfAbdominalDistension || 0;
    const allergicRashSum = sums.numOfAllergicRash || 0;
    const chestDiscomfortSum = sums.numOfChestDiscomfort || 0;
    const deliriumSum = sums.numOfDelirium || 0;
    const dizzinessSum = sums.numOfDizziness || 0;
    const endotrachealIntubationDiscomfortSum = sums.numOfEndotrachealIntubationDiscomfort || 0;
    const epigastricPainSum = sums.numOfEpigastricPain || 0;
    const itchingSum = sums.numOfItching || 0;
    const nauseaAndVomitingSum = sums.numOfNauseaAndVomiting || 0;
    const nauseaAndVomitingAndDizzinessSum = sums.numOfNauseaAndVomitingAndDizziness || 0;
    const otherSum = sums.numOfOther || 0;
    const prolongedAnestheticRecoverySum = sums.numOfProlongedAnestheticRecovery || 0;
    const punctureSiteAbnormalitySum = sums.numOfPunctureSiteAbnormality || 0;
    const tourniquetReactionSum = sums.numOfTourniquetReaction || 0;

    // ===== Percentages =====
    const abdominalDistensionPct = pct(abdominalDistensionSum, sumTotal);
    const allergicRashPct = pct(allergicRashSum, sumTotal);
    const chestDiscomfortPct = pct(chestDiscomfortSum, sumTotal);
    const deliriumPct = pct(deliriumSum, sumTotal);
    const dizzinessPct = pct(dizzinessSum, sumTotal);
    const endotrachealIntubationDiscomfortPct = pct(endotrachealIntubationDiscomfortSum, sumTotal);
    const epigastricPainPct = pct(epigastricPainSum, sumTotal);
    const itchingPct = pct(itchingSum, sumTotal);
    const nauseaAndVomitingPct = pct(nauseaAndVomitingSum, sumTotal);
    const nauseaAndVomitingAndDizzinessPct = pct(nauseaAndVomitingAndDizzinessSum, sumTotal);
    const otherPct = pct(otherSum, sumTotal);
    const prolongedAnestheticRecoveryPct = pct(prolongedAnestheticRecoverySum, sumTotal);
    const punctureSiteAbnormalityPct = pct(punctureSiteAbnormalitySum, sumTotal);
    const tourniquetReactionPct = pct(tourniquetReactionSum, sumTotal);

    // ===== “Other” totals for Pie Charts =====
    const abdominalDistensionSumOther = Math.max(0, sumTotal - abdominalDistensionSum);
    const allergicRashSumOther = Math.max(0, sumTotal - allergicRashSum);
    const chestDiscomfortSumOther = Math.max(0, sumTotal - chestDiscomfortSum);
    const deliriumSumOther = Math.max(0, sumTotal - deliriumSum);
    const dizzinessSumOther = Math.max(0, sumTotal - dizzinessSum);
    const endotrachealIntubationDiscomfortSumOther = Math.max(0, sumTotal - endotrachealIntubationDiscomfortSum);
    const epigastricPainSumOther = Math.max(0, sumTotal - epigastricPainSum);
    const itchingSumOther = Math.max(0, sumTotal - itchingSum);
    const nauseaAndVomitingSumOther = Math.max(0, sumTotal - nauseaAndVomitingSum);
    const nauseaAndVomitingAndDizzinessSumOther = Math.max(0, sumTotal - nauseaAndVomitingAndDizzinessSum);
    const otherSumOther = Math.max(0, sumTotal - otherSum);
    const prolongedAnestheticRecoverySumOther = Math.max(0, sumTotal - prolongedAnestheticRecoverySum);
    const punctureSiteAbnormalitySumOther = Math.max(0, sumTotal - punctureSiteAbnormalitySum);
    const tourniquetReactionSumOther = Math.max(0, sumTotal - tourniquetReactionSum);

    // ===== Labels =====
    const L = {
        abdominalDistensionSum: t("abdominalDistension"),
        allergicRashSum: t("allergicRash"),
        chestDiscomfortSum: t("chestDiscomfort"),
        deliriumSum: t("delirium"),
        dizzinessSum: t("dizziness"),
        endotrachealIntubationDiscomfortSum: t("endotrachealIntubationDiscomfort"),
        epigastricPainSum: t("epigastricPain"),
        itchingSum: t("itching"),
        nauseaAndVomitingSum: t("nauseaAndVomiting"),
        nauseaAndVomitingAndDizzinessSum: t("nauseaAndVomitingAndDizziness"),
        otherSum: t("other"),
        prolongedAnestheticRecoverySum: t("prolongedAnestheticRecovery"),
        punctureSiteAbnormalitySum: t("punctureSiteAbnormality"),
        tourniquetReactionSum: t("tourniquetReaction"),
        vsOther: t("vsOther"),
    };

    // ===== Pie Chart Data =====
    const abdominalDistensionSumPie = [
        { name: L.abdominalDistensionSum, value: abdominalDistensionSum },
        { name: "Other", value: abdominalDistensionSumOther },
    ];
    const allergicRashSumPie = [
        { name: L.allergicRashSum, value: allergicRashSum },
        { name: "Other", value: allergicRashSumOther },
    ];
    const chestDiscomfortSumPie = [
        { name: L.chestDiscomfortSum, value: chestDiscomfortSum },
        { name: "Other", value: chestDiscomfortSumOther },
    ];
    const deliriumSumPie = [
        { name: L.deliriumSum, value: deliriumSum },
        { name: "Other", value: deliriumSumOther },
    ];
    const dizzinessSumPie = [
        { name: L.dizzinessSum, value: dizzinessSum },
        { name: "Other", value: dizzinessSumOther },
    ];
    const endotrachealIntubationDiscomfortSumPie = [
        { name: L.endotrachealIntubationDiscomfortSum, value: endotrachealIntubationDiscomfortSum },
        { name: "Other", value: endotrachealIntubationDiscomfortSumOther },
    ];
    const epigastricPainSumPie = [
        { name: L.epigastricPainSum, value: epigastricPainSum },
        { name: "Other", value: epigastricPainSumOther },
    ];
    const itchingSumPie = [
        { name: L.itchingSum, value: itchingSum },
        { name: "Other", value: itchingSumOther },
    ];
    const nauseaAndVomitingSumPie = [
        { name: L.nauseaAndVomitingSum, value: nauseaAndVomitingSum },
        { name: "Other", value: nauseaAndVomitingSumOther },
    ];
    const nauseaAndVomitingAndDizzinessSumPie = [
        { name: L.nauseaAndVomitingAndDizzinessSum, value: nauseaAndVomitingAndDizzinessSum },
        { name: "Other", value: nauseaAndVomitingAndDizzinessSumOther },
    ];
    const otherSumPie = [
        { name: L.otherSum, value: otherSum },
        { name: "Other", value: otherSumOther },
    ];
    const prolongedAnestheticRecoverySumPie = [
        { name: L.prolongedAnestheticRecoverySum, value: prolongedAnestheticRecoverySum },
        { name: "Other", value: prolongedAnestheticRecoverySumOther },
    ];
    const punctureSiteAbnormalitySumPie = [
        { name: L.punctureSiteAbnormalitySum, value: punctureSiteAbnormalitySum },
        { name: "Other", value: punctureSiteAbnormalitySumOther },
    ];
    const tourniquetReactionSumPie = [
        { name: L.tourniquetReactionSum, value: tourniquetReactionSum },
        { name: "Other", value: tourniquetReactionSumOther },
    ];

    // -------- Frontend-only export helpers ----------
    async function fetchAllRowsForRange() {
        const pageSizeAll = 500;
        let pageIdx = 1;
        let all: any[] = [];
        while (true) {
            const r = await api.get("/table-two", {
                params: { from, to, page: pageIdx, pageSize: pageSizeAll },
            });
            const batch = r.data.items || [];
            all = all.concat(batch);
            const totalCount = r.data.total || batch.length;
            if (all.length >= totalCount || batch.length === 0) break;
            pageIdx += 1;
        }
        return all;
    }

    function toYYYYMMDD(d: any) {
        if (!d) return "";
        const date = new Date(d);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().slice(0, 10);
    }

    function downloadBlob(blob: Blob, filename: string) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
    }

    async function exportCsv() {
        const rows = await fetchAllRowsForRange();

        const header = [
            "id",
            "date",
            "numOfAbdominalDistension",
            "numOfAllergicRash",
            "numOfChestDiscomfort",
            "numOfDelirium",
            "numOfDizziness",
            "numOfEndotrachealIntubationDiscomfort",
            "numOfEpigastricPain",
            "numOfItching",
            "numOfNauseaAndVomiting",
            "numOfNauseaAndVomitingAndDizziness",
            "numOfOther",
            "numOfProlongedAnestheticRecovery",
            "numOfPunctureSiteAbnormality",
            "numOfTourniquetReaction",
            "otherComments",
            "createdAt",
        ];

        const escapeCell = (v: any) => {
            const s = `${v ?? ""}`.replaceAll(`"`, `""`);
            return s.includes(",") || s.includes("\n") || s.includes(`"`) ? `"${s}"` : s;
        };

        const lines = [header.join(",")];
        for (const r of rows) {
            lines.push(
                [
                    r.id,
                    toYYYYMMDD(r.date),
                    r.numOfAbdominalDistension ?? "",
                    r.numOfAllergicRash ?? "",
                    r.numOfChestDiscomfort ?? "",
                    r.numOfDelirium ?? "",
                    r.numOfDizziness ?? "",
                    r.numOfEndotrachealIntubationDiscomfort ?? "",
                    r.numOfEpigastricPain ?? "",
                    r.numOfItching ?? "",
                    r.numOfNauseaAndVomiting ?? "",
                    r.numOfNauseaAndVomitingAndDizziness ?? "",
                    r.numOfOther ?? "",
                    r.numOfProlongedAnestheticRecovery ?? "",
                    r.numOfPunctureSiteAbnormality ?? "",
                    r.numOfTourniquetReaction ?? "",
                    r.otherComments ?? "",
                    r.createdAt ? new Date(r.createdAt).toISOString() : "",
                ]
                    .map(escapeCell)
                    .join(",")
            );
        }

        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        downloadBlob(blob, `table-two_${from || "all"}_${to || "all"}.csv`);
    }

    async function exportXlsx() {
        const rows = await fetchAllRowsForRange();

        const data = rows.map((r) => ({
            ID: r.id,
            Date: toYYYYMMDD(r.date),
            numOfAbdominalDistension: r.numOfAbdominalDistension ?? null,
            numOfAllergicRash: r.numOfAllergicRash ?? null,
            numOfChestDiscomfort: r.numOfChestDiscomfort ?? null,
            numOfDelirium: r.numOfDelirium ?? null,
            numOfDizziness: r.numOfDizziness ?? null,
            numOfEndotrachealIntubationDiscomfort: r.numOfEndotrachealIntubationDiscomfort ?? null,
            numOfEpigastricPain: r.numOfEpigastricPain ?? null,
            numOfItching: r.numOfItching ?? null,
            numOfNauseaAndVomiting: r.numOfNauseaAndVomiting ?? null,
            numOfNauseaAndVomitingAndDizziness: r.numOfNauseaAndVomitingAndDizziness ?? null,
            numOfOther: r.numOfOther ?? null,
            numOfProlongedAnestheticRecovery: r.numOfProlongedAnestheticRecovery ?? null,
            numOfPunctureSiteAbnormality: r.numOfPunctureSiteAbnormality ?? null,
            numOfTourniquetReaction: r.numOfTourniquetReaction ?? null,
            otherComments: r.otherComments ?? null,
            CreatedAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
        }));

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data, { cellDates: false });
        XLSX.utils.book_append_sheet(wb, ws, "TableTwo");

        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        downloadBlob(blob, `table-two_${from || "all"}_${to || "all"}.xlsx`);
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Language toggle */}
                <Button
                    variant="outline"
                    onClick={() => setLang((l) => (l === "en" ? "zh" : "en"))}
                    className="mr-2"
                    aria-label="Toggle language"
                    title={lang === "en" ? "切换到中文" : "Switch to English"}
                >
                    {lang === "en" ? "中文" : "EN"}
                </Button>

                <Input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-44"
                    aria-label={t("startDate")}
                />
                <span className="text-gray-500">{t("to")}</span>
                <Input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-44"
                    aria-label={t("endDate")}
                />
                <Button onClick={applyDates} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {t("apply")}
                </Button>

                <Input
                    placeholder={t("searchPlaceholder")}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-64"
                />
                <Button onClick={runSearch} variant="secondary" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {t("search")}
                </Button>

                <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {t("addRecord")}
                </Button>

                <Button onClick={exportCsv} variant="secondary" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {t("exportCsv")}
                </Button>
                <Button onClick={exportXlsx} variant="secondary" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {t("exportXlsx")}
                </Button>

                <div className="ml-auto text-sm text-gray-600">
                    {t("showing")} {showingFrom}–{showingTo} {t("of")} {total}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
                <table className="min-w-[640px] w-full text-sm">
                    <thead>
                    <tr className="text-left border-b bg-gray-50">
                        <th
                            className="py-2 px-3 cursor-pointer select-none"
                            onClick={() => setDateSort((s) => (s === "asc" ? "desc" : "asc"))}
                            aria-sort={dateSort === "asc" ? "ascending" : "descending"}
                            title={t("toggleSort")}
                        >
                            {t("date")} {dateSort === "asc" ? "▲" : "▼"}
                        </th>
                        <th className="px-3">{t("abdominalDistension")}</th>
                        <th className="px-3">{t("allergicRash")}</th>
                        <th className="px-3">{t("chestDiscomfort")}</th>
                        <th className="px-3">{t("delirium")}</th>
                        <th className="px-3">{t("dizziness")}</th>
                        <th className="px-3">{t("endotrachealIntubationDiscomfort")}</th>
                        <th className="px-3">{t("epigastricPain")}</th>
                        <th className="px-3">{t("itching")}</th>
                        <th className="px-3">{t("nauseaAndVomiting")}</th>
                        <th className="px-3">{t("nauseaAndVomitingAndDizziness")}</th>
                        <th className="px-3">{t("other")}</th>
                        <th className="px-3">{t("prolongedAnestheticRecovery")}</th>
                        <th className="px-3">{t("punctureSiteAbnormality")}</th>
                        <th className="px-3">{t("tourniquetReaction")}</th>
                        <th className="px-3">{t("otherComments")}</th>
                        <th className="px-3 w-32"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map((r) => (
                        <tr key={r.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">
                                {r.date ? new Date(r.date).toLocaleDateString() : new Date(r.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-3">{r.numOfAbdominalDistension ?? "0"}</td>
                            <td className="px-3">{r.numOfAllergicRash ?? "0"}</td>
                            <td className="px-3">{r.numOfChestDiscomfort ?? "0"}</td>
                            <td className="px-3">{r.numOfDelirium ?? "0"}</td>
                            <td className="px-3">{r.numOfDizziness ?? "0"}</td>
                            <td className="px-3">{r.numOfEndotrachealIntubationDiscomfort ?? "0"}</td>
                            <td className="px-3">{r.numOfEpigastricPain ?? "0"}</td>
                            <td className="px-3">{r.numOfItching ?? "0"}</td>
                            <td className="px-3">{r.numOfNauseaAndVomiting ?? "0"}</td>
                            <td className="px-3">{r.numOfNauseaAndVomitingAndDizziness ?? "0"}</td>
                            <td className="px-3">{r.numOfOther ?? "0"}</td>
                            <td className="px-3">{r.numOfProlongedAnestheticRecovery ?? "0"}</td>
                            <td className="px-3">{r.numOfPunctureSiteAbnormality ?? "0"}</td>
                            <td className="px-3">{r.numOfTourniquetReaction ?? "0"}</td>
                            <td className="px-3">{r.otherComments ?? "-"}</td>
                            <td className="px-3">
                                <Button onClick={() => remove(r.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                    {t("delete")}
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan={17} className="py-10 text-center text-gray-500">
                                {t("noEntries")}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-gray-600">
                    {t("page")} {page} / {totalPages}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                    >
                        {t("prev")}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                    >
                        {t("next")}
                    </Button>
                </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("abdominalDistension")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfAbdominalDistension}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("allergicRash")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfAllergicRash}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("chestDiscomfort")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfChestDiscomfort}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("delirium")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfDelirium}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("dizziness")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfDizziness}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("endotrachealIntubationDiscomfort")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfEndotrachealIntubationDiscomfort}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("epigastricPain")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfEpigastricPain}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("itching")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfItching}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("nauseaAndVomiting")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfNauseaAndVomiting}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("nauseaAndVomitingAndDizziness")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfNauseaAndVomitingAndDizziness}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("other")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfOther}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("prolongedAnestheticRecovery")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfProlongedAnestheticRecovery}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("punctureSiteAbnormality")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfPunctureSiteAbnormality}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("tourniquetReaction")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfTourniquetReaction}
                    </div>
                </div>
            </div>

            {/* Percentage text */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("abdominalDistension"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{abdominalDistensionPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {abdominalDistensionSum} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("allergicRash"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{allergicRashPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {allergicRashSum} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("chestDiscomfort"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{chestDiscomfortPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {chestDiscomfortSum} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("delirium"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{deliriumPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {deliriumSum} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("dizziness"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{dizzinessPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {dizzinessSum} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("endotrachealIntubationDiscomfort"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{endotrachealIntubationDiscomfortPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {endotrachealIntubationDiscomfortSum} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("epigastricPain"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{epigastricPainPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {epigastricPainSum} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("itching"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{itchingPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {itchingSum} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("nauseaAndVomiting"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{nauseaAndVomitingPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {nauseaAndVomitingSum} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("nauseaAndVomitingAndDizziness"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{nauseaAndVomitingAndDizzinessPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {nauseaAndVomitingAndDizzinessSum} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("other"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{otherPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {otherSum} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("prolongedAnestheticRecovery"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{prolongedAnestheticRecoveryPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {prolongedAnestheticRecoverySum} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("punctureSiteAbnormality"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{punctureSiteAbnormalityPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {punctureSiteAbnormalitySum} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("tourniquetReaction"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{tourniquetReactionPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {tourniquetReactionSum} / {sumTotal} {t("visits")}
                    </div>
                </div>
            </div>

            {/* Pies */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* 0 - Abdominal Distension vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">
                        {t("abdominalDistension")} {L.vsOther}
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={abdominalDistensionSumPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {abdominalDistensionSumPie.map((_, i) => (
                                        <Cell key={`abd-${i}`} fill={i === 0 ? PIE_COLORS[0] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {abdominalDistensionSum} {t("of")} {sumTotal} {t("visits")} ({abdominalDistensionPct})
                    </div>
                </div>

                {/* 1 - Allergic Rash vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">
                        {t("allergicRash")} {L.vsOther}
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={allergicRashSumPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {allergicRashSumPie.map((_, i) => (
                                        <Cell key={`rash-${i}`} fill={i === 0 ? PIE_COLORS[1] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {allergicRashSum} {t("of")} {sumTotal} {t("visits")} ({allergicRashPct})
                    </div>
                </div>

                {/* 2 - Chest Discomfort vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">
                        {t("chestDiscomfort")} {L.vsOther}
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={chestDiscomfortSumPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {chestDiscomfortSumPie.map((_, i) => (
                                        <Cell key={`chest-${i}`} fill={i === 0 ? PIE_COLORS[2] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {chestDiscomfortSum} {t("of")} {sumTotal} {t("visits")} ({chestDiscomfortPct})
                    </div>
                </div>

                {/* 3 - Delirium vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">
                        {t("delirium")} {L.vsOther}
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={deliriumSumPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {deliriumSumPie.map((_, i) => (
                                        <Cell key={`delirium-${i}`} fill={i === 0 ? PIE_COLORS[3] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {deliriumSum} {t("of")} {sumTotal} {t("visits")} ({deliriumPct})
                    </div>
                </div>

                {/* 4 - Dizziness vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">
                        {t("dizziness")} {L.vsOther}
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={dizzinessSumPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {dizzinessSumPie.map((_, i) => (
                                        <Cell key={`dizzy-${i}`} fill={i === 0 ? PIE_COLORS[4] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {dizzinessSum} {t("of")} {sumTotal} {t("visits")} ({dizzinessPct})
                    </div>
                </div>

                {/* 5 - Endotracheal Intubation Discomfort vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">
                        {t("endotrachealIntubationDiscomfort")} {L.vsOther}
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={endotrachealIntubationDiscomfortSumPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {endotrachealIntubationDiscomfortSumPie.map((_, i) => (
                                        <Cell key={`endo-${i}`} fill={i === 0 ? PIE_COLORS[5] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {endotrachealIntubationDiscomfortSum} {t("of")} {sumTotal} {t("visits")} ({endotrachealIntubationDiscomfortPct})
                    </div>
                </div>

                {/* 6 - Epigastric Pain vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">
                        {t("epigastricPain")} {L.vsOther}
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={epigastricPainSumPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {epigastricPainSumPie.map((_, i) => (
                                        <Cell key={`epi-${i}`} fill={i === 0 ? PIE_COLORS[6] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {epigastricPainSum} {t("of")} {sumTotal} {t("visits")} ({epigastricPainPct})
                    </div>
                </div>

                {/* 7 - Itching vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">
                        {t("itching")} {L.vsOther}
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={itchingSumPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {itchingSumPie.map((_, i) => (
                                        <Cell key={`itch-${i}`} fill={i === 0 ? PIE_COLORS[7] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {itchingSum} {t("of")} {sumTotal} {t("visits")} ({itchingPct})
                    </div>
                </div>

                {/* 8 - Nausea and Vomiting vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">
                        {t("nauseaAndVomiting")} {L.vsOther}
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={nauseaAndVomitingSumPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {nauseaAndVomitingSumPie.map((_, i) => (
                                        <Cell key={`nv-${i}`} fill={i === 0 ? PIE_COLORS[8] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {nauseaAndVomitingSum} {t("of")} {sumTotal} {t("visits")} ({nauseaAndVomitingPct})
                    </div>
                </div>

                {/* 9 - Nausea/Vomiting/Dizziness vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">
                        {t("nauseaAndVomitingAndDizziness")} {L.vsOther}
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={nauseaAndVomitingAndDizzinessSumPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {nauseaAndVomitingAndDizzinessSumPie.map((_, i) => (
                                        <Cell key={`nvd-${i}`} fill={i === 0 ? PIE_COLORS[9] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {nauseaAndVomitingAndDizzinessSum} {t("of")} {sumTotal} {t("visits")} ({nauseaAndVomitingAndDizzinessPct})
                    </div>
                </div>

                {/* 10 - Other vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">
                        {t("other")} {L.vsOther}
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={otherSumPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {otherSumPie.map((_, i) => (
                                        <Cell key={`other-${i}`} fill={i === 0 ? PIE_COLORS[10] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {otherSum} {t("of")} {sumTotal} {t("visits")} ({otherPct})
                    </div>
                </div>

                {/* 11 - Prolonged Anesthetic Recovery vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">
                        {t("prolongedAnestheticRecovery")} {L.vsOther}
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={prolongedAnestheticRecoverySumPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {prolongedAnestheticRecoverySumPie.map((_, i) => (
                                        <Cell key={`par-${i}`} fill={i === 0 ? PIE_COLORS[11] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {prolongedAnestheticRecoverySum} {t("of")} {sumTotal} {t("visits")} ({prolongedAnestheticRecoveryPct})
                    </div>
                </div>

                {/* 12 - Puncture Site Abnormality vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">
                        {t("punctureSiteAbnormality")} {L.vsOther}
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={punctureSiteAbnormalitySumPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {punctureSiteAbnormalitySumPie.map((_, i) => (
                                        <Cell key={`psa-${i}`} fill={i === 0 ? PIE_COLORS[12] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {punctureSiteAbnormalitySum} {t("of")} {sumTotal} {t("visits")} ({punctureSiteAbnormalityPct})
                    </div>
                </div>

                {/* 13 - Tourniquet Reaction vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">
                        {t("tourniquetReaction")} {L.vsOther}
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={tourniquetReactionSumPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {tourniquetReactionSumPie.map((_, i) => (
                                        <Cell key={`tourniquet-${i}`} fill={i === 0 ? PIE_COLORS[13] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {tourniquetReactionSum} {t("of")} {sumTotal} {t("visits")} ({tourniquetReactionPct})
                    </div>
                </div>
            </div>
            {/* Create dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-white/100 backdrop-blur-none max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{t("addRecord")}</DialogTitle>
                    </DialogHeader>

                    {/* Scrollable form area */}
                    <div className="mt-2 space-y-2 overflow-y-auto max-h-[70vh] pr-1 overflow-x-hidden w-full min-w-0">
                        <Input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderAbdominalDistension")}
                            value={form.numOfAbdominalDistension}
                            onChange={(e) => setForm({ ...form, numOfAbdominalDistension: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderAllergicRash")}
                            value={form.numOfAllergicRash}
                            onChange={(e) => setForm({ ...form, numOfAllergicRash: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderChestDiscomfort")}
                            value={form.numOfChestDiscomfort}
                            onChange={(e) => setForm({ ...form, numOfChestDiscomfort: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderDelirium")}
                            value={form.numOfDelirium}
                            onChange={(e) => setForm({ ...form, numOfDelirium: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderDizziness")}
                            value={form.numOfDizziness}
                            onChange={(e) => setForm({ ...form, numOfDizziness: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderEndotrachealIntubationDiscomfort")}
                            value={form.numOfEndotrachealIntubationDiscomfort}
                            onChange={(e) =>
                                setForm({ ...form, numOfEndotrachealIntubationDiscomfort: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderEpigastricPain")}
                            value={form.numOfEpigastricPain}
                            onChange={(e) => setForm({ ...form, numOfEpigastricPain: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderItching")}
                            value={form.numOfItching}
                            onChange={(e) => setForm({ ...form, numOfItching: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderNauseaAndVomiting")}
                            value={form.numOfNauseaAndVomiting}
                            onChange={(e) => setForm({ ...form, numOfNauseaAndVomiting: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderNauseaAndVomitingAndDizziness")}
                            value={form.numOfNauseaAndVomitingAndDizziness}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    numOfNauseaAndVomitingAndDizziness: e.target.value,
                                })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderOther")}
                            value={form.numOfOther}
                            onChange={(e) => setForm({ ...form, numOfOther: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderProlongedAnestheticRecovery")}
                            value={form.numOfProlongedAnestheticRecovery}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    numOfProlongedAnestheticRecovery: e.target.value,
                                })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderPunctureSiteAbnormality")}
                            value={form.numOfPunctureSiteAbnormality}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    numOfPunctureSiteAbnormality: e.target.value,
                                })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderTourniquetReaction")}
                            value={form.numOfTourniquetReaction}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    numOfTourniquetReaction: e.target.value,
                                })
                            }
                        />
                        <Input
                            type="text"
                            placeholder={t("placeholderOtherComments")}
                            value={form.otherComments}
                            onChange={(e) => setForm({ ...form, otherComments: e.target.value })}
                        />

                        <Button onClick={create} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {t("addRecord")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
