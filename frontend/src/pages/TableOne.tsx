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
    numOfAdverseReactionCases: number | null;
    numOfInadequateAnalgesia: number | null;
    numOfPostoperativeAnalgesiaCases: number | null;
    numOfPostoperativeVisits: number | null;
    createdAt: string;
};

type Sums = {
    numOfAdverseReactionCases: number;
    numOfInadequateAnalgesia: number;
    numOfPostoperativeAnalgesiaCases: number;
    numOfPostoperativeVisits: number;
};

type CreatePayload = {
    date?: string | null;
    numOfAdverseReactionCases?: number | null;
    numOfInadequateAnalgesia?: number | null;
    numOfPostoperativeAnalgesiaCases?: number | null;
    numOfPostoperativeVisits?: number | null;
};

function fmtDateYYYYMMDD(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function pct(numerator: number, denominator: number, digits = 2) {
    if (!denominator || denominator <= 0) return "0%";
    console.log("for push.")
    return `${((numerator / denominator) * 100).toFixed(digits)}%`;
}

export default function TableOne() {
    const [items, setItems] = useState<Row[]>([]);
    const [total, setTotal] = useState(0);
    const [sums, setSums] = useState<Sums>({
        numOfAdverseReactionCases: 0,
        numOfInadequateAnalgesia: 0,
        numOfPostoperativeAnalgesiaCases: 0,
        numOfPostoperativeVisits: 0,
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
        numOfAdverseReactionCases: "",
        numOfInadequateAnalgesia: "",
        numOfPostoperativeAnalgesiaCases: "",
        numOfPostoperativeVisits: "",
    });

    // -------- Data fetching ----------
    async function load() {
        const params: any = { page, pageSize };
        if (from) params.from = from;
        if (to) params.to = to;

        const r = await api.get("/table-one", { params });
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
                r.numOfAdverseReactionCases,
                r.numOfInadequateAnalgesia,
                r.numOfPostoperativeAnalgesiaCases,
                r.numOfPostoperativeVisits,
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
            numOfAdverseReactionCases: toIntOrNull(form.numOfAdverseReactionCases),
            numOfInadequateAnalgesia: toIntOrNull(form.numOfInadequateAnalgesia),
            numOfPostoperativeAnalgesiaCases: toIntOrNull(form.numOfPostoperativeAnalgesiaCases),
            numOfPostoperativeVisits: toIntOrNull(form.numOfPostoperativeVisits),
        };
        await api.post("/table-one", payload);
        setOpen(false);
        setForm({
            date: "",
            numOfAdverseReactionCases: "",
            numOfInadequateAnalgesia: "",
            numOfPostoperativeAnalgesiaCases: "",
            numOfPostoperativeVisits: "",
        });
        setPage(1);
        await load();
    }

    async function remove(id: number) {
        await api.delete(`/table-one/${id}`);
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
    const visits = sums.numOfPostoperativeVisits || 0;
    const postopAnalgesiaCount = sums.numOfPostoperativeAnalgesiaCases || 0;
    const postopAnalgesiaPct = pct(postopAnalgesiaCount, visits);
    const postopAnalgesiaOther = Math.max(0, visits - postopAnalgesiaCount);

    const adverseCount = sums.numOfAdverseReactionCases || 0;
    const adversePct = pct(adverseCount, postopAnalgesiaCount);
    const adverseOther = Math.max(0, postopAnalgesiaCount - adverseCount);

    const inadequateCount = sums.numOfInadequateAnalgesia || 0;
    const inadequatePct = pct(inadequateCount, postopAnalgesiaCount);
    const inadequateOther = Math.max(0, postopAnalgesiaCount - inadequateCount);

    const adversePie = [
        { name: "Adverse Reactions", value: adverseCount },
        { name: "Other Visits", value: adverseOther },
    ];
    const inadequatePie = [
        { name: "Inadequate Analgesia", value: inadequateCount },
        { name: "Other Visits", value: inadequateOther },
    ];
    const postopAnalgesiaPie = [
        { name: "Postop Analgesia Cases", value: postopAnalgesiaCount },
        { name: "Other Visits", value: postopAnalgesiaOther },
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
            const r = await api.get("/table-one", {
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
            "numOfAdverseReactionCases",
            "numOfInadequateAnalgesia",
            "numOfPostoperativeAnalgesiaCases",
            "numOfPostoperativeVisits",
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
                    r.numOfAdverseReactionCases ?? "",
                    r.numOfInadequateAnalgesia ?? "",
                    r.numOfPostoperativeAnalgesiaCases ?? "",
                    r.numOfPostoperativeVisits ?? "",
                    r.createdAt ? new Date(r.createdAt).toISOString() : "",
                ]
                    .map(escapeCell)
                    .join(",")
            );
        }

        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        downloadBlob(blob, `table-one_${from || "all"}_${to || "all"}.csv`);
    }

    async function exportXlsx() {
        const rows = await fetchAllRowsForRange();

        const data = rows.map((r) => ({
            ID: r.id,
            Date: toYYYYMMDD(r.date),
            Adverse: r.numOfAdverseReactionCases ?? null,
            Inadequate: r.numOfInadequateAnalgesia ?? null,
            "Postop Analgesia": r.numOfPostoperativeAnalgesiaCases ?? null,
            Visits: r.numOfPostoperativeVisits ?? null,
            "Created At": r.createdAt ? new Date(r.createdAt).toISOString() : "",
        }));

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data, { cellDates: false });
        XLSX.utils.book_append_sheet(wb, ws, "TableOne");

        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        downloadBlob(blob, `table-one_${from || "all"}_${to || "all"}.xlsx`);
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
                        <th className="px-3">Adverse Reactions</th>
                        <th className="px-3">Inadequate Analgesia</th>
                        <th className="px-3">Postop Analgesia Cases</th>
                        <th className="px-3">Postop Visits</th>
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
                            <td className="px-3">{r.numOfAdverseReactionCases ?? "-"}</td>
                            <td className="px-3">{r.numOfInadequateAnalgesia ?? "-"}</td>
                            <td className="px-3">{r.numOfPostoperativeAnalgesiaCases ?? "-"}</td>
                            <td className="px-3">{r.numOfPostoperativeVisits ?? "-"}</td>
                            <td className="px-3">
                                <Button onClick={() => remove(r.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                    Delete
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan={6} className="py-10 text-center text-gray-500">
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
                    <div className="text-xs text-gray-500">Adverse Reactions (Σ)</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfAdverseReactionCases}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Inadequate Analgesia (Σ)</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfInadequateAnalgesia}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Postop Analgesia Cases (Σ)</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfPostoperativeAnalgesiaCases}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Postop Visits (Σ)</div>
                    <div className="text-2xl font-semibold">
                        {sums.numOfPostoperativeVisits}
                    </div>
                </div>
            </div>

            {/* Percentage text */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Adverse Reactions / Visits</div>
                    <div className="text-2xl font-semibold">{adversePct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {adverseCount} / {postopAnalgesiaCount} visits
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Inadequate Analgesia / Visits</div>
                    <div className="text-2xl font-semibold">{inadequatePct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {inadequateCount} / {postopAnalgesiaCount} visits
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Postop Analgesia Cases / Visits</div>
                    <div className="text-2xl font-semibold">{postopAnalgesiaPct}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {postopAnalgesiaCount} / {visits} visits
                    </div>
                </div>
            </div>

            {/* Three separate pies */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Adverse vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">Adverse Reactions vs Other Visits</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={adversePie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {adversePie.map((_, i) => (
                                        <Cell key={`adv-${i}`} fill={COLORS_A[i % COLORS_A.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {adverseCount} of {postopAnalgesiaCount} visits ({adversePct})
                    </div>
                </div>

                {/* Inadequate vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">Inadequate Analgesia vs Other Visits</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={inadequatePie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {inadequatePie.map((_, i) => (
                                        <Cell key={`inad-${i}`} fill={COLORS_B[i % COLORS_B.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {inadequateCount} of {postopAnalgesiaCount} visits ({inadequatePct})
                    </div>
                </div>

                {/* Postop Analgesia vs Other */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm font-medium mb-3">Postop Analgesia Cases vs Other Visits</div>
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={postopAnalgesiaPie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                    innerRadius={45}
                                    paddingAngle={1}
                                >
                                    {postopAnalgesiaPie.map((_, i) => (
                                        <Cell key={`post-${i}`} fill={COLORS_C[i % COLORS_C.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, "Count"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        {postopAnalgesiaCount} of {visits} visits ({postopAnalgesiaPct})
                    </div>
                </div>
            </div>

            {/* Create dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
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
                        <Input
                            type="number"
                            placeholder="Adverse Reactions"
                            value={form.numOfAdverseReactionCases}
                            onChange={(e) =>
                                setForm({ ...form, numOfAdverseReactionCases: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Inadequate Analgesia"
                            value={form.numOfInadequateAnalgesia}
                            onChange={(e) =>
                                setForm({ ...form, numOfInadequateAnalgesia: e.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Postop Analgesia Cases"
                            value={form.numOfPostoperativeAnalgesiaCases}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    numOfPostoperativeAnalgesiaCases: e.target.value,
                                })
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Postop Visits"
                            value={form.numOfPostoperativeVisits}
                            onChange={(e) =>
                                setForm({ ...form, numOfPostoperativeVisits: e.target.value })
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
