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
    createdAt: string;
};

type Sums = {
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

type CreatePayload = {
    date?: string | null;
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
        joint: "Joint Complication",
        motor: "Motor Dysfunction",
        trauma: "Trauma Complication",
        ankle: "Ankle Complication",
        pediatric: "Pediatric Adverse Event",
        spinal: "Spinal Complication",
        hand: "Hand Surgery Complication",
        obstetric: "Obstetric Adverse Event",
        gyn: "Gynecological Adverse Event",
        surgical: "Surgical Treatment",
        delete: "Delete",
        totals: "(Σ)",
        visits: "visits",
        totalXOfSum: "Total {{x}} / tableThreeSumNumber",
        otherVisits: "Other Visits",
        vsOther: "vs Other Visits",
        dialogTitle: "New entry",
        create: "Create",
        placeholderJoint: "Joint Complication Count",
        placeholderMotor: "Motor Dysfunction Count",
        placeholderTrauma: "Trauma Complication Count",
        placeholderAnkle: "Ankle Complication Count",
        placeholderPediatric: "Pediatric Adverse Event Count",
        placeholderSpinal: "Spinal Complication Count",
        placeholderHand: "Hand Surgery Complication Count",
        placeholderObstetric: "Obstetric Adverse Event Count",
        placeholderGyn: "Gynecological Adverse Event Count",
        placeholderSurgical: "Surgical Treatment Count",
        noEntries: "No entries found.",
        page: "Page",
        prev: "Prev",
        next: "Next",
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
        joint: "关节并发症",
        motor: "运动功能障碍",
        trauma: "创伤并发症",
        ankle: "踝关节并发症",
        pediatric: "儿科不良事件",
        spinal: "脊柱并发症",
        hand: "手外科并发症",
        obstetric: "产科不良事件",
        gyn: "妇科不良事件",
        surgical: "外科治疗",
        delete: "删除",
        totals: "（合计）",
        visits: "次",
        totalXOfSum: "总{{x}} / 总数",
        otherVisits: "其他",
        vsOther: "与其他对比",
        dialogTitle: "新建条目",
        create: "创建",
        placeholderJoint: "关节并发症数量",
        placeholderMotor: "运动功能障碍数量",
        placeholderTrauma: "创伤并发症数量",
        placeholderAnkle: "踝关节并发症数量",
        placeholderPediatric: "儿科不良事件数量",
        placeholderSpinal: "脊柱并发症数量",
        placeholderHand: "手外科并发症数量",
        placeholderObstetric: "产科不良事件数量",
        placeholderGyn: "妇科不良事件数量",
        placeholderSurgical: "外科治疗数量",
        noEntries: "暂无数据。",
        page: "第",
        prev: "上一页",
        next: "下一页",
    },
};

function useI18n() {
    const [lang, setLang] = useState<Lang>("en");
    const t = (key: string, vars?: Record<string, string | number>) => {
        const raw = STRINGS[lang][key] ?? key;
        if (!vars) return raw;
        return Object.keys(vars).reduce((s, k) => s.replaceAll(`{{${k}}}`, String(vars[k])), raw);
    };
    return { lang, setLang, t };
}

export default function TableThree() {
    const { lang, setLang, t } = useI18n();

    const [items, setItems] = useState<Row[]>([]);
    const [total, setTotal] = useState(0);
    const [sums, setSums] = useState<Sums>({
        numOfJointComplicationCount: 0,
        numOfMotorDysfunctionCount: 0,
        numOfTraumaComplicationCount: 0,
        numOfAnkleComplicationCount: 0,
        numOfPediatricAdverseEventCount: 0,
        numOfSpinalComplicationCount: 0,
        numOfHandSurgeryComplicationCount: 0,
        numOfObstetricAdverseEventCount: 0,
        numOfGynecologicalAdverseEventCount: 0,
        numOfSurgicalTreatmentCount: 0,
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
        numOfJointComplicationCount: "",
        numOfMotorDysfunctionCount: "",
        numOfTraumaComplicationCount: "",
        numOfAnkleComplicationCount: "",
        numOfPediatricAdverseEventCount: "",
        numOfSpinalComplicationCount: "",
        numOfHandSurgeryComplicationCount: "",
        numOfObstetricAdverseEventCount: "",
        numOfGynecologicalAdverseEventCount: "",
        numOfSurgicalTreatmentCount: "",
    });

    // -------- Data fetching ----------
    async function load() {
        const params: any = { page, pageSize };
        if (from) params.from = from;
        if (to) params.to = to;

        const r = await api.get("/table-three", { params });
        setItems(r.data.items || []);
        setTotal(r.data.total || 0);
        if (r.data.sums) setSums(r.data.sums);
    }

    // initial load with default window, and whenever page changes
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    function toIntOrNull(v: string) {
        if (v === "" || v == null) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }

    async function create() {
        const payload: CreatePayload = {
            date: form.date || null,
            numOfJointComplicationCount: toIntOrNull(form.numOfJointComplicationCount),
            numOfMotorDysfunctionCount: toIntOrNull(form.numOfMotorDysfunctionCount),
            numOfTraumaComplicationCount: toIntOrNull(form.numOfTraumaComplicationCount),
            numOfAnkleComplicationCount: toIntOrNull(form.numOfAnkleComplicationCount),
            numOfPediatricAdverseEventCount: toIntOrNull(form.numOfPediatricAdverseEventCount),
            numOfSpinalComplicationCount: toIntOrNull(form.numOfSpinalComplicationCount),
            numOfHandSurgeryComplicationCount: toIntOrNull(form.numOfHandSurgeryComplicationCount),
            numOfObstetricAdverseEventCount: toIntOrNull(form.numOfObstetricAdverseEventCount),
            numOfGynecologicalAdverseEventCount: toIntOrNull(form.numOfGynecologicalAdverseEventCount),
            numOfSurgicalTreatmentCount: toIntOrNull(form.numOfSurgicalTreatmentCount),
        };
        await api.post("/table-three", payload);
        setOpen(false);
        setForm({
            date: "",
            numOfJointComplicationCount: "",
            numOfMotorDysfunctionCount: "",
            numOfTraumaComplicationCount: "",
            numOfAnkleComplicationCount: "",
            numOfPediatricAdverseEventCount: "",
            numOfSpinalComplicationCount: "",
            numOfHandSurgeryComplicationCount: "",
            numOfObstetricAdverseEventCount: "",
            numOfGynecologicalAdverseEventCount: "",
            numOfSurgicalTreatmentCount: "",
        });
        setPage(1);
        await load();
    }

    async function remove(id: number) {
        await api.delete(`/table-three/${id}`);
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
        // q is client-side filter only for current page
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
                    r.numOfJointComplicationCount,
                    r.numOfMotorDysfunctionCount,
                    r.numOfTraumaComplicationCount,
                    r.numOfAnkleComplicationCount,
                    r.numOfPediatricAdverseEventCount,
                    r.numOfSpinalComplicationCount,
                    r.numOfHandSurgeryComplicationCount,
                    r.numOfObstetricAdverseEventCount,
                    r.numOfGynecologicalAdverseEventCount,
                    r.numOfSurgicalTreatmentCount,
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
    const tableThreeSumNumber =
        sums.numOfJointComplicationCount +
        sums.numOfMotorDysfunctionCount +
        sums.numOfTraumaComplicationCount +
        sums.numOfAnkleComplicationCount +
        sums.numOfPediatricAdverseEventCount +
        sums.numOfSpinalComplicationCount +
        sums.numOfHandSurgeryComplicationCount +
        sums.numOfObstetricAdverseEventCount +
        sums.numOfGynecologicalAdverseEventCount +
        sums.numOfSurgicalTreatmentCount || 0;

    const totalNumOfJointComplicationCount = sums.numOfJointComplicationCount || 0;
    const totalNumOfJointComplicationCountPct = pct(totalNumOfJointComplicationCount, tableThreeSumNumber);
    const totalNumOfJointComplicationCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfJointComplicationCount);

    const totalNumOfMotorDysfunctionCount = sums.numOfMotorDysfunctionCount || 0;
    const totalNumOfMotorDysfunctionCountPct = pct(totalNumOfMotorDysfunctionCount, tableThreeSumNumber);
    const totalNumOfMotorDysfunctionCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfMotorDysfunctionCount);

    const totalNumOfTraumaComplicationCount = sums.numOfTraumaComplicationCount || 0;
    const totalNumOfTraumaComplicationCountPct = pct(totalNumOfTraumaComplicationCount, tableThreeSumNumber);
    const totalNumOfTraumaComplicationCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfTraumaComplicationCount);

    const totalNumOfAnkleComplicationCount = sums.numOfAnkleComplicationCount || 0;
    const totalNumOfAnkleComplicationCountPct = pct(totalNumOfAnkleComplicationCount, tableThreeSumNumber);
    const totalNumOfAnkleComplicationCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfAnkleComplicationCount);

    const totalNumOfPediatricAdverseEventCount = sums.numOfPediatricAdverseEventCount || 0;
    const totalNumOfPediatricAdverseEventCountPct = pct(totalNumOfPediatricAdverseEventCount, tableThreeSumNumber);
    const totalNumOfPediatricAdverseEventCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfPediatricAdverseEventCount);

    const totalNumOfSpinalComplicationCount = sums.numOfSpinalComplicationCount || 0;
    const totalNumOfSpinalComplicationCountPct = pct(totalNumOfSpinalComplicationCount, tableThreeSumNumber);
    const totalNumOfSpinalComplicationCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfSpinalComplicationCount);

    const totalNumOfHandSurgeryComplicationCount = sums.numOfHandSurgeryComplicationCount || 0;
    const totalNumOfHandSurgeryComplicationCountPct = pct(totalNumOfHandSurgeryComplicationCount, tableThreeSumNumber);
    const totalNumOfHandSurgeryComplicationCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfHandSurgeryComplicationCount);

    const totalNumOfObstetricAdverseEventCount = sums.numOfObstetricAdverseEventCount || 0;
    const totalNumOfObstetricAdverseEventCountPct = pct(totalNumOfObstetricAdverseEventCount, tableThreeSumNumber);
    const totalNumOfObstetricAdverseEventCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfObstetricAdverseEventCount);

    const totalNumOfGynecologicalAdverseEventCount = sums.numOfGynecologicalAdverseEventCount || 0;
    const totalNumOfGynecologicalAdverseEventCountPct = pct(totalNumOfGynecologicalAdverseEventCount, tableThreeSumNumber);
    const totalNumOfGynecologicalAdverseEventCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfGynecologicalAdverseEventCount);

    const totalNumOfSurgicalTreatmentCount = sums.numOfSurgicalTreatmentCount || 0;
    const totalNumOfSurgicalTreatmentCountPct = pct(totalNumOfSurgicalTreatmentCount, tableThreeSumNumber);
    const totalNumOfSurgicalTreatmentCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfSurgicalTreatmentCount);

    // translate chart labels
    const L = {
        joint: t("joint"),
        motor: t("motor"),
        trauma: t("trauma"),
        ankle: t("ankle"),
        pediatric: t("pediatric"),
        spinal: t("spinal"),
        hand: t("hand"),
        obstetric: t("obstetric"),
        gyn: t("gyn"),
        surgical: t("surgical"),
        otherVisits: t("otherVisits"),
    };

    const jointComplicationCountPie = [
        { name: L.joint, value: totalNumOfJointComplicationCount },
        { name: L.otherVisits, value: totalNumOfJointComplicationCountPctOther },
    ];
    const motorDysfunctionCountPie = [
        { name: L.motor, value: totalNumOfMotorDysfunctionCount },
        { name: L.otherVisits, value: totalNumOfMotorDysfunctionCountPctOther },
    ];
    const traumaComplicationCountPie = [
        { name: L.trauma, value: totalNumOfTraumaComplicationCount },
        { name: L.otherVisits, value: totalNumOfTraumaComplicationCountPctOther },
    ];
    const ankleComplicationCountPie = [
        { name: L.ankle, value: totalNumOfAnkleComplicationCount },
        { name: L.otherVisits, value: totalNumOfAnkleComplicationCountPctOther },
    ];
    const pediatricAdverseEventCountPie = [
        { name: L.pediatric, value: totalNumOfPediatricAdverseEventCount },
        { name: L.otherVisits, value: totalNumOfPediatricAdverseEventCountPctOther },
    ];
    const spinalComplicationCountPie = [
        { name: L.spinal, value: totalNumOfSpinalComplicationCount },
        { name: L.otherVisits, value: totalNumOfSpinalComplicationCountPctOther },
    ];
    const handSurgeryComplicationCountPie = [
        { name: L.hand, value: totalNumOfHandSurgeryComplicationCount },
        { name: L.otherVisits, value: totalNumOfHandSurgeryComplicationCountPctOther },
    ];
    const obstetricAdverseEventCountPie = [
        { name: L.obstetric, value: totalNumOfObstetricAdverseEventCount },
        { name: L.otherVisits, value: totalNumOfObstetricAdverseEventCountPctOther },
    ];
    const gynecologicalAdverseEventCountPie = [
        { name: L.gyn, value: totalNumOfGynecologicalAdverseEventCount },
        { name: L.otherVisits, value: totalNumOfGynecologicalAdverseEventCountPctOther },
    ];
    const surgicalTreatmentCountPie = [
        { name: L.surgical, value: totalNumOfSurgicalTreatmentCount },
        { name: L.otherVisits, value: totalNumOfSurgicalTreatmentCountPctOther },
    ];

    const OTHER_COLOR = "#E5E7EB";
    const CHART_COLORS: string[] = [
        "#2563EB", // 1 Joint - blue
        "#10B981", // 2 Motor - emerald
        "#F59E0B", // 3 Trauma - amber
        "#EF4444", // 4 Ankle - red
        "#8B5CF6", // 5 Pediatric - violet
        "#06B6D4", // 6 Spinal - cyan
        "#84CC16", // 7 Hand - lime
        "#F97316", // 8 Obstetric - orange
        "#EC4899", // 9 Gyn - pink
        "#14B8A6", // 10 Surgical - teal
    ];

    // -------- Frontend-only export helpers ----------
    async function fetchAllRowsForRange() {
        const pageSizeAll = 500; // tune as needed
        let pageIdx = 1;
        let all: any[] = [];
        while (true) {
            const r = await api.get("/table-three", {
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
            "numOfJointComplicationCount",
            "numOfMotorDysfunctionCount",
            "numOfTraumaComplicationCount",
            "numOfAnkleComplicationCount",
            "numOfPediatricAdverseEventCount",
            "numOfSpinalComplicationCount",
            "numOfHandSurgeryComplicationCount",
            "numOfObstetricAdverseEventCount",
            "numOfGynecologicalAdverseEventCount",
            "numOfSurgicalTreatmentCount",
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
                    r.numOfJointComplicationCount ?? "",
                    r.numOfMotorDysfunctionCount ?? "",
                    r.numOfTraumaComplicationCount ?? "",
                    r.numOfAnkleComplicationCount ?? "",
                    r.numOfPediatricAdverseEventCount ?? "",
                    r.numOfSpinalComplicationCount ?? "",
                    r.numOfHandSurgeryComplicationCount ?? "",
                    r.numOfObstetricAdverseEventCount ?? "",
                    r.numOfGynecologicalAdverseEventCount ?? "",
                    r.numOfSurgicalTreatmentCount ?? "",
                    r.createdAt ? new Date(r.createdAt).toISOString() : "",
                ]
                    .map(escapeCell)
                    .join(",")
            );
        }

        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        downloadBlob(blob, `table-three_${from || "all"}_${to || "all"}.csv`);
    }

    async function exportXlsx() {
        const rows = await fetchAllRowsForRange();

        const data = rows.map((r) => ({
            ID: r.id,
            Date: toYYYYMMDD(r.date),
            numOfJointComplicationCount: r.numOfJointComplicationCount ?? null,
            numOfMotorDysfunctionCount: r.numOfMotorDysfunctionCount ?? null,
            numOfTraumaComplicationCount: r.numOfTraumaComplicationCount ?? null,
            numOfAnkleComplicationCount: r.numOfAnkleComplicationCount ?? null,
            numOfPediatricAdverseEventCount: r.numOfPediatricAdverseEventCount ?? null,
            numOfSpinalComplicationCount: r.numOfSpinalComplicationCount ?? null,
            numOfHandSurgeryComplicationCount: r.numOfHandSurgeryComplicationCount ?? null,
            numOfObstetricAdverseEventCount: r.numOfObstetricAdverseEventCount ?? null,
            numOfGynecologicalAdverseEventCount: r.numOfGynecologicalAdverseEventCount ?? null,
            numOfSurgicalTreatmentCount: r.numOfSurgicalTreatmentCount ?? null,
            "Created At": r.createdAt ? new Date(r.createdAt).toISOString() : "",
        }));

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data, { cellDates: false });
        XLSX.utils.book_append_sheet(wb, ws, "TableThree"); // fixed sheet name

        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        downloadBlob(blob, `table-three_${from || "all"}_${to || "all"}.xlsx`);
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
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
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
                        <th className="px-3">{t("joint")}</th>
                        <th className="px-3">{t("motor")}</th>
                        <th className="px-3">{t("trauma")}</th>
                        <th className="px-3">{t("ankle")}</th>
                        <th className="px-3">{t("pediatric")}</th>
                        <th className="px-3">{t("spinal")}</th>
                        <th className="px-3">{t("hand")}</th>
                        <th className="px-3">{t("obstetric")}</th>
                        <th className="px-3">{t("gyn")}</th>
                        <th className="px-3">{t("surgical")}</th>
                        <th className="px-3 w-32"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map((r) => (
                        <tr key={r.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">
                                {r.date
                                    ? new Date(r.date).toLocaleDateString()
                                    : new Date(r.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-3">{r.numOfJointComplicationCount ?? "-"}</td>
                            <td className="px-3">{r.numOfMotorDysfunctionCount ?? "-"}</td>
                            <td className="px-3">{r.numOfTraumaComplicationCount ?? "-"}</td>
                            <td className="px-3">{r.numOfAnkleComplicationCount ?? "-"}</td>
                            <td className="px-3">{r.numOfPediatricAdverseEventCount ?? "-"}</td>
                            <td className="px-3">{r.numOfSpinalComplicationCount ?? "-"}</td>
                            <td className="px-3">{r.numOfHandSurgeryComplicationCount ?? "-"}</td>
                            <td className="px-3">{r.numOfObstetricAdverseEventCount ?? "-"}</td>
                            <td className="px-3">{r.numOfGynecologicalAdverseEventCount ?? "-"}</td>
                            <td className="px-3">{r.numOfSurgicalTreatmentCount ?? "-"}</td>
                            <td className="px-3">
                                <Button onClick={() => remove(r.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                    {t("delete")}
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan={12} className="py-10 text-center text-gray-500">
                                {t("noEntries")}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (right after table) */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("joint")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfJointComplicationCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("motor")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfMotorDysfunctionCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("trauma")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfTraumaComplicationCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("ankle")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfAnkleComplicationCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("pediatric")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfPediatricAdverseEventCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("spinal")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfSpinalComplicationCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("hand")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfHandSurgeryComplicationCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("obstetric")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfObstetricAdverseEventCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("gyn")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfGynecologicalAdverseEventCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("surgical")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfSurgicalTreatmentCount}
                    </div>
                </div>
            </div>

            {/* Percentage text */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("joint") })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfJointComplicationCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfJointComplicationCount} / {tableThreeSumNumber} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("motor") })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfMotorDysfunctionCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfMotorDysfunctionCount} / {tableThreeSumNumber} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("trauma") })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfTraumaComplicationCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfTraumaComplicationCount} / {tableThreeSumNumber} {t("visits")}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("ankle") })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfAnkleComplicationCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfAnkleComplicationCount} / {tableThreeSumNumber} {t("visits")}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("pediatric") })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfPediatricAdverseEventCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfPediatricAdverseEventCount} / {tableThreeSumNumber} {t("visits")}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("spinal") })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfSpinalComplicationCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfSpinalComplicationCount} / {tableThreeSumNumber} {t("visits")}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("hand") })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfHandSurgeryComplicationCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfHandSurgeryComplicationCount} / {tableThreeSumNumber} {t("visits")}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("obstetric") })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfObstetricAdverseEventCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfObstetricAdverseEventCount} / {tableThreeSumNumber} {t("visits")}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("gyn") })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfGynecologicalAdverseEventCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfGynecologicalAdverseEventCount} / {tableThreeSumNumber} {t("visits")}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("surgical") })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfSurgicalTreatmentCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfSurgicalTreatmentCount} / {tableThreeSumNumber} {t("visits")}
                    </div>
                </div>
            </div>

            {/* JointComplicationCount Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Joint vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("joint")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={jointComplicationCountPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {jointComplicationCountPie.map((_, i) => (
                                        <Cell key={`joint-${i}`} fill={i === 0 ? CHART_COLORS[0] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfJointComplicationCount} {t("of")} {tableThreeSumNumber} {t("visits")} ({totalNumOfJointComplicationCountPct})
                    </div>
                </div>

                {/* Motor vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("motor")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={motorDysfunctionCountPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {motorDysfunctionCountPie.map((_, i) => (
                                        <Cell key={`motor-${i}`} fill={i === 0 ? CHART_COLORS[1] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfMotorDysfunctionCount} {t("of")} {tableThreeSumNumber} {t("visits")} ({totalNumOfMotorDysfunctionCountPct})
                    </div>
                </div>

                {/* Trauma vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("trauma")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={traumaComplicationCountPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {traumaComplicationCountPie.map((_, i) => (
                                        <Cell key={`trauma-${i}`} fill={i === 0 ? CHART_COLORS[2] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfTraumaComplicationCount} {t("of")} {tableThreeSumNumber} {t("visits")} ({totalNumOfTraumaComplicationCountPct})
                    </div>
                </div>

                {/* Ankle */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("ankle")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={ankleComplicationCountPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {ankleComplicationCountPie.map((_, i) => (
                                        <Cell key={`ankle-${i}`} fill={i === 0 ? CHART_COLORS[3] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfAnkleComplicationCount} {t("of")} {tableThreeSumNumber} {t("visits")} ({totalNumOfAnkleComplicationCountPct})
                    </div>
                </div>

                {/* Pediatric */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("pediatric")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pediatricAdverseEventCountPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {pediatricAdverseEventCountPie.map((_, i) => (
                                        <Cell key={`pediatric-${i}`} fill={i === 0 ? CHART_COLORS[4] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfPediatricAdverseEventCount} {t("of")} {tableThreeSumNumber} {t("visits")} ({totalNumOfPediatricAdverseEventCountPct})
                    </div>
                </div>

                {/* Spinal */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("spinal")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={spinalComplicationCountPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {spinalComplicationCountPie.map((_, i) => (
                                        <Cell key={`spinal-${i}`} fill={i === 0 ? CHART_COLORS[5] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfSpinalComplicationCount} {t("of")} {tableThreeSumNumber} {t("visits")} ({totalNumOfSpinalComplicationCountPct})
                    </div>
                </div>

                {/* Hand */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("hand")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={handSurgeryComplicationCountPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {handSurgeryComplicationCountPie.map((_, i) => (
                                        <Cell key={`hand-${i}`} fill={i === 0 ? CHART_COLORS[6] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfHandSurgeryComplicationCount} {t("of")} {tableThreeSumNumber} {t("visits")} ({totalNumOfHandSurgeryComplicationCountPct})
                    </div>
                </div>

                {/* Obstetric */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("obstetric")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={obstetricAdverseEventCountPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {obstetricAdverseEventCountPie.map((_, i) => (
                                        <Cell key={`obstetric-${i}`} fill={i === 0 ? CHART_COLORS[7] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfObstetricAdverseEventCount} {t("of")} {tableThreeSumNumber} {t("visits")} ({totalNumOfObstetricAdverseEventCountPct})
                    </div>
                </div>

                {/* Gyn */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("gyn")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={gynecologicalAdverseEventCountPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {gynecologicalAdverseEventCountPie.map((_, i) => (
                                        <Cell key={`gyn-${i}`} fill={i === 0 ? CHART_COLORS[8] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfGynecologicalAdverseEventCount} {t("of")} {tableThreeSumNumber} {t("visits")} ({totalNumOfGynecologicalAdverseEventCountPct})
                    </div>
                </div>

                {/* Surgical */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("surgical")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={surgicalTreatmentCountPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {surgicalTreatmentCountPie.map((_, i) => (
                                        <Cell key={`surgical-${i}`} fill={i === 0 ? CHART_COLORS[9] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfSurgicalTreatmentCount} {t("of")} {tableThreeSumNumber} {t("visits")} ({totalNumOfSurgicalTreatmentCountPct})
                    </div>
                </div>
            </div>

            {/* Create dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-white/100 backdrop-blur-none">
                    <DialogHeader>
                        <DialogTitle>{t("dialogTitle")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderJoint")}
                            value={form.numOfJointComplicationCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfJointComplicationCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderMotor")}
                            value={form.numOfMotorDysfunctionCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfMotorDysfunctionCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderTrauma")}
                            value={form.numOfTraumaComplicationCount}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    numOfTraumaComplicationCount: e.target.value,
                                })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderAnkle")}
                            value={form.numOfAnkleComplicationCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfAnkleComplicationCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderPediatric")}
                            value={form.numOfPediatricAdverseEventCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfPediatricAdverseEventCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderSpinal")}
                            value={form.numOfSpinalComplicationCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfSpinalComplicationCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderHand")}
                            value={form.numOfHandSurgeryComplicationCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfHandSurgeryComplicationCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderObstetric")}
                            value={form.numOfObstetricAdverseEventCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfObstetricAdverseEventCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderGyn")}
                            value={form.numOfGynecologicalAdverseEventCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfGynecologicalAdverseEventCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderSurgical")}
                            value={form.numOfSurgicalTreatmentCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfSurgicalTreatmentCount: e.target.value })
                            }
                        />
                        <Button onClick={create} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {t("create")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
