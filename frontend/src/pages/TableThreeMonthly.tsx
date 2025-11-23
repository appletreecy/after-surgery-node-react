// src/pages/TableThreeMonthly.tsx
import { useMemo, useState } from "react";
import { gql, useQuery } from "@apollo/client";
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
    Legend,
} from "recharts";

// ---------- GraphQL ----------
const TABLE_THREE_MONTHLY = gql`
  query TableThreeMonthly($year: Int!) {
    tableThreeMonthly(year: $year) {
      month
      numOfJointComplicationCount
      numOfMotorDysfunctionCount
      numOfTraumaComplicationCount
      numOfAnkleComplicationCount
      numOfPediatricAdverseEventCount
      numOfSpinalComplicationCount
      numOfHandSurgeryComplicationCount
      numOfObstetricAdverseEventCount
      numOfGynecologicalAdverseEventCount
      numOfSurgicalTreatmentCount
    }
  }
`;

// ---------- Types ----------
type MonthlyRow = {
    month: string;
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

type TableThreeMonthlyData = {
    tableThreeMonthly: MonthlyRow[];
};

type TableThreeMonthlyVars = {
    year: number;
};

// ---------- i18n ----------
type Lang = "en" | "zh";

const STRINGS: Record<Lang, Record<string, string>> = {
    en: {
        title: "Table One – Monthly Summary",
        year: "Year",
        apply: "Apply",
        exportCsv: "Export CSV",
        exportXlsx: "Export Excel",
        month: "Month",
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
        noEntries: "No monthly data.",
        loading: "Loading…",
        error: "Failed to load monthly data.",
        rows: "rows",
        lineChartTitle: "Monthly Trend (Line Chart)",
        barChartTitle: "Monthly Totals (Bar Chart)",
    },
    zh: {
        title: "表一 – 月度汇总",
        year: "年份",
        apply: "应用",
        exportCsv: "导出 CSV",
        exportXlsx: "导出 Excel",
        month: "月份",
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
        noEntries: "暂无月度数据。",
        loading: "加载中…",
        error: "加载月度数据失败。",
        rows: "行",
        lineChartTitle: "月度趋势（折线图）",
        barChartTitle: "月度总数（柱状图）",
    },
};

function useI18n() {
    const [lang, setLang] = useState<Lang>("en");
    const t = (key: string) => STRINGS[lang][key] ?? key;
    return { lang, setLang, t };
}

export default function TableThreeMonthly() {
    const { lang, setLang, t } = useI18n();

    const currentYear = new Date().getFullYear();
    const [yearInput, setYearInput] = useState<string>(String(currentYear));

    const year = useMemo(() => {
        const n = Number(yearInput);
        return Number.isFinite(n) && n > 0 ? n : currentYear;
    }, [yearInput, currentYear]);

    const { data, loading, error, refetch } = useQuery<
        TableThreeMonthlyData,
        TableThreeMonthlyVars
    >(TABLE_THREE_MONTHLY, {
        variables: { year },
    });

    const rows: MonthlyRow[] = data?.tableThreeMonthly ?? [];

    const totals = useMemo(() => {
        return rows.reduce(
            (acc, r) => {
                acc.numOfJointComplicationCount += r.numOfJointComplicationCount;
                acc.numOfMotorDysfunctionCount += r.numOfMotorDysfunctionCount;
                acc.numOfTraumaComplicationCount +=
                    r.numOfTraumaComplicationCount;
                acc.numOfAnkleComplicationCount += r.numOfAnkleComplicationCount;
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

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const n = Number(yearInput);
        if (!Number.isFinite(n) || n <= 0) return;
        refetch({ year: n });
    }

    function exportCsv() {
        if (!rows.length) return;

        const header = [
            "month",
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
                    r.month,
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
        a.download = `table-three-monthly-${year}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async function exportXlsx() {
        if (!rows.length) return;

        const dataForSheet = rows.map((r) => ({
            Month: r.month,
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
        XLSX.utils.book_append_sheet(wb, ws, "TableThreeMonthly");

        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `table-three-monthly-${year}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="space-y-4">
            {/* Header + controls */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Language toggle – same as TableOne */}
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
                    {t("error")}
                </div>
            )}

            {/* Monthly table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="text-left border-b bg-gray-50">
                        <th className="py-2 px-3">{t("month")}</th>
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
                        <tr key={r.month} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">{r.month}</td>
                            <td className="px-3">{r.numOfJointComplicationCount}</td>
                            <td className="px-3">{r.numOfMotorDysfunctionCount}</td>
                            <td className="px-3">
                                {r.numOfTraumaComplicationCount}
                            </td>
                            <td className="px-3">{r.numOfAnkleComplicationCount}</td>
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
                            <td
                                colSpan={5}
                                className="py-10 text-center text-gray-500"
                            >
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
                            <td className="px-3">
                                {totals.numOfMotorDysfunctionCount}
                            </td>
                            <td className="px-3">
                                {totals.numOfTraumaComplicationCount}
                            </td>
                            <td className="px-3">
                                {totals.numOfAnkleComplicationCount}
                            </td>
                            <td className="px-3">
                                {totals.numOfPediatricAdverseEventCount}
                            </td>
                            <td className="px-3">
                                {totals.numOfSpinalComplicationCount}
                            </td>
                            <td className="px-3">
                                {totals.numOfHandSurgeryComplicationCount}
                            </td>
                            <td className="px-3">
                                {totals.numOfObstetricAdverseEventCount}
                            </td>
                            <td className="px-3">
                                {totals.numOfGynecologicalAdverseEventCount}
                            </td>
                            <td className="px-3">
                                {totals.numOfSurgicalTreatmentCount}
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
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={rows}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="numOfJointComplicationCount"
                                    name={t("joint")}
                                    stroke="#2563EB"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfMotorDysfunctionCount"
                                    name={t("motor")}
                                    stroke="#10B981"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfTraumaComplicationCount"
                                    name={t("trauma")}
                                    stroke="#F59E0B"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfAnkleComplicationCount"
                                    name={t("ankle")}
                                    stroke="#EF4444"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfPediatricAdverseEventCount"
                                    name={t("pediatric")}
                                    stroke="#8B5CF6"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfSpinalComplicationCount"
                                    name={t("spinal")}
                                    stroke="#06B6D4"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfHandSurgeryComplicationCount"
                                    name={t("hand")}
                                    stroke="#84CC16"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfObstetricAdverseEventCount"
                                    name={t("obstetric")}
                                    stroke="#F97316"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfGynecologicalAdverseEventCount"
                                    name={t("gyn")}
                                    stroke="#EC4899"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfSurgicalTreatmentCount"
                                    name={t("surgical")}
                                    stroke="#14B8A6"
                                    dot={false}
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
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rows}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="numOfJointComplicationCount"
                                    name={t("joint")}
                                    fill="#2563EB"
                                />
                                <Bar
                                    dataKey="numOfMotorDysfunctionCount"
                                    name={t("motor")}
                                    fill="#10B981"
                                />
                                <Bar
                                    dataKey="numOfTraumaComplicationCount"
                                    name={t("trauma")}
                                    fill="#F59E0B"
                                />
                                <Bar
                                    dataKey="numOfAnkleComplicationCount"
                                    name={t("ankle")}
                                    fill="#EF4444"
                                />
                                <Bar
                                    dataKey="numOfPediatricAdverseEventCount"
                                    name={t("pediatric")}
                                    fill="#8B5CF6"
                                />
                                <Bar
                                    dataKey="numOfSpinalComplicationCount"
                                    name={t("spinal")}
                                    fill="#06B6D4"
                                />
                                <Bar
                                    dataKey="numOfHandSurgeryComplicationCount"
                                    name={t("hand")}
                                    fill="#84CC16"
                                />
                                <Bar
                                    dataKey="numOfObstetricAdverseEventCount"
                                    name={t("obstetric")}
                                    fill="#F97316"
                                />
                                <Bar
                                    dataKey="numOfGynecologicalAdverseEventCount"
                                    name={t("gyn")}
                                    fill="#EC4899"
                                />
                                <Bar
                                    dataKey="numOfSurgicalTreatmentCount"
                                    name={t("surgical")}
                                    fill="#14B8A6"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
