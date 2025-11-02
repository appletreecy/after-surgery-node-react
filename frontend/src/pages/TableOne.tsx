import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

    // default since = last 30 days
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const [since, setSince] = useState(fmtDateYYYYMMDD(last30));

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        date: "",
        numOfAdverseReactionCases: "",
        numOfInadequateAnalgesia: "",
        numOfPostoperativeAnalgesiaCases: "",
        numOfPostoperativeVisits: "",
    });

    async function load() {
        const r = await api.get("/table-one", {
            params: { q: q || undefined, since, page, pageSize },
        });
        setItems(r.data.items || []);
        setTotal(r.data.total || 0);
        if (r.data.sums) setSums(r.data.sums);
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, since]);

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
        setPage(1); // jump to first page to show newest per default sort
        await load();
    }

    async function remove(id: number) {
        await api.delete(`/table-one/${id}`);
        await load();
    }

    function runSearch() {
        setPage(1);
        load();
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    type="date"
                    value={since}
                    onChange={(e) => { setSince(e.target.value); setPage(1); }}
                    className="w-44"
                    aria-label="Since date"
                />
                <Input
                    placeholder="Search (optional)"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-64"
                />
                <Button onClick={runSearch} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Search
                </Button>
                <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Add
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

            {/* Totals for current server filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Adverse Reactions (Σ)</div>
                    <div className="text-2xl font-semibold">{sums.numOfAdverseReactionCases}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Inadequate Analgesia (Σ)</div>
                    <div className="text-2xl font-semibold">{sums.numOfInadequateAnalgesia}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Postop Analgesia Cases (Σ)</div>
                    <div className="text-2xl font-semibold">{sums.numOfPostoperativeAnalgesiaCases}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-xs text-gray-500">Postop Visits (Σ)</div>
                    <div className="text-2xl font-semibold">{sums.numOfPostoperativeVisits}</div>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
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

            {/* Create dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
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
