// src/pages/TableOneQuarterly.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

// ---------- Types ----------
type QuarterlyRow = {
    quarter: string; // "Q1", "Q2", ...
    numOfAdverseReactionCases: number;
    numOfInadequateAnalgesia: number;
    numOfPostoperativeAnalgesiaCases: number;
    numOfPostoperativeVisits: number;
};

// ---------- i18n ----------
type Lang = "en" | "zh";

const STRINGS: Record<Lang, Record<string, string>> = {
    en: {
        title: "Table One – Quarterly Summary",
        year: "Year",
        apply: "Apply",
        exportCsv: "Export CSV",
        exportXlsx: "Export Excel",
        quarter: "Quarter",
        adverse: "Adverse Reactions",
        inadequate: "Inadequate Analgesia",
        postopAnalgesia: "Postop Analgesia Cases",
        visits: "Postop Visits",
        totals: "(Σ)",
        noEntries: "No quarterly data.",
        loading: "Loading…",
        error: "Failed to load quarterly data.",
        rows: "rows",
        lineChartTitle: "Quarterly Trend (Line Chart)",
        barChartTitle: "Quarterly Totals (Bar Chart)",
    },
    zh: {
        title: "表一 – 季度汇总",
        year: "年份",
        apply: "应用",
        exportCsv: "导出 CSV",
        exportXlsx: "导出 Excel",
        quarter: "季度",
        adverse: "不良反应",
        inadequate: "镇痛不足",
        postopAnalgesia: "术后镇痛例数",
        visits: "随访次数",
        totals: "（合计）",
        noEntries: "暂无季度数据。",
        loading: "加载中…",
        error: "加载季度数据失败。",
        rows: "行",
        lineChartTitle: "季度趋势（折线图）",
        barChartTitle: "季度总数（柱状图）",
    },
};

function useI18n() {
    const [lang, setLang] = useState<Lang>("en");
    const t = (key: string) => STRINGS[lang][key] ?? key;
    return { lang, setLang, t };
}

// ---------- Legend ----------
function TableOneLegend({ t }: { t: (key: string) => string }) {
    return (
        <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#2563EB" }}
        />
                <span>{t("adverse")}</span>
            </div>
            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#10B981" }}
        />
                <span>{t("inadequate")}</span>
            </div>
            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#F59E0B" }}
        />
                <span>{t("postopAnalgesia")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#EF4444" }}
        />
                <span>{t("visits")}</span>
            </div>
        </div>
    );
}

export default function TableOneQuarterly() {
    const { lang, setLang, t } = useI18n();

    const currentYear = new Date().getFullYear();
    const [yearInput, setYearInput] = useState<string>(String(currentYear));

    const [rows, setRows] = useState<QuarterlyRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const year = useMemo(() => {
        const n = Number(yearInput);
        return Number.isFinite(n) && n > 0 ? n : currentYear;
    }, [yearInput, currentYear]);

    const totals = useMemo(() => {
        return rows.reduce(
            (acc, r) => {
                acc.numOfAdverseReactionCases += r.numOfAdverseReactionCases;
                acc.numOfInadequateAnalgesia += r.numOfInadequateAnalgesia;
                acc.numOfPostoperativeAnalgesiaCases += r.numOfPostoperativeAnalgesiaCases;
                acc.numOfPostoperativeVisits +=
                    r.numOfPostoperativeVisits;
                return acc;
            },
            {
                numOfAdverseReactionCases: 0,
                numOfInadequateAnalgesia: 0,
                numOfPostoperativeAnalgesiaCases: 0,
                numOfPostoperativeVisits: 0,
            }
        );
    }, [rows]);

    async function loadData(targetYear: number) {
        try {
            setLoading(true);
            setError(null);

            const res = await api.post<QuarterlyRow[]>("/rpc/tableOneQuarterly", {
                year: targetYear,
            });

            const raw = res.data ?? [];

            // ✅ Normalize everything to numbers so sums don't concatenate
            const normalized: QuarterlyRow[] = raw.map((r) => ({
                quarter: r.quarter,
                numOfAdverseReactionCases:
                    Number((r as any).numOfAdverseReactionCases) || 0,
                numOfInadequateAnalgesia: Number((r as any).numOfInadequateAnalgesia) || 0,
                numOfPostoperativeAnalgesiaCases: Number((r as any).numOfPostoperativeAnalgesiaCases) || 0,
                numOfPostoperativeVisits:
                    Number((r as any).numOfPostoperativeVisits) || 0,
            }));

            setRows(normalized);
        } catch (err: any) {
            console.error("[TableOneQuarterly] load error:", err);
            if (err?.response?.status === 401) {
                setError("Unauthorized – please log in again.");
            } else {
                setError(t("error"));
            }
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // initial load for current year
        loadData(currentYear);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const n = Number(yearInput);
        if (!Number.isFinite(n) || n <= 0) return;
        loadData(n);
    }

    function exportCsv() {
        if (!rows.length) return;

        const header = [
            "quarter",
            "numOfAdverseReactionCases",
            "numOfInadequateAnalgesia",
            "numOfPostoperativeAnalgesiaCases",
            "numOfPostoperativeVisits",
        ];

        const lines = [
            header.join(","),
            ...rows.map((r) =>
                [
                    r.quarter,
                    r.numOfAdverseReactionCases,
                    r.numOfInadequateAnalgesia,
                    r.numOfPostoperativeAnalgesiaCases,
                    r.numOfPostoperativeVisits,
                ]
                    .map((v) => `${v}`)
                    .join(",")
            ),
        ];

        const blob = new Blob([lines.join("\n")], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `table-one-quarterly-${year}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async function exportXlsx() {
        if (!rows.length) return;

        const dataForSheet = rows.map((r) => ({
            Quarter: r.quarter,
            Adverse: r.numOfAdverseReactionCases,
            Inadequate: r.numOfInadequateAnalgesia,
            PostopAnalgesia: r.numOfPostoperativeAnalgesiaCases,
            Visits: r.numOfPostoperativeVisits,
        }));

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataForSheet, { cellDates: false });
        XLSX.utils.book_append_sheet(wb, ws, "TableOneQuarterly");

        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `table-one-quarterly-${year}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="space-y-4">
            {/* Header + controls */}
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

                <h1 className="text-lg font-semibold">{t("title")}</h1>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-wrap items-center gap-2 ml-auto"
                >
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{t("year")}:</span>
                        <Input
                            type="number"
                            className="w-24"
                            value={yearInput}
                            onChange={(e) => setYearInput(e.target.value)}
                        />
                    </label>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {loading ? t("loading") : t("apply")}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={exportCsv}
                        disabled={!rows.length}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {t("exportCsv")}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={exportXlsx}
                        disabled={!rows.length}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {t("exportXlsx")}
                    </Button>
                </form>
            </div>

            {/* Status */}
            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Quarterly table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="text-left border-b bg-gray-50">
                        <th className="py-2 px-3">{t("quarter")}</th>
                        <th className="px-3">{t("adverse")}</th>
                        <th className="px-3">{t("inadequate")}</th>
                        <th className="px-3">{t("postopAnalgesia")}</th>
                        <th className="px-3">{t("visits")}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((r) => (
                        <tr key={r.quarter} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">{`${year} ${r.quarter}`}</td>
                            <td className="px-3">{r.numOfAdverseReactionCases}</td>
                            <td className="px-3">{r.numOfInadequateAnalgesia}</td>
                            <td className="px-3">{r.numOfPostoperativeAnalgesiaCases}</td>
                            <td className="px-3">
                                {r.numOfPostoperativeVisits}
                            </td>
                        </tr>
                    ))}
                    {rows.length === 0 && !loading && (
                        <tr>
                            <td colSpan={7} className="py-10 text-center text-gray-500">
                                {t("noEntries")}
                            </td>
                        </tr>
                    )}
                    </tbody>
                    {rows.length > 0 && (
                        <tfoot>
                        <tr className="border-t bg-gray-50 font-semibold">
                            <td className="py-2 px-3">
                                {t("totals")} ({rows.length} {t("rows")})
                            </td>
                            <td className="px-3">
                                {totals.numOfAdverseReactionCases}
                            </td>
                            <td className="px-3">{totals.numOfInadequateAnalgesia}</td>
                            <td className="px-3">{totals.numOfPostoperativeAnalgesiaCases}</td>
                            <td className="px-3">
                                {totals.numOfPostoperativeVisits}
                            </td>
                        </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* Line Chart (under table) */}
            {rows.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h2 className="text-sm font-semibold mb-2">
                        {t("lineChartTitle")}
                    </h2>

                    <TableOneLegend t={t} />

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={rows}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="quarter" />
                                <YAxis />
                                <Tooltip />
                                {/* No Recharts Legend, we use our own */}

                                <Line
                                    type="monotone"
                                    dataKey="numOfAdverseReactionCases"
                                    name={t("adverse")}
                                    stroke="#2563EB"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfInadequateAnalgesia"
                                    name={t("inadequate")}
                                    stroke="#10B981"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfPostoperativeAnalgesiaCases"
                                    name={t("postopAnalgesia")}
                                    stroke="#F59E0B"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfPostoperativeVisits"
                                    name={t("visits")}
                                    stroke="#EF4444"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Bar Chart (under line chart) */}
            {rows.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h2 className="text-sm font-semibold mb-2">
                        {t("barChartTitle")}
                    </h2>

                    <TableOneLegend t={t} />

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rows}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="quarter" />
                                <YAxis />
                                <Tooltip />
                                {/* No Recharts Legend */}

                                <Bar
                                    dataKey="numOfAdverseReactionCases"
                                    name={t("adverse")}
                                    fill="#2563EB"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfInadequateAnalgesia"
                                    name={t("inadequate")}
                                    fill="#10B981"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfPostoperativeAnalgesiaCases"
                                    name={t("postopAnalgesia")}
                                    fill="#F59E0B"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfPostoperativeVisits"
                                    name={t("visits")}
                                    fill="#EF4444"
                                    isAnimationActive={false}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
