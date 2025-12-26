// src/pages/TableTwoMonthly.tsx
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
const TABLE_TWO_MONTHLY = gql`
  query TableTwoMonthly($year: Int!) {
    tableTwoMonthly(year: $year) {
      month
      numOfAbdominalDistension
      numOfAllergicRash
      numOfChestDiscomfort
      numOfDelirium
      numOfDizziness
      numOfEndotrachealIntubationDiscomfort
      numOfEpigastricPain
      numOfItching
      numOfNauseaAndVomiting
      numOfNauseaAndVomitingAndDizziness
      numOfOther
      numOfProlongedAnestheticRecovery
      numOfPunctureSiteAbnormality
      numOfTourniquetReaction
    }
  }
`;

// ---------- Types ----------
type MonthlyRow = {
    month: string;
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

type TableTwoMonthlyData = {
    tableTwoMonthly: MonthlyRow[];
};

type TableTwoMonthlyVars = {
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

export default function TableTwoMonthly() {
    const { lang, setLang, t } = useI18n();

    const currentYear = new Date().getFullYear();
    const [yearInput, setYearInput] = useState<string>(String(currentYear));

    const year = useMemo(() => {
        const n = Number(yearInput);
        return Number.isFinite(n) && n > 0 ? n : currentYear;
    }, [yearInput, currentYear]);

    const { data, loading, error, refetch } = useQuery<
        TableTwoMonthlyData,
        TableTwoMonthlyVars
    >(TABLE_TWO_MONTHLY, {
        variables: { year },
    });

    const rows: MonthlyRow[] = data?.tableTwoMonthly ?? [];

    const totals = useMemo(() => {
        return rows.reduce(
            (acc, r) => {
                acc.numOfAbdominalDistension += r.numOfAbdominalDistension;
                acc.numOfAllergicRash += r.numOfAllergicRash;
                acc.numOfChestDiscomfort +=
                    r.numOfChestDiscomfort;
                acc.numOfDelirium += r.numOfDelirium;
                acc.numOfDizziness += r.numOfDizziness;
                acc.numOfEndotrachealIntubationDiscomfort += r.numOfEndotrachealIntubationDiscomfort;
                acc.numOfEpigastricPain += r.numOfEpigastricPain;
                acc.numOfItching += r.numOfItching;
                acc.numOfNauseaAndVomiting += r.numOfNauseaAndVomiting;
                acc.numOfNauseaAndVomitingAndDizziness += r.numOfNauseaAndVomitingAndDizziness;
                acc.numOfOther += r.numOfOther;
                acc.numOfProlongedAnestheticRecovery += r.numOfProlongedAnestheticRecovery;
                acc.numOfPunctureSiteAbnormality += r.numOfPunctureSiteAbnormality;
                acc.numOfTourniquetReaction += r.numOfTourniquetReaction;
                return acc;
            },
            {
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
        ];

        const lines = [
            header.join(","),
            ...rows.map((r) =>
                [
                    r.month,
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
        a.download = `table-two-monthly-${year}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async function exportXlsx() {
        if (!rows.length) return;

        const dataForSheet = rows.map((r) => ({
            Month: r.month,
            AbdominalDistension: r.numOfAbdominalDistension,
            AllergicRash: r.numOfAllergicRash,
            ChestDiscomfort: r.numOfChestDiscomfort,
            Delirium: r.numOfDelirium,
            Dizziness: r.numOfDizziness,
            EndotrachealIntubationDiscomfort: r.numOfEndotrachealIntubationDiscomfort,
            EpigastricPain: r.numOfEpigastricPain,
            Itching: r.numOfItching,
            NauseaAndVomiting: r.numOfNauseaAndVomiting,
            NauseaAndVomitingAndDizziness: r.numOfNauseaAndVomitingAndDizziness,
            Other: r.numOfOther,
            ProlongedAnestheticRecovery: r.numOfProlongedAnestheticRecovery,
            PunctureSiteAbnormality: r.numOfPunctureSiteAbnormality,
            TourniquetReaction: r.numOfTourniquetReaction,
        }));

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataForSheet, { cellDates: false });
        XLSX.utils.book_append_sheet(wb, ws, "TableTwoMonthly");

        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `table-two-monthly-${year}.xlsx`;
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
            <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
                <table className="min-w-[640px] w-full text-sm">
                    <thead>
                    <tr className="text-left border-b bg-gray-50">
                        <th className="py-2 px-3">{t("month")}</th>
                        <th className="px-3 text-center">{t("abdominalDistension")}</th>
                        <th className="px-3 text-center">{t("allergicRash")}</th>
                        <th className="px-3 text-center">{t("chestDiscomfort")}</th>
                        <th className="px-3 text-center">{t("delirium")}</th>
                        <th className="px-3 text-center">{t("dizziness")}</th>
                        <th className="px-3 text-center">{t("endotrachealIntubationDiscomfort")}</th>
                        <th className="px-3 text-center">{t("epigastricPain")}</th>
                        <th className="px-3 text-center">{t("itching")}</th>
                        <th className="px-3 text-center">{t("nauseaAndVomiting")}</th>
                        <th className="px-3 text-center">{t("nauseaAndVomitingAndDizziness")}</th>
                        <th className="px-3 text-center">{t("other")}</th>
                        <th className="px-3 text-center">{t("prolongedAnestheticRecovery")}</th>
                        <th className="px-3 text-center">{t("punctureSiteAbnormality")}</th>
                        <th className="px-3 text-center">{t("tourniquetReaction")}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((r) => (
                        <tr key={r.month} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">{r.month}</td>
                            <td className="px-3 text-center">{r.numOfAbdominalDistension}</td>
                            <td className="px-3 text-center">{r.numOfAllergicRash}</td>
                            <td className="px-3 text-center">
                                {r.numOfChestDiscomfort}
                            </td>
                            <td className="px-3 text-center">{r.numOfDelirium}</td>
                            <td className="px-3 text-center">{r.numOfDizziness}</td>
                            <td className="px-3 text-center">{r.numOfEndotrachealIntubationDiscomfort}</td>
                            <td className="px-3 text-center">{r.numOfEpigastricPain}</td>
                            <td className="px-3 text-center">{r.numOfItching}</td>
                            <td className="px-3 text-center">{r.numOfNauseaAndVomiting}</td>
                            <td className="px-3 text-center">{r.numOfNauseaAndVomitingAndDizziness}</td>
                            <td className="px-3 text-center">{r.numOfOther}</td>
                            <td className="px-3 text-center">{r.numOfProlongedAnestheticRecovery}</td>
                            <td className="px-3 text-center">{r.numOfPunctureSiteAbnormality}</td>
                            <td className="px-3 text-center">{r.numOfTourniquetReaction}</td>
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
                            <td className="px-3 text-center">
                                {totals.numOfAbdominalDistension}
                            </td>
                            <td className="px-3 text-center">
                                {totals.numOfAllergicRash}
                            </td>
                            <td className="px-3 text-center">
                                {totals.numOfChestDiscomfort}
                            </td>
                            <td className="px-3 text-center">
                                {totals.numOfDelirium}
                            </td>
                            <td className="px-3 text-center">
                                {totals.numOfDizziness}
                            </td>
                            <td className="px-3 text-center">
                                {totals.numOfEndotrachealIntubationDiscomfort}
                            </td>
                            <td className="px-3 text-center">
                                {totals.numOfEpigastricPain}
                            </td>
                            <td className="px-3 text-center">
                                {totals.numOfItching}
                            </td>
                            <td className="px-3 text-center">
                                {totals.numOfNauseaAndVomiting}
                            </td>
                            <td className="px-3 text-center">
                                {totals.numOfNauseaAndVomitingAndDizziness}
                            </td>
                            <td className="px-3 text-center">
                                {totals.numOfOther}
                            </td>
                            <td className="px-3 text-center">
                                {totals.numOfProlongedAnestheticRecovery}
                            </td>
                            <td className="px-3 text-center">
                                {totals.numOfPunctureSiteAbnormality}
                            </td>
                            <td className="px-3 text-center">
                                {totals.numOfTourniquetReaction}
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
                                    dataKey="numOfAbdominalDistension"
                                    name={t("abdominalDistension")}
                                    stroke="#2563EB"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfAllergicRash"
                                    name={t("allergicRash")}
                                    stroke="#EF4444"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfChestDiscomfort"
                                    name={t("chestDiscomfort")}
                                    stroke="#10B981"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfDelirium"
                                    name={t("delirium")}
                                    stroke="#F59E0B"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfDizziness"
                                    name={t("dizziness")}
                                    stroke="#8B5CF6"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfEndotrachealIntubationDiscomfort"
                                    name={t("endotrachealIntubationDiscomfort")}
                                    stroke="#EC4899"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfEpigastricPain"
                                    name={t("epigastricPain")}
                                    stroke="#14B8A6"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfItching"
                                    name={t("itching")}
                                    stroke="#F97316"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfNauseaAndVomiting"
                                    name={t("nauseaAndVomiting")}
                                    stroke="#3B82F6"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfNauseaAndVomitingAndDizziness"
                                    name={t("nauseaAndVomitingAndDizziness")}
                                    stroke="#84CC16"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfOther"
                                    name={t("other")}
                                    stroke="#D946EF"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfProlongedAnestheticRecovery"
                                    name={t("prolongedAnestheticRecovery")}
                                    stroke="#A855F7"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfPunctureSiteAbnormality"
                                    name={t("punctureSiteAbnormality")}
                                    stroke="#22C55E"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfTourniquetReaction"
                                    name={t("tourniquetReaction")}
                                    stroke="#E11D48"
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
                                    dataKey="numOfAbdominalDistension"
                                    name={t("abdominalDistension")}
                                    fill="#2563EB"
                                />
                                <Bar
                                    dataKey="numOfAllergicRash"
                                    name={t("allergicRash")}
                                    fill="#EF4444"
                                />
                                <Bar
                                    dataKey="numOfChestDiscomfort"
                                    name={t("chestDiscomfort")}
                                    fill="#10B981"
                                />
                                <Bar
                                    dataKey="numOfDelirium"
                                    name={t("delirium")}
                                    fill="#F59E0B"
                                />
                                <Bar
                                    dataKey="numOfDizziness"
                                    name={t("dizziness")}
                                    fill="#8B5CF6"
                                />
                                <Bar
                                    dataKey="numOfEndotrachealIntubationDiscomfort"
                                    name={t("endotrachealIntubationDiscomfort")}
                                    fill="#EC4899"
                                />
                                <Bar
                                    dataKey="numOfEpigastricPain"
                                    name={t("epigastricPain")}
                                    fill="#14B8A6"
                                />
                                <Bar
                                    dataKey="numOfItching"
                                    name={t("itching")}
                                    fill="#F97316"
                                />
                                <Bar
                                    dataKey="numOfNauseaAndVomiting"
                                    name={t("nauseaAndVomiting")}
                                    fill="#3B82F6"
                                />
                                <Bar
                                    dataKey="numOfNauseaAndVomitingAndDizziness"
                                    name={t("nauseaAndVomitingAndDizziness")}
                                    fill="#84CC16"
                                />
                                <Bar
                                    dataKey="numOfOther"
                                    name={t("other")}
                                    fill="#D946EF"
                                />
                                <Bar
                                    dataKey="numOfProlongedAnestheticRecovery"
                                    name={t("prolongedAnestheticRecovery")}
                                    fill="#A855F7"
                                />
                                <Bar
                                    dataKey="numOfPunctureSiteAbnormality"
                                    name={t("punctureSiteAbnormality")}
                                    fill="#22C55E"
                                />
                                <Bar
                                    dataKey="numOfTourniquetReaction"
                                    name={t("tourniquetReaction")}
                                    fill="#E11D48"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
