import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ----------------- Types -----------------

type Row = {
    userId: number;
    date: string | null;

    // tableOne
    numOfAdverseReactionCases: number | null;
    numOfInadequateAnalgesia: number | null;
    numOfPostoperativeAnalgesiaCases: number | null;
    numOfPostoperativeVisits: number | null;

    // tableTwo
    numOfAbdominalDistension: number | null;
    numOfAllergicRash: number | null;
    numOfChestDiscomfort: number | null;
    numOfDelirium: number | null;
    numOfDizziness: number | null;
    numOfEndotrachealIntubationDiscomfort: number | null;
    numOfEpigastricPain: number | null;
    numOfItching: number | null;
    numOfNauseaAndVomiting: number | null;
    numOfNauseaAndVomitingAndDizziness: number | null;
    numOfOther: number | null;
    numOfProlongedAnestheticRecovery: number | null;
    numOfPunctureSiteAbnormality: number | null;
    numOfTourniquetReaction: number | null;
    otherComments: string | null;

    // tableThree
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

    // tableFour
    numOfFormulationOne: number | null;
    numOfFormulationTwo: number | null;
    numOfFormulationThree: number | null;
    numOfFormulationFour: number | null;
    numOfFormulationFive: number | null;
    numOfFormulationSix: number | null;

    // tableFive
    criticalPatientsName: string | null;
    visitFindingsForCriticalPatient: string | null;
    numberOfCriticalRescueCases: number | null;
    numberOfDeaths: number | null;
    numberOfFollowUpsForCriticallyIllPatients: number | null;
};

// ----------------- Helpers -----------------

function fmtDateYYYYMMDD(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function toYYYYMMDD(input: any) {
    if (!input) return "";
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

// --- i18n ---

type Lang = "en" | "zh";

const STRINGS: Record<Lang, Record<string, string>> = {
    en: {
        title: "Joined After-Surgery Summary (5 Tables)",
        startDate: "Start date",
        endDate: "End date",
        to: "to",
        apply: "Apply",
        searchPlaceholder: "Search (optional)",
        search: "Search",
        exportCsv: "Export CSV",
        exportXlsx: "Export Excel",
        showing: "Showing",
        of: "of",
        date: "Date",
        noEntries: "No entries found.",
        page: "Page",
        prev: "Prev",
        next: "Next",
        // tableOne labels
        adverseReactions: "Adverse Reactions",
        inadequateAnalgesia: "Inadequate Analgesia",
        postopAnalgesiaCases: "Postop Analgesia Cases",
        postopVisits: "Postop Visits",
        // tableTwo labels
        abdDistension: "Abdominal Distension",
        chestDiscomfort: "Chest Discomfort",
        nauseaVomiting: "Nausea & Vomiting",
        otherAdverse: "Other Adverse Reactions",
        otherComments: "Other Comments",
        // tableThree labels
        jointComplications: "Joint Complications",
        surgicalTreatments: "Surgical Treatments",
        // tableFour labels
        formulationOne: "Formulation I",
        formulationTwo: "Formulation II",
        formulationThree: "Formulation III",
        formulationFour: "Formulation IV",
        formulationFive: "Formulation V",
        formulationSix: "Formulation VI",
        // tableFive labels
        criticalName: "Critical Patient Name",
        findings: "Visit Findings",
        rescueCases: "Critical Rescue Cases",
        deaths: "Deaths",
        followUps: "Critical Follow-ups",
    },
    zh: {
        title: "术后汇总（五张表联合）",
        startDate: "开始日期",
        endDate: "结束日期",
        to: "至",
        apply: "应用",
        searchPlaceholder: "搜索（可选）",
        search: "搜索",
        exportCsv: "导出 CSV",
        exportXlsx: "导出 Excel",
        showing: "显示",
        of: "共",
        date: "日期",
        noEntries: "暂无数据。",
        page: "第",
        prev: "上一页",
        next: "下一页",
        adverseReactions: "不良反应例数",
        inadequateAnalgesia: "镇痛不足例数",
        postopAnalgesiaCases: "术后镇痛例数",
        postopVisits: "术后随访例数",
        abdDistension: "腹胀例数",
        chestDiscomfort: "胸闷例数",
        nauseaVomiting: "恶心呕吐例数",
        otherAdverse: "其他不适例数",
        otherComments: "其他备注",
        jointComplications: "关节并发症",
        surgicalTreatments: "手术处理例数",
        formulationOne: "配方一",
        formulationTwo: "配方二",
        formulationThree: "配方三",
        formulationFour: "配方四",
        formulationFive: "配方五",
        formulationSix: "配方六",
        criticalName: "危重病人姓名",
        findings: "随访/查房记录",
        rescueCases: "危重抢救例数",
        deaths: "死亡人数",
        followUps: "危重随访数",
    },
};

function useI18n() {
    const [lang, setLang] = useState<Lang>("en");
    const t = (key: string) => STRINGS[lang][key] ?? key;
    return { lang, setLang, t };
}

// ----------------- Component -----------------

export default function TableJoined() {
    const { lang, setLang, t } = useI18n();

    const [items, setItems] = useState<Row[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const [q, setQ] = useState("");
    const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");

    // default date range = last 30 days to today
    const today = fmtDateYYYYMMDD(new Date());
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const [from, setFrom] = useState(fmtDateYYYYMMDD(last30));
    const [to, setTo] = useState(today);

    // -------- Data fetching ----------
    async function load() {
        const params: any = { page, pageSize };
        if (from) params.from = from;
        if (to) params.to = to;

        const r = await api.get("/table-joined", { params });
        setItems(r.data.items || []);
        setTotal(r.data.total || 0);
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    function applyDates() {
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
        // client-side only
    }

    function rowTime(r: Row) {
        const d = r.date ? new Date(r.date) : null;
        const t = d ? d.getTime() : 0;
        return Number.isFinite(t) ? t : 0;
    }

    // client-side search + date sort
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
                    r.numOfAbdominalDistension,
                    r.numOfChestDiscomfort,
                    r.numOfNauseaAndVomiting,
                    r.numOfOther,
                    r.numOfJointComplicationCount,
                    r.numOfSurgicalTreatmentCount,
                    r.numOfFormulationOne,
                    r.numOfFormulationTwo,
                    r.numOfFormulationThree,
                    r.numOfFormulationFour,
                    r.numOfFormulationFive,
                    r.numOfFormulationSix,
                    r.numberOfCriticalRescueCases,
                    r.numberOfDeaths,
                    r.numberOfFollowUpsForCriticallyIllPatients,
                    r.criticalPatientsName ?? "",
                    r.visitFindingsForCriticalPatient ?? "",
                    r.otherComments ?? "",
                    r.date ? new Date(r.date).toLocaleDateString() : "",
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

    // -------- Export helpers ----------

    async function fetchAllRowsForRange() {
        const pageSizeAll = 500;
        let pageIdx = 1;
        let all: Row[] = [];
        while (true) {
            const r = await api.get("/table-joined", {
                params: { from, to, page: pageIdx, pageSize: pageSizeAll },
            });
            const batch: Row[] = r.data.items || [];
            all = all.concat(batch);
            const totalCount = r.data.total || batch.length;
            if (all.length >= totalCount || batch.length === 0) break;
            pageIdx += 1;
        }
        return all;
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
            "userId",
            "date",
            // tableOne
            "numOfAdverseReactionCases",
            "numOfInadequateAnalgesia",
            "numOfPostoperativeAnalgesiaCases",
            "numOfPostoperativeVisits",
            // tableTwo
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
            "otherComments",
            // tableThree
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
            // tableFour
            "numOfFormulationOne",
            "numOfFormulationTwo",
            "numOfFormulationThree",
            "numOfFormulationFour",
            "numOfFormulationFive",
            "numOfFormulationSix",
            // tableFive
            "criticalPatientsName",
            "visitFindingsForCriticalPatient",
            "numberOfCriticalRescueCases",
            "numberOfDeaths",
            "numberOfFollowUpsForCriticallyIllPatients",
        ];

        const escapeCell = (v: any) => {
            const s = `${v ?? ""}`.replaceAll(`"`, `""`);
            return s.includes(",") || s.includes("\n") || s.includes(`"`) ? `"${s}"` : s;
        };

        const lines = [header.join(",")];
        for (const r of rows) {
            lines.push(
                [
                    r.userId,
                    toYYYYMMDD(r.date),
                    r.numOfAdverseReactionCases ?? "",
                    r.numOfInadequateAnalgesia ?? "",
                    r.numOfPostoperativeAnalgesiaCases ?? "",
                    r.numOfPostoperativeVisits ?? "",
                    r.numOfAbdominalDistension ?? "",
                    r.numOfAllergicRash ?? "",
                    r.numOfChestDiscomfort ?? "",
                    r.numOfDelirium ?? "",
                    r.numOfDizziness ?? "",
                    r.numOfEndotrachealIntubationDiscomfort ?? "",
                    r.numOfEpigastricPain ?? "",
                    r.numOfItching ?? "",
                    r.numOfNauseaAndVomiting ?? "",
                    r.numOfNauseaAndVomitingAndDizziness ?? "",
                    r.numOfOther ?? "",
                    r.numOfProlongedAnestheticRecovery ?? "",
                    r.numOfPunctureSiteAbnormality ?? "",
                    r.numOfTourniquetReaction ?? "",
                    r.otherComments ?? "",
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
                    r.numOfFormulationOne ?? "",
                    r.numOfFormulationTwo ?? "",
                    r.numOfFormulationThree ?? "",
                    r.numOfFormulationFour ?? "",
                    r.numOfFormulationFive ?? "",
                    r.numOfFormulationSix ?? "",
                    r.criticalPatientsName ?? "",
                    r.visitFindingsForCriticalPatient ?? "",
                    r.numberOfCriticalRescueCases ?? "",
                    r.numberOfDeaths ?? "",
                    r.numberOfFollowUpsForCriticallyIllPatients ?? "",
                ]
                    .map(escapeCell)
                    .join(",")
            );
        }

        const blob = new Blob([lines.join("\n")], {
            type: "text/csv;charset=utf-8",
        });
        downloadBlob(blob, `table-joined_${from || "all"}_${to || "all"}.csv`);
    }

    async function exportXlsx() {
        const rows = await fetchAllRowsForRange();

        const data = rows.map((r) => ({
            UserId: r.userId,
            Date: toYYYYMMDD(r.date),
            AdverseReactions: r.numOfAdverseReactionCases ?? null,
            InadequateAnalgesia: r.numOfInadequateAnalgesia ?? null,
            PostopAnalgesiaCases: r.numOfPostoperativeAnalgesiaCases ?? null,
            PostopVisits: r.numOfPostoperativeVisits ?? null,
            AbdominalDistension: r.numOfAbdominalDistension ?? null,
            ChestDiscomfort: r.numOfChestDiscomfort ?? null,
            NauseaVomiting: r.numOfNauseaAndVomiting ?? null,
            OtherAdverse: r.numOfOther ?? null,
            JointComplications: r.numOfJointComplicationCount ?? null,
            SurgicalTreatments: r.numOfSurgicalTreatmentCount ?? null,
            FormulationOne: r.numOfFormulationOne ?? null,
            FormulationTwo: r.numOfFormulationTwo ?? null,
            FormulationThree: r.numOfFormulationThree ?? null,
            FormulationFour: r.numOfFormulationFour ?? null,
            FormulationFive: r.numOfFormulationFive ?? null,
            FormulationSix: r.numOfFormulationSix ?? null,
            CriticalPatientName: r.criticalPatientsName ?? null,
            VisitFindings: r.visitFindingsForCriticalPatient ?? null,
            CriticalRescueCases: r.numberOfCriticalRescueCases ?? null,
            Deaths: r.numberOfDeaths ?? null,
            CriticalFollowUps: r.numberOfFollowUpsForCriticallyIllPatients ?? null,
            OtherComments: r.otherComments ?? null,
        }));

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data, { cellDates: false });
        XLSX.utils.book_append_sheet(wb, ws, "TableJoined");

        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        downloadBlob(blob, `table-joined_${from || "all"}_${to || "all"}.xlsx`);
    }

    // ----------------- Render -----------------

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-xl font-semibold">{t("title")}</h1>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="outline"
                    onClick={() => setLang((l) => (l === "en" ? "zh" : "en"))}
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
                <Button
                    onClick={applyDates}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {t("apply")}
                </Button>

                <Input
                    placeholder={t("searchPlaceholder")}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-64"
                />
                <Button
                    onClick={runSearch}
                    variant="secondary"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {t("search")}
                </Button>

                <Button
                    onClick={exportCsv}
                    variant="secondary"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {t("exportCsv")}
                </Button>
                <Button
                    onClick={exportXlsx}
                    variant="secondary"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {t("exportXlsx")}
                </Button>

                <div className="ml-auto text-sm text-gray-600">
                    {t("showing")} {showingFrom}–{showingTo} {t("of")} {total}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
                <table className="w-full text-sm min-w-[1200px]">
                    <thead>
                    <tr className="text-left border-b bg-gray-50">
                        <th
                            className="py-2 px-3 cursor-pointer select-none whitespace-nowrap"
                            onClick={() =>
                                setDateSort((s) => (s === "asc" ? "desc" : "asc"))
                            }
                            aria-sort={
                                dateSort === "asc" ? "ascending" : "descending"
                            }
                        >
                            {t("date")} {dateSort === "asc" ? "▲" : "▼"}
                        </th>
                        {/* tableOne */}
                        <th className="px-3 whitespace-nowrap">
                            {t("adverseReactions")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("inadequateAnalgesia")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("postopAnalgesiaCases")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("postopVisits")}
                        </th>
                        {/* tableTwo key metrics + comment */}
                        <th className="px-3 whitespace-nowrap">
                            {t("abdDistension")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("chestDiscomfort")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("nauseaVomiting")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("otherAdverse")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("otherComments")}
                        </th>
                        {/* tableThree */}
                        <th className="px-3 whitespace-nowrap">
                            {t("jointComplications")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("surgicalTreatments")}
                        </th>
                        {/* tableFour (summarised, but still individual columns) */}
                        <th className="px-3 whitespace-nowrap">
                            {t("formulationOne")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("formulationTwo")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("formulationThree")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("formulationFour")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("formulationFive")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("formulationSix")}
                        </th>
                        {/* tableFive */}
                        <th className="px-3 whitespace-nowrap">
                            {t("criticalName")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("findings")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("rescueCases")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("deaths")}
                        </th>
                        <th className="px-3 whitespace-nowrap">
                            {t("followUps")}
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map((r, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3 whitespace-nowrap">
                                {r.date
                                    ? new Date(r.date).toLocaleDateString()
                                    : "-"}
                            </td>

                            {/* tableOne */}
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfAdverseReactionCases ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfInadequateAnalgesia ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfPostoperativeAnalgesiaCases ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfPostoperativeVisits ?? "-"}
                            </td>

                            {/* tableTwo */}
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfAbdominalDistension ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfChestDiscomfort ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfNauseaAndVomiting ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfOther ?? "-"}
                            </td>
                            <td className="px-3 max-w-xs truncate">
                                {r.otherComments ?? "-"}
                            </td>

                            {/* tableThree */}
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfJointComplicationCount ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfSurgicalTreatmentCount ?? "-"}
                            </td>

                            {/* tableFour */}
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfFormulationOne ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfFormulationTwo ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfFormulationThree ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfFormulationFour ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfFormulationFive ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numOfFormulationSix ?? "-"}
                            </td>

                            {/* tableFive */}
                            <td className="px-3 whitespace-nowrap">
                                {r.criticalPatientsName ?? "-"}
                            </td>
                            <td className="px-3 max-w-xs truncate">
                                {r.visitFindingsForCriticalPatient ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numberOfCriticalRescueCases ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numberOfDeaths ?? "-"}
                            </td>
                            <td className="px-3 whitespace-nowrap">
                                {r.numberOfFollowUpsForCriticallyIllPatients ??
                                    "-"}
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr>
                            <td
                                colSpan={24}
                                className="py-10 text-center text-gray-500"
                            >
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
                        onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page >= totalPages}
                    >
                        {t("next")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
