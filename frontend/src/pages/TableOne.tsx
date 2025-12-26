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
    numOfAdverseReactionCases: number | null;
    numOfInadequateAnalgesia: number | null;
    numOfPostoperativeAnalgesiaCases: number | null;
    numOfPostoperativeVisits: number | null;
    createdAt: string;
};

type Sums = {
    numOfAdverseReactionCases: number;
    numOfInadequateAnalgesia: number;
    numOfPostoperativeAnalgesiaCases: number;
    numOfPostoperativeVisits: number;
};

type CreatePayload = {
    date?: string | null;
    numOfAdverseReactionCases?: number | null;
    numOfInadequateAnalgesia?: number | null;
    numOfPostoperativeAnalgesiaCases?: number | null;
    numOfPostoperativeVisits?: number | null;
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

/* ---------- i18n (mirrors tableFour.tsx style) ---------- */
type Lang = "en" | "zh";
const STRINGS: Record<Lang, Record<string, string>> = {
    en: {
        // controls
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
        page: "Page",
        prev: "Prev",
        next: "Next",
        // table
        date: "Date",
        toggleSort: "Toggle sort",
        adverse: "Adverse Reactions",
        inadequate: "Inadequate Analgesia",
        postopAnalgesia: "Postop Analgesia Cases",
        visits: "Postop Visits",
        delete: "Delete",
        noEntries: "No entries found.",
        totals: "(Σ)",
        // cards/pies
        vsOther: "vs Other Visits",
        otherVisits: "Other Visits",
        // dialog
        dialogTitle: "New entry",
        create: "Create",
        phAdverse: "Adverse Reactions",
        phInadequate: "Inadequate Analgesia",
        phPostopAnalgesia: "Postop Analgesia Cases",
        phVisits: "Postop Visits",
        // labels text
        adverseOverPostop: "Adverse / Postop Analgesia",
        inadequateOverPostop: "Inadequate / Postop Analgesia",
        postopOverVisits: "Postop Analgesia / Visits",
    },
    zh: {
        // controls
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
        page: "第",
        prev: "上一页",
        next: "下一页",
        // table
        date: "日期",
        toggleSort: "切换排序",
        adverse: "不良反应",
        inadequate: "镇痛不足",
        postopAnalgesia: "术后镇痛例数",
        visits: "随访次数",
        delete: "删除",
        noEntries: "暂无数据。",
        totals: "（合计）",
        // cards/pies
        vsOther: "与其他对比",
        otherVisits: "其他",
        // dialog
        dialogTitle: "新建条目",
        create: "创建",
        phAdverse: "不良反应",
        phInadequate: "镇痛不足",
        phPostopAnalgesia: "术后镇痛例数",
        phVisits: "随访次数",
        // labels text
        adverseOverPostop: "不良反应 / 术后镇痛",
        inadequateOverPostop: "镇痛不足 / 术后镇痛",
        postopOverVisits: "术后镇痛 / 随访",
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

export default function TableOne() {
    const { lang, setLang, t } = useI18n();

    const [items, setItems] = useState<Row[]>([]);
    const [total, setTotal] = useState(0);
    const [sums, setSums] = useState<Sums>({
        numOfAdverseReactionCases: 0,
        numOfInadequateAnalgesia: 0,
        numOfPostoperativeAnalgesiaCases: 0,
        numOfPostoperativeVisits: 0,
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
        numOfAdverseReactionCases: "",
        numOfInadequateAnalgesia: "",
        numOfPostoperativeAnalgesiaCases: "",
        numOfPostoperativeVisits: "",
    });

    // -------- Data fetching ----------
    async function load() {
        const params: any = { page, pageSize };
        if (from) params.from = from;
        if (to) params.to = to;

        const r = await api.get("/table-one", { params });
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
            numOfAdverseReactionCases: toIntOrNull(form.numOfAdverseReactionCases),
            numOfInadequateAnalgesia: toIntOrNull(form.numOfInadequateAnalgesia),
            numOfPostoperativeAnalgesiaCases: toIntOrNull(form.numOfPostoperativeAnalgesiaCases),
            numOfPostoperativeVisits: toIntOrNull(form.numOfPostoperativeVisits),
        };
        await api.post("/table-one", payload);
        setOpen(false);
        setForm({
            date: "",
            numOfAdverseReactionCases: "",
            numOfInadequateAnalgesia: "",
            numOfPostoperativeAnalgesiaCases: "",
            numOfPostoperativeVisits: "",
        });
        setPage(1);
        await load();
    }

    async function remove(id: number) {
        await api.delete(`/table-one/${id}`);
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
        const tVal = d.getTime();
        return Number.isFinite(tVal) ? tVal : 0;
    }

    // client-side quick filter + sort (totals remain server-side)
    const filtered = useMemo(() => {
        const base = (() => {
            if (!q) return items;
            const tLower = q.toLowerCase();
            return items.filter((r) => {
                const fields = [
                    r.numOfAdverseReactionCases,
                    r.numOfInadequateAnalgesia,
                    r.numOfPostoperativeAnalgesiaCases,
                    r.numOfPostoperativeVisits,
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
    const visits = sums.numOfPostoperativeVisits || 0;

    const postopAnalgesiaCount = sums.numOfPostoperativeAnalgesiaCases || 0;
    const postopAnalgesiaPct = pct(postopAnalgesiaCount, visits);
    const postopAnalgesiaOther = Math.max(0, visits - postopAnalgesiaCount);

    const adverseCount = sums.numOfAdverseReactionCases || 0;
    const adversePct = pct(adverseCount, postopAnalgesiaCount);
    const adverseOther = Math.max(0, postopAnalgesiaCount - adverseCount);

    const inadequateCount = sums.numOfInadequateAnalgesia || 0;
    const inadequatePct = pct(inadequateCount, postopAnalgesiaCount);
    const inadequateOther = Math.max(0, postopAnalgesiaCount - inadequateCount);

    const L = {
        adverse: t("adverse"),
        inadequate: t("inadequate"),
        postopAnalgesia: t("postopAnalgesia"),
        visits: t("visits"),
        otherVisits: t("otherVisits"),
    };

    const adversePie = [
        { name: L.adverse, value: adverseCount },
        { name: L.otherVisits, value: adverseOther },
    ];
    const inadequatePie = [
        { name: L.inadequate, value: inadequateCount },
        { name: L.otherVisits, value: inadequateOther },
    ];
    const postopAnalgesiaPie = [
        { name: L.postopAnalgesia, value: postopAnalgesiaCount },
        { name: L.otherVisits, value: postopAnalgesiaOther },
    ];

    const COLORS_A = ["#4F46E5", "#CBD5E1"];
    const COLORS_B = ["#06B6D4", "#CBD5E1"];
    const COLORS_C = ["#10B981", "#CBD5E1"];

    // -------- Frontend-only export helpers ----------
    async function fetchAllRowsForRange() {
        const pageSizeAll = 500; // tune as needed
        let pageIdx = 1;
        let all: any[] = [];
        while (true) {
            const r = await api.get("/table-one", {
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
            "numOfAdverseReactionCases",
            "numOfInadequateAnalgesia",
            "numOfPostoperativeAnalgesiaCases",
            "numOfPostoperativeVisits",
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
                    r.numOfAdverseReactionCases ?? "",
                    r.numOfInadequateAnalgesia ?? "",
                    r.numOfPostoperativeAnalgesiaCases ?? "",
                    r.numOfPostoperativeVisits ?? "",
                    r.createdAt ? new Date(r.createdAt).toISOString() : "",
                ]
                    .map(escapeCell)
                    .join(",")
            );
        }

        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        downloadBlob(blob, `table-one_${from || "all"}_${to || "all"}.csv`);
    }

    async function exportXlsx() {
        const rows = await fetchAllRowsForRange();

        const data = rows.map((r) => ({
            ID: r.id,
            Date: toYYYYMMDD(r.date),
            Adverse: r.numOfAdverseReactionCases ?? null,
            Inadequate: r.numOfInadequateAnalgesia ?? null,
            "Postop Analgesia": r.numOfPostoperativeAnalgesiaCases ?? null,
            Visits: r.numOfPostoperativeVisits ?? null,
            "Created At": r.createdAt ? new Date(r.createdAt).toISOString() : "",
        }));

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data, { cellDates: false });
        XLSX.utils.book_append_sheet(wb, ws, "TableOne");

        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        downloadBlob(blob, `table-one_${from || "all"}_${to || "all"}.xlsx`);
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Language toggle to match TableFour */}
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
                        <th className="px-3 text-center">{t("adverse")}</th>
                        <th className="px-3 text-center">{t("inadequate")}</th>
                        <th className="px-3 text-center">{t("postopAnalgesia")}</th>
                        <th className="px-3 text-center">{t("visits")}</th>
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
                            <td className="px-3 text-center">{r.numOfAdverseReactionCases ?? "0"}</td>
                            <td className="px-3 text-center">{r.numOfInadequateAnalgesia ?? "0"}</td>
                            <td className="px-3 text-center">{r.numOfPostoperativeAnalgesiaCases ?? "0"} </td>
                            <td className="px-3 text-center">{r.numOfPostoperativeVisits ?? "0"}</td>
                            <td className="px-3">
                                <Button onClick={() => remove(r.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                    {t("delete")}
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan={6} className="py-10 text-center text-gray-500">
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
                    <div className="text-xs text-gray-500">{t("adverse")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfAdverseReactionCases}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("inadequate")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfInadequateAnalgesia}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("postopAnalgesia")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfPostoperativeAnalgesiaCases}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("visits")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfPostoperativeVisits}
                    </div>
                </div>
            </div>

            {/* Percentage text */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("adverseOverPostop")}</div>
                    <div className="text-2xl font-semibold">{adversePct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {adverseCount} / {postopAnalgesiaCount} {t("postopAnalgesia")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("inadequateOverPostop")}</div>
                    <div className="text-2xl font-semibold">{inadequatePct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {inadequateCount} / {postopAnalgesiaCount} {t("postopAnalgesia")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("postopOverVisits")}</div>
                    <div className="text-2xl font-semibold">{postopAnalgesiaPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {postopAnalgesiaCount} / {visits} {t("visits")}
                    </div>
                </div>
            </div>

            {/* Three separate pies */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Adverse vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("adverse")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={adversePie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {adversePie.map((_, i) => (
                                        <Cell key={`adv-${i}`} fill={COLORS_A[i % COLORS_A.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {adverseCount} {t("of")} {postopAnalgesiaCount} {t("postopAnalgesia")} ({adversePct})
                    </div>
                </div>

                {/* Inadequate vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("inadequate")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={inadequatePie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {inadequatePie.map((_, i) => (
                                        <Cell key={`inad-${i}`} fill={COLORS_B[i % COLORS_B.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {inadequateCount} {t("of")} {postopAnalgesiaCount} {t("postopAnalgesia")} ({inadequatePct})
                    </div>
                </div>

                {/* Postop Analgesia vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("postopAnalgesia")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={postopAnalgesiaPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {postopAnalgesiaPie.map((_, i) => (
                                        <Cell key={`post-${i}`} fill={COLORS_C[i % COLORS_C.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {postopAnalgesiaCount} {t("of")} {visits} {t("visits")} ({postopAnalgesiaPct})
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
                            placeholder={t("phAdverse")}
                            value={form.numOfAdverseReactionCases}
                            onChange={(e) =>
                                setForm({ ...form, numOfAdverseReactionCases: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("phInadequate")}
                            value={form.numOfInadequateAnalgesia}
                            onChange={(e) =>
                                setForm({ ...form, numOfInadequateAnalgesia: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("phPostopAnalgesia")}
                            value={form.numOfPostoperativeAnalgesiaCases}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    numOfPostoperativeAnalgesiaCases: e.target.value,
                                })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("phVisits")}
                            value={form.numOfPostoperativeVisits}
                            onChange={(e) =>
                                setForm({ ...form, numOfPostoperativeVisits: e.target.value })
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
