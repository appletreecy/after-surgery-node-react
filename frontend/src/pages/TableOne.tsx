// frontend/src/pages/TableOne.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Row = {
    id: number;
    date: string | null; // selected date (ISO) - new field
    numOfAdverseReactionCases: number | null;
    numOfInadequateAnalgesia: number | null;
    numOfPostoperativeAnalgesiaCases: number | null;
    numOfPostoperativeVisits: number | null;
    createdAt: string; // backend auto timestamp
};

type CreatePayload = {
    date?: string | null;
    numOfAdverseReactionCases?: number | null;
    numOfInadequateAnalgesia?: number | null;
    numOfPostoperativeAnalgesiaCases?: number | null;
    numOfPostoperativeVisits?: number | null;
};

export default function TableOne() {
    const [items, setItems] = useState<Row[]>([]);
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        date: "",
        numOfAdverseReactionCases: "",
        numOfInadequateAnalgesia: "",
        numOfPostoperativeAnalgesiaCases: "",
        numOfPostoperativeVisits: "",
    });

    async function load() {
        const r = await api.get("/table-one");
        setItems(r.data.items || []);
    }
    useEffect(() => { load(); }, []);

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
        await load();
    }

    async function remove(id: number) {
        await api.delete(`/table-one/${id}`);
        await load();
    }

    return (
        <div className="space-y-4">
            {/* Action bar — consistent with Records */}
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    placeholder="Search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-64"
                />
                <Button
                    onClick={() => {/* client-side filter happens live; kept for parity */}}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    Search
                </Button>
                <Button
                    onClick={() => setOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    Add
                </Button>
            </div>

            {/* Table container — carded like Records */}
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
                                <Button
                                    onClick={() => remove(r.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
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

            {/* Create dialog — same spacing as Records create */}
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
                        <Button
                            onClick={create}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            Create
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
