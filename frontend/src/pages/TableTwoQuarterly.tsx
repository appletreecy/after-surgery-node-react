// src/pages/TableTwoQuarterly.tsx
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

// ---------- i18n ----------
type Lang = "en" | "zh";

const STRINGS: Record<Lang, Record<string, string>> = {
    en: {
        title: "Table Two – Quarterly Summary",
        year: "Year",
        apply: "Apply",
        exportCsv: "Export CSV",
        exportXlsx: "Export Excel",
        quarter: "Quarter",
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
        noEntries: "No quarterly data.",
        loading: "Loading…",
        error: "Failed to load quarterly data.",
        rows: "rows",
        lineChartTitle: "Quarterly Trend (Line Chart)",
        barChartTitle: "Quarterly Totals (Bar Chart)",
    },
    zh: {
        title: "表二 – 季度汇总",
        year: "年份",
        apply: "应用",
        exportCsv: "导出 CSV",
        exportXlsx: "导出 Excel",
        quarter: "季度",
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
function TableTwoLegend({ t }: { t: (key: string) => string }) {
    return (
        <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#2563EB" }}
        />
                <span>{t("abdominalDistension")}</span>
            </div>
            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#10B981" }}
        />
                <span>{t("allergicRash")}</span>
            </div>
            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#F59E0B" }}
        />
                <span>{t("chestDiscomfort")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#EF4444" }}
        />
                <span>{t("delirium")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#10B981" }}
        />
                <span>{t("dizziness")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#F59E0B" }}
        />
                <span>{t("endotrachealIntubationDiscomfort")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#8B5CF6" }}
        />
                <span>{t("epigastricPain")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#EC4899" }}
        />
                <span>{t("itching")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#14B8A6" }}
        />
                <span>{t("nauseaAndVomiting")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#F97316" }}
        />
                <span>{t("nauseaAndVomitingAndDizziness")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#3B82F6" }}
        />
                <span>{t("other")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#84CC16" }}
        />
                <span>{t("prolongedAnestheticRecovery")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#D946EF" }}
        />
                <span>{t("punctureSiteAbnormality")}</span>
            </div>

            <div className="flex items-center gap-1">
        <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#A855F7" }}
        />
                <span>{t("tourniquetReaction")}</span>
            </div>
        </div>
    );
}

export default function TableTwoQuarterly() {
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
                acc.numOfAbdominalDistension += r.numOfAbdominalDistension;
                acc.numOfAllergicRash += r.numOfAllergicRash;
                acc.numOfChestDiscomfort += r.numOfChestDiscomfort;
                acc.numOfDelirium +=
                    r.numOfDelirium;
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

    async function loadData(targetYear: number) {
        try {
            setLoading(true);
            setError(null);

            const res = await api.post<QuarterlyRow[]>("/rpc/tableTwoQuarterly", {
                year: targetYear,
            });

            const raw = res.data ?? [];

            // ✅ Normalize everything to numbers so sums don't concatenate
            const normalized: QuarterlyRow[] = raw.map((r) => ({
                quarter: r.quarter,
                numOfAbdominalDistension:
                    Number((r as any).numOfAbdominalDistension) || 0,
                numOfAllergicRash: Number((r as any).numOfAllergicRash) || 0,
                numOfChestDiscomfort: Number((r as any).numOfChestDiscomfort) || 0,
                numOfDelirium:
                    Number((r as any).numOfDelirium) || 0,
                numOfDizziness: Number((r as any).numOfDizziness) || 0,
                numOfEndotrachealIntubationDiscomfort: Number((r as any).numOfEndotrachealIntubationDiscomfort) || 0,
                numOfEpigastricPain: Number((r as any).numOfEpigastricPain) || 0,
                numOfItching: Number((r as any).numOfItching) || 0,
                numOfNauseaAndVomiting: Number((r as any).numOfNauseaAndVomiting) || 0,
                numOfNauseaAndVomitingAndDizziness: Number((r as any).numOfNauseaAndVomitingAndDizziness) || 0,
                numOfOther: Number((r as any).numOfOther) || 0,
                numOfProlongedAnestheticRecovery: Number((r as any).numOfProlongedAnestheticRecovery) || 0,
                numOfPunctureSiteAbnormality: Number((r as any).numOfPunctureSiteAbnormality) || 0,
                numOfTourniquetReaction: Number((r as any).numOfTourniquetReaction) || 0,
            }));

            setRows(normalized);
        } catch (err: any) {
            console.error("[TableTwoQuarterly] load error:", err);
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
                    r.quarter,
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
        a.download = `table-two-quarterly-${year}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async function exportXlsx() {
        if (!rows.length) return;

        const dataForSheet = rows.map((r) => ({
            Quarter: r.quarter,
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
        XLSX.utils.book_append_sheet(wb, ws, "TableTwoQuarterly");

        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `table-two-quarterly-${year}.xlsx`;
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
            <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
                <table className="min-w-[640px] w-full text-sm">
                    <thead>
                    <tr className="text-left border-b bg-gray-50">
                        <th className="py-2 px-3">{t("quarter")}</th>
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
                        <tr key={r.quarter} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">{`${year} ${r.quarter}`}</td>
                            <td className="px-3 text-center">{r.numOfAbdominalDistension}</td>
                            <td className="px-3 text-center">{r.numOfAllergicRash}</td>
                            <td className="px-3 text-center">{r.numOfChestDiscomfort}</td>
                            <td className="px-3 text-center">
                                {r.numOfDelirium}
                            </td>
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
                            <td className="px-3 text-center">
                                {totals.numOfAbdominalDistension}
                            </td>
                            <td className="px-3 text-center">{totals.numOfAllergicRash}</td>
                            <td className="px-3 text-center">{totals.numOfChestDiscomfort}</td>
                            <td className="px-3 text-center">
                                {totals.numOfDelirium}
                            </td>
                            <td className="px-3 text-center">{totals.numOfDizziness}</td>
                            <td className="px-3 text-center">{totals.numOfEndotrachealIntubationDiscomfort}</td>
                            <td className="px-3 text-center">{totals.numOfEpigastricPain}</td>
                            <td className="px-3 text-center">{totals.numOfItching}</td>
                            <td className="px-3 text-center">{totals.numOfNauseaAndVomiting}</td>
                            <td className="px-3 text-center">{totals.numOfNauseaAndVomitingAndDizziness}</td>
                            <td className="px-3 text-center">{totals.numOfOther}</td>
                            <td className="px-3 text-center">{totals.numOfProlongedAnestheticRecovery}</td>
                            <td className="px-3 text-center">{totals.numOfPunctureSiteAbnormality}</td>
                            <td className="px-3 text-center">{totals.numOfTourniquetReaction}</td>
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

                    <TableTwoLegend t={t} />

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
                                    dataKey="numOfAbdominalDistension"
                                    name={t("abdominalDistension")}
                                    stroke="#2563EB"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfAllergicRash"
                                    name={t("allergicRash")}
                                    stroke="#10B981"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfChestDiscomfort"
                                    name={t("chestDiscomfort")}
                                    stroke="#F59E0B"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfDelirium"
                                    name={t("delirium")}
                                    stroke="#EF4444"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfDizziness"
                                    name={t("dizziness")}
                                    stroke="#10B981"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfEndotrachealIntubationDiscomfort"
                                    name={t("endotrachealIntubationDiscomfort")}
                                    stroke="#F59E0B"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfEpigastricPain"
                                    name={t("epigastricPain")}
                                    stroke="#8B5CF6"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfItching"
                                    name={t("itching")}
                                    stroke="#EC4899"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfNauseaAndVomiting"
                                    name={t("nauseaAndVomiting")}
                                    stroke="#14B8A6"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfNauseaAndVomitingAndDizziness"
                                    name={t("nauseaAndVomitingAndDizziness")}
                                    stroke="#F97316"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfOther"
                                    name={t("other")}
                                    stroke="#3B82F6"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfProlongedAnestheticRecovery"
                                    name={t("prolongedAnestheticRecovery")}
                                    stroke="#84CC16"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfPunctureSiteAbnormality"
                                    name={t("punctureSiteAbnormality")}
                                    stroke="#D946EF"
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="numOfTourniquetReaction"
                                    name={t("tourniquetReaction")}
                                    stroke="#A855F7"
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

                    <TableTwoLegend t={t} />

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rows}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="quarter" />
                                <YAxis />
                                <Tooltip />
                                {/* No Recharts Legend */}

                                <Bar
                                    dataKey="numOfAbdominalDistension"
                                    name={t("abdominalDistension")}
                                    fill="#2563EB"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfAllergicRash"
                                    name={t("allergicRash")}
                                    fill="#10B981"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfChestDiscomfort"
                                    name={t("chestDiscomfort")}
                                    fill="#F59E0B"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfDelirium"
                                    name={t("delirium")}
                                    fill="#EF4444"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfDizziness"
                                    name={t("dizziness")}
                                    fill="#10B981"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfEndotrachealIntubationDiscomfort"
                                    name={t("endotrachealIntubationDiscomfort")}
                                    fill="#F59E0B"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfEpigastricPain"
                                    name={t("epigastricPain")}
                                    fill="#8B5CF6"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfItching"
                                    name={t("itching")}
                                    fill="#EC4899"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfNauseaAndVomiting"
                                    name={t("nauseaAndVomiting")}
                                    fill="#14B8A6"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfNauseaAndVomitingAndDizziness"
                                    name={t("nauseaAndVomitingAndDizziness")}
                                    fill="#F97316"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfOther"
                                    name={t("other")}
                                    fill="#3B82F6"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfProlongedAnestheticRecovery"
                                    name={t("prolongedAnestheticRecovery")}
                                    fill="#84CC16"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfPunctureSiteAbnormality"
                                    name={t("punctureSiteAbnormality")}
                                    fill="#D946EF"
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="numOfTourniquetReaction"
                                    name={t("tourniquetReaction")}
                                    fill="#A855F7"
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
