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
    createdAt: string;
};

type Sums = {
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

type CreatePayload = {
    date?: string | null;
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

export default function TableThree() {
    const [items, setItems] = useState<Row[]>([]);
    const [total, setTotal] = useState(0);
    const [sums, setSums] = useState<Sums>({
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
    });

    const [page, setPage] = useState(1);
    const pageSize = 20;

    const [q, setQ] = useState("");

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
        numOfJointComplicationCount: "",
        numOfMotorDysfunctionCount: "",
        numOfTraumaComplicationCount: "",
        numOfAnkleComplicationCount: "",
        numOfPediatricAdverseEventCount: "",
        numOfSpinalComplicationCount: "",
        numOfHandSurgeryComplicationCount: "",
        numOfObstetricAdverseEventCount: "",
        numOfGynecologicalAdverseEventCount: "",
        numOfSurgicalTreatmentCount: "",
    });

    // -------- Data fetching ----------
    async function load() {
        const params: any = { page, pageSize };
        if (from) params.from = from;
        if (to) params.to = to;

        const r = await api.get("/table-three", { params });
        setItems(r.data.items || []);
        setTotal(r.data.total || 0);
        if (r.data.sums) setSums(r.data.sums);
    }

    // initial load with default window, and whenever page changes
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    // client-side quick filter for q (totals remain server-side)
    const filtered = useMemo(() => {
        if (!q) return items;
        const t = q.toLowerCase();
        return items.filter((r) => {
            const fields = [
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
                r.date ? new Date(r.date).toLocaleDateString() : "",
                new Date(r.createdAt).toLocaleDateString(),
            ].map((v) => (v === null || v === undefined ? "" : String(v).toLowerCase()));
            return fields.some((f) => f.includes(t));
        });
    }, [q, items]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const showingFrom = total ? (page - 1) * pageSize + 1 : 0;
    const showingTo = Math.min(total, page * pageSize);

    function toIntOrNull(v: string) {
        if (v === "" || v == null) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }

    async function create() {
        const payload: CreatePayload = {
            date: form.date || null,
            numOfJointComplicationCount: toIntOrNull(form.numOfJointComplicationCount),
            numOfMotorDysfunctionCount: toIntOrNull(form.numOfMotorDysfunctionCount),
            numOfTraumaComplicationCount: toIntOrNull(form.numOfTraumaComplicationCount),
            numOfAnkleComplicationCount: toIntOrNull(form.numOfAnkleComplicationCount),
            numOfPediatricAdverseEventCount: toIntOrNull(form.numOfPediatricAdverseEventCount),
            numOfSpinalComplicationCount: toIntOrNull(form.numOfSpinalComplicationCount),
            numOfHandSurgeryComplicationCount: toIntOrNull(form.numOfHandSurgeryComplicationCount),
            numOfObstetricAdverseEventCount: toIntOrNull(form.numOfObstetricAdverseEventCount),
            numOfGynecologicalAdverseEventCount: toIntOrNull(form.numOfGynecologicalAdverseEventCount),
            numOfSurgicalTreatmentCount: toIntOrNull(form.numOfSurgicalTreatmentCount),
        };
        await api.post("/table-three", payload);
        setOpen(false);
        setForm({
            date: "",
            numOfJointComplicationCount: "",
            numOfMotorDysfunctionCount: "",
            numOfTraumaComplicationCount: "",
            numOfAnkleComplicationCount: "",
            numOfPediatricAdverseEventCount: "",
            numOfSpinalComplicationCount: "",
            numOfHandSurgeryComplicationCount: "",
            numOfObstetricAdverseEventCount: "",
            numOfGynecologicalAdverseEventCount: "",
            numOfSurgicalTreatmentCount: "",
        });
        setPage(1);
        await load();
    }

    async function remove(id: number) {
        await api.delete(`/table-three/${id}`);
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

    // -------- Percentages & pies ----------
    const tableThreeSumNumber = sums.numOfJointComplicationCount + sums.numOfMotorDysfunctionCount + sums.numOfTraumaComplicationCount +
        sums.numOfAnkleComplicationCount + sums.numOfPediatricAdverseEventCount + sums.numOfSpinalComplicationCount + sums.numOfHandSurgeryComplicationCount +
        sums.numOfObstetricAdverseEventCount + sums.numOfGynecologicalAdverseEventCount + sums.numOfSurgicalTreatmentCount || 0;


    const totalNumOfJointComplicationCount = sums.numOfJointComplicationCount || 0;
    const totalNumOfJointComplicationCountPct = pct(totalNumOfJointComplicationCount, tableThreeSumNumber);
    const totalNumOfJointComplicationCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfJointComplicationCount);

    const totalNumOfMotorDysfunctionCount = sums.numOfMotorDysfunctionCount || 0;
    const totalNumOfMotorDysfunctionCountPct = pct(totalNumOfMotorDysfunctionCount, tableThreeSumNumber);
    const totalNumOfMotorDysfunctionCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfMotorDysfunctionCount);

    const totalNumOfTraumaComplicationCount = sums.numOfTraumaComplicationCount || 0;
    const totalNumOfTraumaComplicationCountPct = pct(totalNumOfTraumaComplicationCount, tableThreeSumNumber);
    const totalNumOfTraumaComplicationCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfTraumaComplicationCount);

    const totalNumOfAnkleComplicationCount = sums.numOfAnkleComplicationCount || 0;
    const totalNumOfAnkleComplicationCountPct = pct(totalNumOfAnkleComplicationCount, tableThreeSumNumber);
    const totalNumOfAnkleComplicationCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfAnkleComplicationCount);

    const totalNumOfPediatricAdverseEventCount = sums.numOfPediatricAdverseEventCount || 0;
    const totalNumOfPediatricAdverseEventCountPct = pct(totalNumOfPediatricAdverseEventCount, tableThreeSumNumber);
    const totalNumOfPediatricAdverseEventCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfPediatricAdverseEventCount);

    const totalNumOfSpinalComplicationCount = sums.numOfSpinalComplicationCount || 0;
    const totalNumOfSpinalComplicationCountPct = pct(totalNumOfSpinalComplicationCount, tableThreeSumNumber);
    const totalNumOfSpinalComplicationCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfSpinalComplicationCount);

    const totalNumOfHandSurgeryComplicationCount = sums.numOfHandSurgeryComplicationCount || 0;
    const totalNumOfHandSurgeryComplicationCountPct = pct(totalNumOfHandSurgeryComplicationCount, tableThreeSumNumber);
    const totalNumOfHandSurgeryComplicationCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfHandSurgeryComplicationCount);

    const totalNumOfObstetricAdverseEventCount = sums.numOfObstetricAdverseEventCount || 0;
    const totalNumOfObstetricAdverseEventCountPct = pct(totalNumOfObstetricAdverseEventCount, tableThreeSumNumber);
    const totalNumOfObstetricAdverseEventCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfObstetricAdverseEventCount);

    const totalNumOfGynecologicalAdverseEventCount = sums.numOfGynecologicalAdverseEventCount || 0;
    const totalNumOfGynecologicalAdverseEventCountPct = pct(totalNumOfGynecologicalAdverseEventCount, tableThreeSumNumber);
    const totalNumOfGynecologicalAdverseEventCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfGynecologicalAdverseEventCount);

    const totalNumOfSurgicalTreatmentCount = sums.numOfSurgicalTreatmentCount || 0;
    const totalNumOfSurgicalTreatmentCountPct = pct(totalNumOfSurgicalTreatmentCount, tableThreeSumNumber);
    const totalNumOfSurgicalTreatmentCountPctOther = Math.max(0, tableThreeSumNumber - totalNumOfSurgicalTreatmentCount);


    const jointComplicationCountPie = [
        { name: "Joint Complication Count", value: totalNumOfJointComplicationCount },
        { name: "Other Visits", value: totalNumOfJointComplicationCountPctOther },
    ];
    const motorDysfunctionCountPie = [
        { name: "Motor Dysfunction Count", value: totalNumOfMotorDysfunctionCount },
        { name: "Other Visits", value: totalNumOfMotorDysfunctionCountPctOther },
    ];

    const traumaComplicationCountPie = [
        { name: "Trauma Complication Count", value: totalNumOfTraumaComplicationCount },
        { name: "Other Visits", value: totalNumOfTraumaComplicationCountPctOther },
    ];

    const ankleComplicationCountPie = [
        { name: "Ankle Complication Count", value: totalNumOfAnkleComplicationCount },
        { name: "Other Visits", value: totalNumOfAnkleComplicationCountPctOther },
    ];

    const pediatricAdverseEventCountPie = [
        { name: "Pediatric Adverse Event Count", value: totalNumOfPediatricAdverseEventCount },
        { name: "Other Visits", value: totalNumOfPediatricAdverseEventCountPctOther },
    ];

    const spinalComplicationCountPie = [
        { name: "Spinal Complication Count", value: totalNumOfSpinalComplicationCount },
        { name: "Other Visits", value: totalNumOfSpinalComplicationCountPctOther },
    ];

    const handSurgeryComplicationCountPie = [
        { name: "Hand Surgery Complication Count", value: totalNumOfHandSurgeryComplicationCount },
        { name: "Other Visits", value: totalNumOfHandSurgeryComplicationCountPctOther },
    ];

    const obstetricAdverseEventCountPie = [
        { name: "Obstetric Adverse Event Count", value: totalNumOfObstetricAdverseEventCount },
        { name: "Other Visits", value: totalNumOfObstetricAdverseEventCountPctOther },
    ];

    const gynecologicalAdverseEventCountPie = [
        { name: "Gynecological Adverse Event Count", value: totalNumOfGynecologicalAdverseEventCount },
        { name: "Other Visits", value: totalNumOfGynecologicalAdverseEventCountPctOther },
    ];

    const surgicalTreatmentCountPie = [
        { name: "Surgical Treatment Count", value: totalNumOfSurgicalTreatmentCount },
        { name: "Other Visits", value: totalNumOfSurgicalTreatmentCountPctOther },
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
            const r = await api.get("/table-three", {
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
                    r.createdAt ? new Date(r.createdAt).toISOString() : "",
                ]
                    .map(escapeCell)
                    .join(",")
            );
        }

        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        downloadBlob(blob, `table-three_${from || "all"}_${to || "all"}.csv`);
    }

    async function exportXlsx() {
        const rows = await fetchAllRowsForRange();

        const data = rows.map((r) => ({
            ID: r.id,
            Date: toYYYYMMDD(r.date),
            numOfJointComplicationCount: r.numOfJointComplicationCount ?? null,
            numOfMotorDysfunctionCount: r.numOfMotorDysfunctionCount ?? null,
            numOfTraumaComplicationCount: r.numOfTraumaComplicationCount ?? null,
            numOfAnkleComplicationCount: r.numOfAnkleComplicationCount ?? null,
            numOfPediatricAdverseEventCount: r.numOfPediatricAdverseEventCount ?? null,
            numOfSpinalComplicationCount: r.numOfSpinalComplicationCount ?? null,
            numOfHandSurgeryComplicationCount: r.numOfHandSurgeryComplicationCount ?? null,
            numOfObstetricAdverseEventCount: r.numOfObstetricAdverseEventCount ?? null,
            numOfGynecologicalAdverseEventCount: r.numOfGynecologicalAdverseEventCount ?? null,
            numOfSurgicalTreatmentCount: r.numOfSurgicalTreatmentCount ?? null,
            "Created At": r.createdAt ? new Date(r.createdAt).toISOString() : "",
        }));

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data, { cellDates: false });
        // CHANGED: sheet name to TableThree
        XLSX.utils.book_append_sheet(wb, ws, "TableThree");

        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        downloadBlob(blob, `table-three_${from || "all"}_${to || "all"}.xlsx`);
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-44"
                    aria-label="Start date"
                />
                <span className="text-gray-500">to</span>
                <Input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-44"
                    aria-label="End date"
                />
                <Button onClick={applyDates} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Apply
                </Button>

                <Input
                    placeholder="Search (optional)"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-64"
                />
                <Button onClick={runSearch} variant="secondary" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Search
                </Button>

                <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Add Record
                </Button>

                <Button onClick={exportCsv} variant="secondary" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Export CSV
                </Button>
                <Button onClick={exportXlsx} variant="secondary" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Export Excel
                </Button>

                <div className="ml-auto text-sm text-gray-600">
                    Showing {showingFrom}–{showingTo} of {total}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="text-left border-b bg-gray-50">
                        <th className="py-2 px-3">Date</th>
                        <th className="px-3">Joint Complication</th>
                        <th className="px-3">Motor Dysfunction</th>
                        <th className="px-3">Trauma Complication</th>
                        <th className="px-3">Ankle Complication</th>
                        <th className="px-3">Pediatric Adverse Event</th>
                        <th className="px-3">Spinal Complication</th>
                        <th className="px-3">HandSurgery Complication</th>
                        <th className="px-3">Obstetric Adverse Event</th>
                        <th className="px-3">Gynecological Adverse Event</th>
                        <th className="px-3">Surgical Treatment</th>
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
                            <td className="px-3">{r.numOfJointComplicationCount ?? "-"}</td>
                            <td className="px-3">{r.numOfMotorDysfunctionCount ?? "-"}</td>
                            <td className="px-3">{r.numOfTraumaComplicationCount ?? "-"}</td>
                            <td className="px-3">{r.numOfAnkleComplicationCount ?? "-"}</td>
                            <td className="px-3">{r.numOfPediatricAdverseEventCount ?? "-"}</td>
                            <td className="px-3">{r.numOfSpinalComplicationCount ?? "-"}</td>
                            <td className="px-3">{r.numOfHandSurgeryComplicationCount ?? "-"}</td>
                            <td className="px-3">{r.numOfObstetricAdverseEventCount ?? "-"}</td>
                            <td className="px-3">{r.numOfGynecologicalAdverseEventCount ?? "-"}</td>
                            <td className="px-3">{r.numOfSurgicalTreatmentCount ?? "-"}</td>
                            <td className="px-3">
                                <Button onClick={() => remove(r.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                    Delete
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr>
                            {/* CHANGED: colspan to match 12 columns */}
                            <td colSpan={12} className="py-10 text-center text-gray-500">
                                No entries found.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (right after table) */}
            <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-gray-600">
                    Page {page} / {totalPages}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                    >
                        Prev
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Joint Complication Count (Σ)</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfJointComplicationCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Motor Dysfunction Count (Σ)</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfMotorDysfunctionCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Trauma Complication Count (Σ)</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfTraumaComplicationCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Ankle Complication Count (Σ)</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfAnkleComplicationCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Pediatric Adverse Event Count (Σ)</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfPediatricAdverseEventCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Spinal Complication Count (Σ)</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfSpinalComplicationCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">HandSurgery Complication Count (Σ)</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfHandSurgeryComplicationCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Obstetric Adverse Event Count (Σ)</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfObstetricAdverseEventCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Gynecological Adverse Event Count (Σ)</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfGynecologicalAdverseEventCount}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Surgical Treatment Count (Σ)</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfSurgicalTreatmentCount}
                    </div>
                </div>
            </div>

            {/* Percentage text */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Total Joint Complication Count / tableThreeSumNumber</div>
                    <div className="text-2xl font-semibold">{totalNumOfJointComplicationCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfJointComplicationCount} / {tableThreeSumNumber} visits
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Total Motor Dysfunction Count / tableThreeSumNumber</div>
                    <div className="text-2xl font-semibold">{totalNumOfMotorDysfunctionCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfMotorDysfunctionCount} / {tableThreeSumNumber} visits
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Total Trauma Complication Count / tableThreeSumNumber</div>
                    <div className="text-2xl font-semibold">{totalNumOfTraumaComplicationCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfTraumaComplicationCount} / {tableThreeSumNumber} visits
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Total Ankle Complication Count / tableThreeSumNumber</div>
                    <div className="text-2xl font-semibold">{totalNumOfAnkleComplicationCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfAnkleComplicationCount} / {tableThreeSumNumber} visits
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Total Pediatric Adverse Event Count / tableThreeSumNumber</div>
                    <div className="text-2xl font-semibold">{totalNumOfPediatricAdverseEventCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfPediatricAdverseEventCount} / {tableThreeSumNumber} visits
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Total Spinal Complication Count / tableThreeSumNumber</div>
                    <div className="text-2xl font-semibold">{totalNumOfSpinalComplicationCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfSpinalComplicationCount} / {tableThreeSumNumber} visits
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Total Hand Surgery Complication Count / tableThreeSumNumber</div>
                    <div className="text-2xl font-semibold">{totalNumOfHandSurgeryComplicationCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfHandSurgeryComplicationCount} / {tableThreeSumNumber} visits
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Total Obstetric Adverse Event Count / tableThreeSumNumber</div>
                    <div className="text-2xl font-semibold">{totalNumOfObstetricAdverseEventCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfObstetricAdverseEventCount} / {tableThreeSumNumber} visits
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Total Gynecological Adverse Event Count / tableThreeSumNumber</div>
                    <div className="text-2xl font-semibold">{totalNumOfGynecologicalAdverseEventCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfGynecologicalAdverseEventCount} / {tableThreeSumNumber} visits
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Total Surgical Treatment Count / tableThreeSumNumber</div>
                    <div className="text-2xl font-semibold">{totalNumOfSurgicalTreatmentCountPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalNumOfSurgicalTreatmentCount} / {tableThreeSumNumber} visits
                    </div>
                </div>

            </div>

            {/* JointComplicationCount Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Adverse vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    {/* CHANGED: heading to match Joint Complication */}
                    <div className="text-sm font-medium mb-3">Joint Complication Count vs Other Visits</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={jointComplicationCountPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {jointComplicationCountPie.map((_, i) => (
                                        <Cell key={`adv-${i}`} fill={COLORS_A[i % COLORS_A.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfJointComplicationCount} of {tableThreeSumNumber} visits ({totalNumOfJointComplicationCountPct})
                    </div>
                </div>

                {/* MotorDysfunctionCount Pie */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    {/* CHANGED: heading to match Motor Dysfunction */}
                    <div className="text-sm font-medium mb-3">Motor Dysfunction Count vs Other Visits</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={motorDysfunctionCountPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {motorDysfunctionCountPie.map((_, i) => (
                                        <Cell key={`inad-${i}`} fill={COLORS_B[i % COLORS_B.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfMotorDysfunctionCount} of {tableThreeSumNumber} visits ({totalNumOfMotorDysfunctionCountPct})
                    </div>
                </div>

                {/* TraumaComplicationCount Pie */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    {/* CHANGED: heading to match Trauma Complication */}
                    <div className="text-sm font-medium mb-3">Trauma Complication Count vs Other Visits</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={traumaComplicationCountPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {traumaComplicationCountPie.map((_, i) => (
                                        <Cell key={`post-${i}`} fill={COLORS_C[i % COLORS_C.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {totalNumOfTraumaComplicationCount} of {tableThreeSumNumber} visits ({totalNumOfTraumaComplicationCountPct})
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* AnkleComplicationCount Pie*/}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                {/* CHANGED: heading to match Ankle Complication */}
                <div className="text-sm font-medium mb-3">Ankle Complication Count vs Other Visits</div>
                <div className="w-full h-64">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={ankleComplicationCountPie}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={95}
                                innerRadius={45}
                                paddingAngle={1}
                            >
                                {ankleComplicationCountPie.map((_, i) => (
                                    <Cell key={`post-${i}`} fill={COLORS_C[i % COLORS_C.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => [v, "Count"]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    {totalNumOfAnkleComplicationCount} of {tableThreeSumNumber} visits ({totalNumOfAnkleComplicationCountPct})
                </div>
            </div>

            {/* Postop Analgesia vs Other */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                {/* CHANGED: heading to match Pediatric Adverse Event */}
                <div className="text-sm font-medium mb-3">Pediatric Adverse Event Count vs Other Visits</div>
                <div className="w-full h-64">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={pediatricAdverseEventCountPie}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={95}
                                innerRadius={45}
                                paddingAngle={1}
                            >
                                {pediatricAdverseEventCountPie.map((_, i) => (
                                    <Cell key={`post-${i}`} fill={COLORS_C[i % COLORS_C.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => [v, "Count"]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    {totalNumOfPediatricAdverseEventCount} of {tableThreeSumNumber} visits ({totalNumOfPediatricAdverseEventCountPct})
                </div>
            </div>

            {/* SpinalComplicationCount Pie*/}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                {/* CHANGED: heading to match Spinal Complication */}
                <div className="text-sm font-medium mb-3">Spinal Complication Count vs Other Visits</div>
                <div className="w-full h-64">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={spinalComplicationCountPie}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={95}
                                innerRadius={45}
                                paddingAngle={1}
                            >
                                {spinalComplicationCountPie.map((_, i) => (
                                    <Cell key={`post-${i}`} fill={COLORS_C[i % COLORS_C.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => [v, "Count"]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    {totalNumOfSpinalComplicationCount} of {tableThreeSumNumber} visits ({totalNumOfSpinalComplicationCountPct})
                </div>
            </div>

            {/* HandSurgeryComplicationCount Pie*/}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                {/* CHANGED: heading to match Hand Surgery Complication */}
                <div className="text-sm font-medium mb-3">Hand Surgery Complication Count vs Other Visits</div>
                <div className="w-full h-64">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={handSurgeryComplicationCountPie}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={95}
                                innerRadius={45}
                                paddingAngle={1}
                            >
                                {handSurgeryComplicationCountPie.map((_, i) => (
                                    <Cell key={`post-${i}`} fill={COLORS_C[i % COLORS_C.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => [v, "Count"]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    {totalNumOfHandSurgeryComplicationCount} of {tableThreeSumNumber} visits ({totalNumOfHandSurgeryComplicationCountPct})
                </div>
            </div>

            {/* ObstetricAdverseEventCount Pie */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                {/* CHANGED: heading to match Obstetric Adverse Event */}
                <div className="text-sm font-medium mb-3">Obstetric Adverse Event Count vs Other Visits</div>
                <div className="w-full h-64">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={obstetricAdverseEventCountPie}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={95}
                                innerRadius={45}
                                paddingAngle={1}
                            >
                                {obstetricAdverseEventCountPie.map((_, i) => (
                                    <Cell key={`post-${i}`} fill={COLORS_C[i % COLORS_C.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => [v, "Count"]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    {totalNumOfObstetricAdverseEventCount} of {tableThreeSumNumber} visits ({totalNumOfObstetricAdverseEventCountPct})
                </div>
            </div>

            {/* GynecologicalAdverseEventCount Pie */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                {/* CHANGED: heading to match Gynecological Adverse Event */}
                <div className="text-sm font-medium mb-3">Gynecological Adverse Event Count vs Other Visits</div>
                <div className="w-full h-64">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={gynecologicalAdverseEventCountPie}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={95}
                                innerRadius={45}
                                paddingAngle={1}
                            >
                                {gynecologicalAdverseEventCountPie.map((_, i) => (
                                    <Cell key={`post-${i}`} fill={COLORS_C[i % COLORS_C.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => [v, "Count"]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    {totalNumOfGynecologicalAdverseEventCount} of {tableThreeSumNumber} visits ({totalNumOfGynecologicalAdverseEventCountPct})
                </div>
            </div>

            {/* totalNumOfSurgicalTreatmentCount Pie */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                {/* CHANGED: heading to match Surgical Treatment */}
                <div className="text-sm font-medium mb-3">Surgical Treatment Count vs Other Visits</div>
                <div className="w-full h-64">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={surgicalTreatmentCountPie}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={95}
                                innerRadius={45}
                                paddingAngle={1}
                            >
                                {surgicalTreatmentCountPie.map((_, i) => (
                                    <Cell key={`post-${i}`} fill={COLORS_C[i % COLORS_C.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => [v, "Count"]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    {totalNumOfSurgicalTreatmentCount} of {tableThreeSumNumber} visits ({totalNumOfSurgicalTreatmentCountPct})
                </div>
            </div>
            </div>


            {/* Create dialog */}
            <Dialog open={open} onOpenChange={setOpen} >
                <DialogContent className="bg-white/100 backdrop-blur-none">
                    <DialogHeader>
                        <DialogTitle>New entry</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />
                        {/* CHANGED: placeholders only */}
                        <Input
                            type="number"
                            placeholder="Joint Complication Count"
                            value={form.numOfJointComplicationCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfJointComplicationCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Motor Dysfunction Count"
                            value={form.numOfMotorDysfunctionCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfMotorDysfunctionCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Trauma Complication Count"
                            value={form.numOfTraumaComplicationCount}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    numOfTraumaComplicationCount: e.target.value,
                                })
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Ankle Complication Count"
                            value={form.numOfAnkleComplicationCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfAnkleComplicationCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Pediatric Adverse Event Count"
                            value={form.numOfPediatricAdverseEventCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfPediatricAdverseEventCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Spinal Complication Count"
                            value={form.numOfSpinalComplicationCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfSpinalComplicationCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Hand Surgery Complication Count"
                            value={form.numOfHandSurgeryComplicationCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfHandSurgeryComplicationCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Obstetric Adverse Event Count"
                            value={form.numOfObstetricAdverseEventCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfObstetricAdverseEventCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Gynecological Adverse Event Count"
                            value={form.numOfGynecologicalAdverseEventCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfGynecologicalAdverseEventCount: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Surgical Treatment Count"
                            value={form.numOfSurgicalTreatmentCount}
                            onChange={(e) =>
                                setForm({ ...form, numOfSurgicalTreatmentCount: e.target.value })
                            }
                        />
                        <Button onClick={create} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            Create
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
