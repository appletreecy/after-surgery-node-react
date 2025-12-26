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
    numOfFormulationOne: number | null;
    numOfFormulationTwo: number | null;
    numOfFormulationThree: number | null;
    numOfFormulationFour: number | null;
    numOfFormulationFive: number | null;
    numOfFormulationSix: number | null;
    createdAt: string;
};

type Sums = {
    numOfFormulationOne: number;
    numOfFormulationTwo: number;
    numOfFormulationThree: number;
    numOfFormulationFour: number;
    numOfFormulationFive: number;
    numOfFormulationSix: number;
};

type CreatePayload = {
    date?: string | null;
    numOfFormulationOne: number | null;
    numOfFormulationTwo: number | null;
    numOfFormulationThree: number | null;
    numOfFormulationFour: number | null;
    numOfFormulationFive: number | null;
    numOfFormulationSix: number | null;
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
        formulationOne: "Formulation One",
        formulationTwo: "Formulation Two",
        formulationThree: "Formulation Three",
        formulationFour: "Formulation Four",
        formulationFive: "Formulation Five",
        formulationSix: "Formulation Six",
        delete: "Delete",
        totals: "(Σ)",
        visits: "visits",
        // FIX: make sum a variable
        totalXOfSum: "Total {{x}} / {{sum}}",
        otherVisits: "Other Visits",
        vsOther: "vs Other Visits",
        dialogTitle: "New entry",
        create: "Create",
        placeholderFormulationOne: "Formulation One Count",
        placeholderFormulationTwo: "Formulation Two Count",
        placeholderFormulationThree: "Formulation Three Count",
        placeholderFormulationFour: "Formulation Four Count",
        placeholderFormulationFive: "Formulation Five Event Count",
        placeholderFormulationSix: "Formulation Six Count",
        noEntries: "No entries found.",
        page: "Page",
        prev: "Prev",
        next: "Next",
        // FIX: provide these keys used in UI (map to formulations)
        joint: "Formulation One",
        motor: "Formulation Two",
        trauma: "Formulation Three",
        ankle: "Formulation Four",
        pediatric: "Formulation Five",
        spinal: "Formulation Six",
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
        formulationOne: "配方一",
        formulationTwo: "配方二",
        formulationThree: "配方三",
        formulationFour: "配方四",
        formulationFive: "配方五",
        formulationSix: "配方六",
        delete: "删除",
        totals: "（合计）",
        visits: "次",
        // FIX: make sum a variable
        totalXOfSum: "总{{x}} / {{sum}}",
        otherVisits: "其他",
        vsOther: "与其他对比",
        dialogTitle: "新建条目",
        create: "创建",
        placeholderFormulationOne: "配方一数量",
        placeholderFormulationTwo: "配方二数量",
        placeholderFormulationThree: "配方三数量",
        placeholderFormulationFour: "配方四数量",
        placeholderFormulationFive: "配方五数量",
        placeholderFormulationSix: "配方六数量",
        noEntries: "暂无数据。",
        page: "第",
        prev: "上一页",
        next: "下一页",
        // FIX: provide these keys used in UI (map to formulations)
        joint: "配方一",
        motor: "配方二",
        trauma: "配方三",
        ankle: "配方四",
        pediatric: "配方五",
        spinal: "配方六",
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

export default function TableFour() {
    const { lang, setLang, t } = useI18n();

    const [items, setItems] = useState<Row[]>([]);
    const [total, setTotal] = useState(0);
    const [sums, setSums] = useState<Sums>({
        numOfFormulationOne: 0,
        numOfFormulationTwo: 0,
        numOfFormulationThree: 0,
        numOfFormulationFour: 0,
        numOfFormulationFive: 0,
        numOfFormulationSix: 0,
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
        numOfFormulationOne: "",
        numOfFormulationTwo: "",
        numOfFormulationThree: "",
        numOfFormulationFour: "",
        numOfFormulationFive: "",
        numOfFormulationSix: "",
    });

    // -------- Data fetching ----------
    async function load() {
        const params: any = { page, pageSize };
        if (from) params.from = from;
        if (to) params.to = to;

        const r = await api.get("/table-four", { params });
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
            numOfFormulationOne: toIntOrNull(form.numOfFormulationOne),
            numOfFormulationTwo: toIntOrNull(form.numOfFormulationTwo),
            numOfFormulationThree: toIntOrNull(form.numOfFormulationThree),
            numOfFormulationFour: toIntOrNull(form.numOfFormulationFour),
            numOfFormulationFive: toIntOrNull(form.numOfFormulationFive),
            numOfFormulationSix: toIntOrNull(form.numOfFormulationSix),
        };
        await api.post("/table-four", payload);
        setOpen(false);
        setForm({
            date: "",
            numOfFormulationOne: "",
            numOfFormulationTwo: "",
            numOfFormulationThree: "",
            numOfFormulationFour: "",
            numOfFormulationFive: "",
            numOfFormulationSix: "",
        });
        setPage(1);
        await load();
    }

    async function remove(id: number) {
        await api.delete(`/table-four/${id}`);
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
                    r.numOfFormulationOne,
                    r.numOfFormulationTwo,
                    r.numOfFormulationThree,
                    r.numOfFormulationFour,
                    r.numOfFormulationFive,
                    r.numOfFormulationSix,
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
    const tableFourSumNumber =
        sums.numOfFormulationOne +
        sums.numOfFormulationTwo +
        sums.numOfFormulationThree +
        sums.numOfFormulationFour +
        sums.numOfFormulationFive +
        sums.numOfFormulationSix || 0;

    const totalNumOfFormulationOneCount = sums.numOfFormulationOne || 0;
    const totalNumOfFormulationOneCountPct = pct(totalNumOfFormulationOneCount, tableFourSumNumber);
    const totalNumOfFormulationOneCountOther = Math.max(0, tableFourSumNumber - totalNumOfFormulationOneCount);

    const totalNumOfFormulationTwoCount = sums.numOfFormulationTwo || 0;
    const totalNumOfFormulationTwoCountPct = pct(totalNumOfFormulationTwoCount, tableFourSumNumber);
    const totalNumOfFormulationTwoCountOther = Math.max(0, tableFourSumNumber - totalNumOfFormulationTwoCount);

    const totalNumOfFormulationThreeCount = sums.numOfFormulationThree || 0;
    const totalNumOfFormulationThreeCountPct = pct(totalNumOfFormulationThreeCount, tableFourSumNumber);
    const totalNumOfFormulationThreeCountPctOther = Math.max(0, tableFourSumNumber - totalNumOfFormulationThreeCount);

    const totalNumOfFormulationFourCount = sums.numOfFormulationFour || 0;
    const totalNumOfFormulationFourCountPct = pct(totalNumOfFormulationFourCount, tableFourSumNumber);
    const totalNumOfFormulationFourCountPctOther = Math.max(0, tableFourSumNumber - totalNumOfFormulationFourCount);

    const totalNumOfFormulationFiveCount = sums.numOfFormulationFive || 0;
    const totalNumOfFormulationFiveCountPct = pct(totalNumOfFormulationFiveCount, tableFourSumNumber);
    const totalNumOfFormulationFiveCountPctOther = Math.max(0, tableFourSumNumber - totalNumOfFormulationFiveCount);

    const totalNumOfFormulationSixCount = sums.numOfFormulationSix || 0;
    const totalNumOfFormulationSixCountPct = pct(totalNumOfFormulationSixCount, tableFourSumNumber);
    const totalNumOfFormulationSixCountPctOther = Math.max(0, tableFourSumNumber - totalNumOfFormulationSixCount);

    // translate chart labels
    const L = {
        formulationOne: t("formulationOne"),
        formulationTwo: t("formulationTwo"),
        formulationThree: t("formulationThree"),
        formulationFour: t("formulationFour"),
        formulationFive: t("formulationFive"),
        formulationSix: t("formulationSix"),
        otherVisits: t("otherVisits"),
    };

    const formulationOnePie = [
        { name: L.formulationOne, value: totalNumOfFormulationOneCount },
        { name: L.otherVisits, value: totalNumOfFormulationOneCountOther },
    ];
    const formulationTwoPie = [
        { name: L.formulationTwo, value: totalNumOfFormulationTwoCount },
        { name: L.otherVisits, value: totalNumOfFormulationTwoCountOther },
    ];
    const formulationThreePie = [
        { name: L.formulationThree, value: totalNumOfFormulationThreeCount },
        { name: L.otherVisits, value: totalNumOfFormulationThreeCountPctOther },
    ];
    const formulationFourPie = [
        { name: L.formulationFour, value: totalNumOfFormulationFourCount },
        { name: L.otherVisits, value: totalNumOfFormulationFourCountPctOther },
    ];
    const formulationFivePie = [
        { name: L.formulationFive, value: totalNumOfFormulationFiveCount },
        { name: L.otherVisits, value: totalNumOfFormulationFiveCountPctOther },
    ];
    const formulationSixPie = [
        { name: L.formulationSix, value: totalNumOfFormulationSixCount },
        { name: L.otherVisits, value: totalNumOfFormulationSixCountPctOther },
    ];


    const OTHER_COLOR = "#E5E7EB";
    const CHART_COLORS: string[] = [
        "#2563EB", // 1 formulationOne - blue
        "#10B981", // 2 formulationTwo - emerald
        "#F59E0B", // 3 formulationThree - amber
        "#EF4444", // 4 formulationFour - red
        "#8B5CF6", // 5 formulationFive - violet
        "#06B6D4", // 6 formulationSix - cyan
    ];

    // -------- Frontend-only export helpers ----------
    async function fetchAllRowsForRange() {
        const pageSizeAll = 500; // tune as needed
        let pageIdx = 1;
        let all: any[] = [];
        while (true) {
            const r = await api.get("/table-four", {
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
            "numOfFormulationOne",
            "numOfFormulationTwo",
            "numOfFormulationThree",
            "numOfFormulationFour",
            "numOfFormulationFive",
            "numOfFormulationSix",
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
                    r.numOfFormulationOne ?? "",
                    r.numOfFormulationTwo ?? "",
                    r.numOfFormulationThree ?? "",
                    r.numOfFormulationFour ?? "",
                    r.numOfFormulationFive ?? "",
                    r.numOfFormulationSix ?? "",
                    r.createdAt ? new Date(r.createdAt).toISOString() : "",
                ]
                    .map(escapeCell)
                    .join(",")
            );
        }

        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        downloadBlob(blob, `table-four_${from || "all"}_${to || "all"}.csv`);
    }

    async function exportXlsx() {
        const rows = await fetchAllRowsForRange();

        const data = rows.map((r) => ({
            ID: r.id,
            Date: toYYYYMMDD(r.date),
            numOfFormulationOne: r.numOfFormulationOne ?? null,
            numOfFormulationTwo: r.numOfFormulationTwo ?? null,
            numOfFormulationThree: r.numOfFormulationThree ?? null,
            numOfFormulationFour: r.numOfFormulationFour ?? null,
            numOfFormulationFive: r.numOfFormulationFive ?? null,
            numOfFormulationSix: r.numOfFormulationSix ?? null,
            "Created At": r.createdAt ? new Date(r.createdAt).toISOString() : "",
        }));

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data, { cellDates: false });
        XLSX.utils.book_append_sheet(wb, ws, "TableFour"); // fixed sheet name

        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        downloadBlob(blob, `table-four_${from || "all"}_${to || "all"}.xlsx`);
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
                        <th className="px-3 text-center">{t("formulationOne")}</th>
                        <th className="px-3 text-center">{t("formulationTwo")}</th>
                        <th className="px-3 text-center">{t("formulationThree")}</th>
                        <th className="px-3 text-center">{t("formulationFour")}</th>
                        <th className="px-3 text-center">{t("formulationFive")}</th>
                        <th className="px-3 text-center">{t("formulationSix")}</th>
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
                            <td className="px-3 text-center">{r.numOfFormulationOne ?? "0"}</td>
                            <td className="px-3 text-center">{r.numOfFormulationTwo ?? "0"}</td>
                            <td className="px-3 text-center">{r.numOfFormulationThree ?? "0"}</td>
                            <td className="px-3 text-center">{r.numOfFormulationFour ?? "0"}</td>
                            <td className="px-3 text-center">{r.numOfFormulationFive ?? "0"}</td>
                            <td className="px-3 text-center">{r.numOfFormulationSix ?? "0"}</td>
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
                    <div className="text-xs text-gray-500">{t("formulationOne")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfFormulationOne}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("formulationTwo")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfFormulationTwo}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("formulationThree")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfFormulationThree}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("formulationFour")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfFormulationFour}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("formulationFive")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfFormulationFive}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("formulationSix")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfFormulationSix}
                    </div>
                </div>
            </div>

            {/* Percentage text */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("joint"), sum: tableFourSumNumber })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfFormulationOneCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfFormulationOneCount} / {tableFourSumNumber} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("motor"), sum: tableFourSumNumber })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfFormulationTwoCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfFormulationTwoCount} / {tableFourSumNumber} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("trauma"), sum: tableFourSumNumber })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfFormulationThreeCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfFormulationThreeCount} / {tableFourSumNumber} {t("visits")}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("ankle"), sum: tableFourSumNumber })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfFormulationFourCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfFormulationFourCount} / {tableFourSumNumber} {t("visits")}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("pediatric"), sum: tableFourSumNumber })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfFormulationFiveCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfFormulationFiveCount} / {tableFourSumNumber} {t("visits")}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("spinal"), sum: tableFourSumNumber })}
                    </div>
                    <div className="text-2xl font-semibold">{totalNumOfFormulationSixCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfFormulationSixCount} / {tableFourSumNumber} {t("visits")}
                    </div>
                </div>
            </div>

            {/* formulationOnePie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Joint vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("joint")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={formulationOnePie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {formulationOnePie.map((_, i) => (
                                        <Cell key={`joint-${i}`} fill={i === 0 ? CHART_COLORS[0] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfFormulationOneCount} {t("of")} {tableFourSumNumber} {t("visits")} ({totalNumOfFormulationOneCountPct})
                    </div>
                </div>

                {/* formulationTwoPie */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("motor")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={formulationTwoPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {formulationTwoPie.map((_, i) => (
                                        <Cell key={`motor-${i}`} fill={i === 0 ? CHART_COLORS[1] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfFormulationTwoCount} {t("of")} {tableFourSumNumber} {t("visits")} ({totalNumOfFormulationTwoCountPct})
                    </div>
                </div>

                {/* formulationThreePie */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("trauma")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={formulationThreePie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {formulationThreePie.map((_, i) => (
                                        <Cell key={`trauma-${i}`} fill={i === 0 ? CHART_COLORS[2] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfFormulationThreeCount} {t("of")} {tableFourSumNumber} {t("visits")} ({totalNumOfFormulationThreeCountPct})
                    </div>
                </div>

                {/* formulationFourPie */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("ankle")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={formulationFourPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {formulationFourPie.map((_, i) => (
                                        <Cell key={`ankle-${i}`} fill={i === 0 ? CHART_COLORS[3] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfFormulationFourCount} {t("of")} {tableFourSumNumber} {t("visits")} ({totalNumOfFormulationFourCountPct})
                    </div>
                </div>

                {/* formulationFivePie */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("pediatric")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={formulationFivePie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {formulationFivePie.map((_, i) => (
                                        <Cell key={`pediatric-${i}`} fill={i === 0 ? CHART_COLORS[4] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfFormulationFiveCount} {t("of")} {tableFourSumNumber} {t("visits")} ({totalNumOfFormulationFiveCountPct})
                    </div>
                </div>

                {/* formulationSixPie */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("spinal")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={formulationSixPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {formulationSixPie.map((_, i) => (
                                        <Cell key={`spinal-${i}`} fill={i === 0 ? CHART_COLORS[5] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfFormulationSixCount} {t("of")} {tableFourSumNumber} {t("visits")} ({totalNumOfFormulationSixCountPct})
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
                        {/* FIX: use existing placeholder keys */}
                        <Input
                            type="number"
                            placeholder={t("placeholderFormulationOne")}
                            value={form.numOfFormulationOne}
                            onChange={(e) =>
                                setForm({ ...form, numOfFormulationOne: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderFormulationTwo")}
                            value={form.numOfFormulationTwo}
                            onChange={(e) =>
                                setForm({ ...form, numOfFormulationTwo: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderFormulationThree")}
                            value={form.numOfFormulationThree}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    numOfFormulationThree: e.target.value,
                                })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderFormulationFour")}
                            value={form.numOfFormulationFour}
                            onChange={(e) =>
                                setForm({ ...form, numOfFormulationFour: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderFormulationFive")}
                            value={form.numOfFormulationFive}
                            onChange={(e) =>
                                setForm({ ...form, numOfFormulationFive: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderFormulationSix")}
                            value={form.numOfFormulationSix}
                            onChange={(e) =>
                                setForm({ ...form, numOfFormulationSix: e.target.value })
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
