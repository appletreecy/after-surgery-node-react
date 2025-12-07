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
    numOfFormulationOne: number;
    numOfFormulationTwo: number;
    numOfFormulationThree: number;
    numOfFormulationFour: number;
    numOfFormulationFive: number;
    numOfFormulationSix: number;
};

// ---------- i18n ----------
type Lang = "en" | "zh";

const STRINGS: Record<Lang, Record<string, string>> = {
    en: {
        title: "Table Four – Quarterly Summary",
        year: "Year",
        apply: "Apply",
        exportCsv: "Export CSV",
        exportXlsx: "Export Excel",
        quarter: "Quarter",
        formulationOne: "Formulation One",
        formulationTwo: "Formulation Two",
        formulationThree: "Formulation Three",
        formulationFour: "Formulation Four",
        formulationFive: "Formulation Five",
        formulationSix: "Formulation Six",
        totals: "(Σ)",
        noEntries: "No quarterly data.",
        loading: "Loading…",
        error: "Failed to load quarterly data.",
        rows: "rows",
        lineChartTitle: "Quarterly Trend (Line Chart)",
        barChartTitle: "Quarterly Totals (Bar Chart)",
    },
    zh: {
        title: "表四 – 季度汇总",
        year: "年份",
        apply: "应用",
        exportCsv: "导出 CSV",
        exportXlsx: "导出 Excel",
        quarter: "季度",
        formulationOne: "配方一",
        formulationTwo: "配方二",
        formulationThree: "配方三",
        formulationFour: "配方四",
        formulationFive: "配方五",
        formulationSix: "配方六",
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
function TableFourLegend({ t }: { t: (key: string) => string }) {
    return (
        <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#2563EB" }}
        />
                <span>{t("formulationOne")}</span>
            </div>
            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#10B981" }}
        />
                <span>{t("formulationTwo")}</span>
            </div>
            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#F59E0B" }}
        />
                <span>{t("formulationThree")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#EF4444" }}
        />
                <span>{t("formulationFour")}</span>
            </div>
            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#8B5CF6" }}
        />
                <span>{t("formulationFive")}</span>
            </div>
            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#06B6D4" }}
        />
                <span>{t("formulationSix")}</span>
            </div>
        </div>
    );
}

export default function TableFourQuarterly() {
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
                acc.numOfFormulationOne += r.numOfFormulationOne;
                acc.numOfFormulationTwo += r.numOfFormulationTwo;
                acc.numOfFormulationThree += r.numOfFormulationThree;
                acc.numOfFormulationFour += r.numOfFormulationFour;
                acc.numOfFormulationFive += r.numOfFormulationFive;
                acc.numOfFormulationSix +=
                    r.numOfFormulationSix;
                return acc;
            },
            {
                numOfFormulationOne: 0,
                numOfFormulationTwo: 0,
                numOfFormulationThree: 0,
                numOfFormulationFour: 0,
                numOfFormulationFive: 0,
                numOfFormulationSix: 0,
            }
        );
    }, [rows]);

    async function loadData(targetYear: number) {
        try {
            setLoading(true);
            setError(null);

            const res = await api.post<QuarterlyRow[]>("/rpc/tableFourQuarterly", {
                year: targetYear,
            });

            const raw = res.data ?? [];

            // ✅ Normalize everything to numbers so sums don't concatenate
            const normalized: QuarterlyRow[] = raw.map((r) => ({
                quarter: r.quarter,
                numOfFormulationOne:
                    Number((r as any).numOfFormulationOne) || 0,
                numOfFormulationTwo: Number((r as any).numOfFormulationTwo) || 0,
                numOfFormulationThree: Number((r as any).numOfFormulationThree) || 0,
                numOfFormulationFour: Number((r as any).numOfFormulationFour) || 0,
                numOfFormulationFive: Number((r as any).numOfFormulationFive) || 0,
                numOfFormulationSix:
                    Number((r as any).numOfFormulationSix) || 0,
            }));

            setRows(normalized);
        } catch (err: any) {
            console.error("[TableFourQuarterly] load error:", err);
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
            "numOfFormulationOne",
            "numOfFormulationTwo",
            "numOfFormulationThree",
            "numOfFormulationFour",
            "numOfFormulationFive",
            "numOfFormulationSix",
        ];

        const lines = [
            header.join(","),
            ...rows.map((r) =>
                [
                    r.quarter,
                    r.numOfFormulationOne,
                    r.numOfFormulationTwo,
                    r.numOfFormulationThree,
                    r.numOfFormulationFour,
                    r.numOfFormulationFive,
                    r.numOfFormulationSix,
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
        a.download = `table-four-quarterly-${year}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async function exportXlsx() {
        if (!rows.length) return;

        const dataForSheet = rows.map((r) => ({
            Quarter: r.quarter,
            FormulationOne: r.numOfFormulationOne,
            FormulationTwo: r.numOfFormulationTwo,
            FormulationThree: r.numOfFormulationThree,
            FormulationFour: r.numOfFormulationFour,
            FormulationFive: r.numOfFormulationFive,
            FormulationSix: r.numOfFormulationSix,
        }));

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataForSheet, { cellDates: false });
        XLSX.utils.book_append_sheet(wb, ws, "TableFourQuarterly");

        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `table-four-quarterly-${year}.xlsx`;
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
                        <th className="px-3">{t("formulationOne")}</th>
                        <th className="px-3">{t("formulationTwo")}</th>
                        <th className="px-3">{t("formulationThree")}</th>
                        <th className="px-3">{t("formulationFour")}</th>
                        <th className="px-3">{t("formulationFive")}</th>
                        <th className="px-3">{t("formulationSix")}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((r) => (
                        <tr key={r.quarter} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">{`${year} ${r.quarter}`}</td>
                            <td className="px-3">{r.numOfFormulationOne}</td>
                            <td className="px-3">{r.numOfFormulationTwo}</td>
                            <td className="px-3">{r.numOfFormulationThree}</td>
                            <td className="px-3">{r.numOfFormulationFour}</td>
                            <td className="px-3">{r.numOfFormulationFive}</td>
                            <td className="px-3">
                                {r.numOfFormulationSix}
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
                                {totals.numOfFormulationOne}
                            </td>
                            <td className="px-3">{totals.numOfFormulationTwo}</td>
                            <td className="px-3">{totals.numOfFormulationThree}</td>
                            <td className="px-3">{totals.numOfFormulationFour}</td>
                            <td className="px-3">{totals.numOfFormulationFive}</td>
                            <td className="px-3">
                                {totals.numOfFormulationSix}
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

                    <TableFourLegend t={t} />

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
                                    dataKey="numOfFormulationOne"
                                    name={t("formulationOne")}
                                    stroke="#2563EB"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfFormulationTwo"
                                    name={t("formulationTwo")}
                                    stroke="#10B981"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfFormulationThree"
                                    name={t("formulationThree")}
                                    stroke="#F59E0B"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfFormulationFour"
                                    name={t("formulationFour")}
                                    stroke="#EF4444"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfFormulationFive"
                                    name={t("formulationFive")}
                                    stroke="#8B5CF6"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfFormulationSix"
                                    name={t("formulationSix")}
                                    stroke="#06B6D4"
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

                    <TableFourLegend t={t} />

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rows}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="quarter" />
                                <YAxis />
                                <Tooltip />
                                {/* No Recharts Legend */}

                                <Bar
                                    dataKey="numOfFormulationOne"
                                    name={t("formulationOne")}
                                    fill="#2563EB"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfFormulationTwo"
                                    name={t("formulationTwo")}
                                    fill="#10B981"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfFormulationThree"
                                    name={t("formulationThree")}
                                    fill="#F59E0B"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfFormulationFour"
                                    name={t("formulationFour")}
                                    fill="#EF4444"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfFormulationFive"
                                    name={t("formulationFive")}
                                    fill="#8B5CF6"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfFormulationSix"
                                    name={t("formulationSix")}
                                    fill="#06B6D4"
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
