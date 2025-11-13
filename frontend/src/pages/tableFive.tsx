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
    criticalPatientsName: string | null;
    visitFindingsForCriticalPatient: string | null;
    numberOfCriticalRescueCases: number | null;
    numberOfDeaths: number | null;
    numberOfFollowUpsForCriticallyIllPatients: number | null;
    createdAt: string;
};

type Sums = {
    numberOfCriticalRescueCases: number;
    numberOfDeaths: number;
    numberOfFollowUpsForCriticallyIllPatients: number;
};

type CreatePayload = {
    date?: string | null;
    criticalPatientsName: string | null;
    visitFindingsForCriticalPatient: string | null;
    numberOfCriticalRescueCases: number | null;
    numberOfDeaths: number | null;
    numberOfFollowUpsForCriticallyIllPatients: number | null;
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
        rescueCases: "Critical Rescue Cases",
        deaths: "Deaths",
        followUps: "Follow-ups (Critical Patients)",
        criticalName: "Critical Patient Name",
        findings: "Visit Findings",
        vsOther: "vs Other",
        // Placeholders
        placeholderRescue: "Critical rescue count",
        placeholderDeaths: "Death count",
        placeholderFollowUps: "Follow-ups count",
        placeholderName: "Critical patient name",
        placeholderFindings: "Visit findings / notes",
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
        rescueCases: "危重抢救例数",
        deaths: "死亡人数",
        followUps: "危重病人随访数",
        criticalName: "危重病人姓名",
        findings: "随访/查房记录",
        vsOther: "对比其他",
        // Placeholders
        placeholderRescue: "危重抢救数",
        placeholderDeaths: "死亡数",
        placeholderFollowUps: "随访数",
        placeholderName: "危重病人姓名",
        placeholderFindings: "随访/查房记录",
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

export default function TableFive() {
    const { lang, setLang, t } = useI18n();

    const [items, setItems] = useState<Row[]>([]);
    const [total, setTotal] = useState(0);
    const [sums, setSums] = useState<Sums>({
        numberOfCriticalRescueCases: 0,
        numberOfDeaths: 0,
        numberOfFollowUpsForCriticallyIllPatients: 0,
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
        criticalPatientsName: "",
        visitFindingsForCriticalPatient: "",
        numberOfCriticalRescueCases: "",
        numberOfDeaths: "",
        numberOfFollowUpsForCriticallyIllPatients: "",
    });

    // -------- Data fetching ----------
    async function load() {
        const params: any = { page, pageSize };
        if (from) params.from = from;
        if (to) params.to = to;

        const r = await api.get("/table-five", { params });
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
            criticalPatientsName: toStrOrNull(form.criticalPatientsName),
            visitFindingsForCriticalPatient: toStrOrNull(form.visitFindingsForCriticalPatient),
            numberOfCriticalRescueCases: toIntOrNull(form.numberOfCriticalRescueCases),
            numberOfDeaths: toIntOrNull(form.numberOfDeaths),
            numberOfFollowUpsForCriticallyIllPatients: toIntOrNull(form.numberOfFollowUpsForCriticallyIllPatients),
        };
        await api.post("/table-five", payload);
        setOpen(false);
        setForm({
            date: "",
            criticalPatientsName: "",
            visitFindingsForCriticalPatient: "",
            numberOfCriticalRescueCases: "",
            numberOfDeaths: "",
            numberOfFollowUpsForCriticallyIllPatients: "",
        });
        setPage(1);
        await load();
    }

    async function remove(id: number) {
        await api.delete(`/table-five/${id}`);
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
        // client-side only for current page
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
                    r.numberOfCriticalRescueCases,
                    r.numberOfDeaths,
                    r.numberOfFollowUpsForCriticallyIllPatients,
                    r.criticalPatientsName ?? "",
                    r.visitFindingsForCriticalPatient ?? "",
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
        (sums.numberOfCriticalRescueCases || 0) +
        (sums.numberOfDeaths || 0) +
        (sums.numberOfFollowUpsForCriticallyIllPatients || 0);

    const rescue = sums.numberOfCriticalRescueCases || 0;
    const deaths = sums.numberOfDeaths || 0;
    const followUps = sums.numberOfFollowUpsForCriticallyIllPatients || 0;

    const rescuePct = pct(rescue, sumTotal);
    const deathsPct = pct(deaths, sumTotal);
    const followUpsPct = pct(followUps, sumTotal);

    const rescueOther = Math.max(0, sumTotal - rescue);
    const deathsOther = Math.max(0, sumTotal - deaths);
    const followUpsOther = Math.max(0, sumTotal - followUps);

    const L = {
        rescue: t("rescueCases"),
        deaths: t("deaths"),
        followUps: t("followUps"),
        vsOther: t("vsOther"),
    };

    const rescuePie = [
        { name: L.rescue, value: rescue },
        { name: "Other", value: rescueOther },
    ];
    const deathsPie = [
        { name: L.deaths, value: deaths },
        { name: "Other", value: deathsOther },
    ];
    const followUpsPie = [
        { name: L.followUps, value: followUps },
        { name: "Other", value: followUpsOther },
    ];

    const OTHER_COLOR = "#E5E7EB";
    const CHART_COLORS: string[] = [
        "#2563EB", // rescue - blue
        "#EF4444", // deaths - red
        "#10B981", // follow-ups - emerald
    ];

    // -------- Frontend-only export helpers ----------
    async function fetchAllRowsForRange() {
        const pageSizeAll = 500;
        let pageIdx = 1;
        let all: any[] = [];
        while (true) {
            const r = await api.get("/table-five", {
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
            "criticalPatientsName",
            "visitFindingsForCriticalPatient",
            "numberOfCriticalRescueCases",
            "numberOfDeaths",
            "numberOfFollowUpsForCriticallyIllPatients",
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
                    r.criticalPatientsName ?? "",
                    r.visitFindingsForCriticalPatient ?? "",
                    r.numberOfCriticalRescueCases ?? "",
                    r.numberOfDeaths ?? "",
                    r.numberOfFollowUpsForCriticallyIllPatients ?? "",
                    r.createdAt ? new Date(r.createdAt).toISOString() : "",
                ]
                    .map(escapeCell)
                    .join(",")
            );
        }

        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        downloadBlob(blob, `table-five_${from || "all"}_${to || "all"}.csv`);
    }

    async function exportXlsx() {
        const rows = await fetchAllRowsForRange();

        const data = rows.map((r) => ({
            ID: r.id,
            Date: toYYYYMMDD(r.date),
            CriticalPatientName: r.criticalPatientsName ?? null,
            VisitFindings: r.visitFindingsForCriticalPatient ?? null,
            RescueCases: r.numberOfCriticalRescueCases ?? null,
            Deaths: r.numberOfDeaths ?? null,
            FollowUps: r.numberOfFollowUpsForCriticallyIllPatients ?? null,
            CreatedAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
        }));

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data, { cellDates: false });
        XLSX.utils.book_append_sheet(wb, ws, "TableFive");

        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        downloadBlob(blob, `table-five_${from || "all"}_${to || "all"}.xlsx`);
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
                        <th className="px-3">{t("criticalName")}</th>
                        <th className="px-3">{t("findings")}</th>
                        <th className="px-3">{t("rescueCases")}</th>
                        <th className="px-3">{t("deaths")}</th>
                        <th className="px-3">{t("followUps")}</th>
                        <th className="px-3 w-32"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map((r) => (
                        <tr key={r.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">
                                {r.date ? new Date(r.date).toLocaleDateString() : new Date(r.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-3">{r.criticalPatientsName ?? "-"}</td>
                            <td className="px-3">{r.visitFindingsForCriticalPatient ?? "-"}</td>
                            <td className="px-3">{r.numberOfCriticalRescueCases ?? "-"}</td>
                            <td className="px-3">{r.numberOfDeaths ?? "-"}</td>
                            <td className="px-3">{r.numberOfFollowUpsForCriticallyIllPatients ?? "-"}</td>
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
                    <div className="text-xs text-gray-500">{t("rescueCases")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numberOfCriticalRescueCases}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("deaths")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numberOfDeaths}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">{t("followUps")} {t("totals")}</div>
                    <div className="text-2xl font-semibold">
                        {sums.numberOfFollowUpsForCriticallyIllPatients}
                    </div>
                </div>
            </div>

            {/* Percentage text */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("rescueCases"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{rescuePct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {rescue} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("deaths"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{deathsPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {deaths} / {sumTotal} {t("visits")}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">
                        {t("totalXOfSum", { x: t("followUps"), sum: sumTotal })}
                    </div>
                    <div className="text-2xl font-semibold">{followUpsPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {followUps} / {sumTotal} {t("visits")}
                    </div>
                </div>
            </div>

            {/* Pies */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Rescue vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("rescueCases")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={rescuePie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {rescuePie.map((_, i) => (
                                        <Cell key={`rescue-${i}`} fill={i === 0 ? CHART_COLORS[0] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {rescue} {t("of")} {sumTotal} {t("visits")} ({rescuePct})
                    </div>
                </div>

                {/* Deaths vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("deaths")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={deathsPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {deathsPie.map((_, i) => (
                                        <Cell key={`deaths-${i}`} fill={i === 0 ? CHART_COLORS[1] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {deaths} {t("of")} {sumTotal} {t("visits")} ({deathsPct})
                    </div>
                </div>

                {/* Follow-ups vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">{t("followUps")} {t("vsOther")}</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={followUpsPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {followUpsPie.map((_, i) => (
                                        <Cell key={`followups-${i}`} fill={i === 0 ? CHART_COLORS[2] : OTHER_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {followUps} {t("of")} {sumTotal} {t("visits")} ({followUpsPct})
                    </div>
                </div>
            </div>

            {/* Create dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-white/100 backdrop-blur-none">
                    <DialogHeader>
                        <DialogTitle>{t("addRecord")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />
                        <Input
                            type="text"
                            placeholder={t("placeholderName")}
                            value={form.criticalPatientsName}
                            onChange={(e) => setForm({ ...form, criticalPatientsName: e.target.value })}
                        />
                        <Input
                            type="text"
                            placeholder={t("placeholderFindings")}
                            value={form.visitFindingsForCriticalPatient}
                            onChange={(e) => setForm({ ...form, visitFindingsForCriticalPatient: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderRescue")}
                            value={form.numberOfCriticalRescueCases}
                            onChange={(e) => setForm({ ...form, numberOfCriticalRescueCases: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderDeaths")}
                            value={form.numberOfDeaths}
                            onChange={(e) => setForm({ ...form, numberOfDeaths: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder={t("placeholderFollowUps")}
                            value={form.numberOfFollowUpsForCriticallyIllPatients}
                            onChange={(e) =>
                                setForm({ ...form, numberOfFollowUpsForCriticallyIllPatients: e.target.value })
                            }
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
