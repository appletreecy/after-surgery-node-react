// src/pages/TableThreeQuarterly.tsx
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

// ---------- i18n ----------
type Lang = "en" | "zh";

const STRINGS: Record<Lang, Record<string, string>> = {
    en: {
        title: "Table Three – Quarterly Summary",
        year: "Year",
        apply: "Apply",
        exportCsv: "Export CSV",
        exportXlsx: "Export Excel",
        quarter: "Quarter",
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
        totals: "(Σ)",
        noEntries: "No quarterly data.",
        loading: "Loading…",
        error: "Failed to load quarterly data.",
        rows: "rows",
        lineChartTitle: "Quarterly Trend (Line Chart)",
        barChartTitle: "Quarterly Totals (Bar Chart)",
    },
    zh: {
        title: "表三 – 季度汇总",
        year: "年份",
        apply: "应用",
        exportCsv: "导出 CSV",
        exportXlsx: "导出 Excel",
        quarter: "季度",
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
function TableThreeLegend({ t }: { t: (key: string) => string }) {
    return (
        <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#2563EB" }}
        />
                <span>{t("joint")}</span>
            </div>
            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#10B981" }}
        />
                <span>{t("motor")}</span>
            </div>
            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#F59E0B" }}
        />
                <span>{t("trauma")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#EF4444" }}
        />
                <span>{t("ankle")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#10B981" }}
        />
                <span>{t("pediatric")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#F59E0B" }}
        />
                <span>{t("spinal")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#8B5CF6" }}
        />
                <span>{t("hand")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#EC4899" }}
        />
                <span>{t("obstetric")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#14B8A6" }}
        />
                <span>{t("gyn")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#F97316" }}
        />
                <span>{t("surgical")}</span>
            </div>
        </div>
    );
}

export default function TableThreeQuarterly() {
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
                acc.numOfJointComplicationCount += r.numOfJointComplicationCount;
                acc.numOfMotorDysfunctionCount += r.numOfMotorDysfunctionCount;
                acc.numOfTraumaComplicationCount += r.numOfTraumaComplicationCount;
                acc.numOfAnkleComplicationCount +=
                    r.numOfAnkleComplicationCount;
                acc.numOfPediatricAdverseEventCount += r.numOfPediatricAdverseEventCount;
                acc.numOfSpinalComplicationCount += r.numOfSpinalComplicationCount;
                acc.numOfHandSurgeryComplicationCount += r.numOfHandSurgeryComplicationCount;
                acc.numOfObstetricAdverseEventCount += r.numOfObstetricAdverseEventCount;
                acc.numOfGynecologicalAdverseEventCount += r.numOfGynecologicalAdverseEventCount;
                acc.numOfSurgicalTreatmentCount += r.numOfSurgicalTreatmentCount;
                return acc;
            },
            {
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
            }
        );
    }, [rows]);

    async function loadData(targetYear: number) {
        try {
            setLoading(true);
            setError(null);

            const res = await api.post<QuarterlyRow[]>("/rpc/tableThreeQuarterly", {
                year: targetYear,
            });

            const raw = res.data ?? [];

            // ✅ Normalize everything to numbers so sums don't concatenate
            const normalized: QuarterlyRow[] = raw.map((r) => ({
                quarter: r.quarter,
                numOfJointComplicationCount:
                    Number((r as any).numOfJointComplicationCount) || 0,
                numOfMotorDysfunctionCount: Number((r as any).numOfMotorDysfunctionCount) || 0,
                numOfTraumaComplicationCount: Number((r as any).numOfTraumaComplicationCount) || 0,
                numOfAnkleComplicationCount:
                    Number((r as any).numOfAnkleComplicationCount) || 0,
                numOfPediatricAdverseEventCount: Number((r as any).numOfPediatricAdverseEventCount) || 0,
                numOfSpinalComplicationCount: Number((r as any).numOfSpinalComplicationCount) || 0,
                numOfHandSurgeryComplicationCount: Number((r as any).numOfHandSurgeryComplicationCount) || 0,
                numOfObstetricAdverseEventCount: Number((r as any).numOfObstetricAdverseEventCount) || 0,
                numOfGynecologicalAdverseEventCount: Number((r as any).numOfGynecologicalAdverseEventCount) || 0,
                numOfSurgicalTreatmentCount: Number((r as any).numOfSurgicalTreatmentCount) || 0,
            }));

            setRows(normalized);
        } catch (err: any) {
            console.error("[TableThreeQuarterly] load error:", err);
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
        ];

        const lines = [
            header.join(","),
            ...rows.map((r) =>
                [
                    r.quarter,
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
        a.download = `table-three-quarterly-${year}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async function exportXlsx() {
        if (!rows.length) return;

        const dataForSheet = rows.map((r) => ({
            Quarter: r.quarter,
            Joint: r.numOfJointComplicationCount,
            Motor: r.numOfMotorDysfunctionCount,
            Trauma: r.numOfTraumaComplicationCount,
            Ankle: r.numOfAnkleComplicationCount,
            Pediatric: r.numOfPediatricAdverseEventCount,
            Spinal: r.numOfSpinalComplicationCount,
            Hand: r.numOfHandSurgeryComplicationCount,
            Obstetric: r.numOfObstetricAdverseEventCount,
            Gyn: r.numOfGynecologicalAdverseEventCount,
            Surgical: r.numOfSurgicalTreatmentCount,
        }));

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataForSheet, { cellDates: false });
        XLSX.utils.book_append_sheet(wb, ws, "TableThreeQuarterly");

        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `table-three-quarterly-${year}.xlsx`;
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
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((r) => (
                        <tr key={r.quarter} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">{`${year} ${r.quarter}`}</td>
                            <td className="px-3">{r.numOfJointComplicationCount}</td>
                            <td className="px-3">{r.numOfMotorDysfunctionCount}</td>
                            <td className="px-3">{r.numOfTraumaComplicationCount}</td>
                            <td className="px-3">
                                {r.numOfAnkleComplicationCount}
                            </td>
                            <td className="px-3">{r.numOfPediatricAdverseEventCount}</td>
                            <td className="px-3">{r.numOfSpinalComplicationCount}</td>
                            <td className="px-3">{r.numOfHandSurgeryComplicationCount}</td>
                            <td className="px-3">{r.numOfObstetricAdverseEventCount}</td>
                            <td className="px-3">{r.numOfGynecologicalAdverseEventCount}</td>
                            <td className="px-3">{r.numOfSurgicalTreatmentCount}</td>
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
                                {totals.numOfJointComplicationCount}
                            </td>
                            <td className="px-3">{totals.numOfMotorDysfunctionCount}</td>
                            <td className="px-3">{totals.numOfTraumaComplicationCount}</td>
                            <td className="px-3">
                                {totals.numOfAnkleComplicationCount}
                            </td>
                            <td className="px-3">{totals.numOfPediatricAdverseEventCount}</td>
                            <td className="px-3">{totals.numOfSpinalComplicationCount}</td>
                            <td className="px-3">{totals.numOfHandSurgeryComplicationCount}</td>
                            <td className="px-3">{totals.numOfObstetricAdverseEventCount}</td>
                            <td className="px-3">{totals.numOfGynecologicalAdverseEventCount}</td>
                            <td className="px-3">{totals.numOfSurgicalTreatmentCount}</td>
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

                    <TableThreeLegend t={t} />

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
                                    dataKey="numOfJointComplicationCount"
                                    name={t("joint")}
                                    stroke="#2563EB"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfMotorDysfunctionCount"
                                    name={t("motor")}
                                    stroke="#10B981"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfTraumaComplicationCount"
                                    name={t("trauma")}
                                    stroke="#F59E0B"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfAnkleComplicationCount"
                                    name={t("ankle")}
                                    stroke="#EF4444"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfPediatricAdverseEventCount"
                                    name={t("pediatric")}
                                    stroke="#10B981"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfSpinalComplicationCount"
                                    name={t("spinal")}
                                    stroke="#F59E0B"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfHandSurgeryComplicationCount"
                                    name={t("hand")}
                                    stroke="#8B5CF6"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfObstetricAdverseEventCount"
                                    name={t("obstetric")}
                                    stroke="#EC4899"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfGynecologicalAdverseEventCount"
                                    name={t("gyn")}
                                    stroke="#14B8A6"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfSurgicalTreatmentCount"
                                    name={t("surgical")}
                                    stroke="#F97316"
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

                    <TableThreeLegend t={t} />

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rows}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="quarter" />
                                <YAxis />
                                <Tooltip />
                                {/* No Recharts Legend */}

                                <Bar
                                    dataKey="numOfJointComplicationCount"
                                    name={t("joint")}
                                    fill="#2563EB"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfMotorDysfunctionCount"
                                    name={t("motor")}
                                    fill="#10B981"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfTraumaComplicationCount"
                                    name={t("trauma")}
                                    fill="#F59E0B"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfAnkleComplicationCount"
                                    name={t("ankle")}
                                    fill="#EF4444"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfPediatricAdverseEventCount"
                                    name={t("pediatric")}
                                    fill="#10B981"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfSpinalComplicationCount"
                                    name={t("spinal")}
                                    fill="#F59E0B"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfHandSurgeryComplicationCount"
                                    name={t("hand")}
                                    fill="#8B5CF6"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfObstetricAdverseEventCount"
                                    name={t("obstetric")}
                                    fill="#EC4899"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfGynecologicalAdverseEventCount"
                                    name={t("gyn")}
                                    fill="#14B8A6"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfSurgicalTreatmentCount"
                                    name={t("surgical")}
                                    fill="#F97316"
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
