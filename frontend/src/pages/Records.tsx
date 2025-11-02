import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Records(){
    const [items,setItems]=useState<any[]>([]);
    const [q,setQ]=useState('');
    const [open,setOpen]=useState(false);
    const [form,setForm]=useState({surgeryDate:'',patientName:'',procedure:'',doctor:'',department:'',notes:'',outcome:''});

    async function load(){
        const r = await api.get('/records',{ params: { q } });
        setItems(r.data.items);
    }
    useEffect(()=>{ load(); },[]);

    async function create(){
        await api.post('/records', form);
        setOpen(false); setForm({surgeryDate:'',patientName:'',procedure:'',doctor:'',department:'',notes:'',outcome:''});
        await load();
    }

    async function remove(id:number){
        await api.delete(`/records/${id}`);
        await load();
    }

    return (
        <div className="space-y-4">
            {/* Filters + actions */}
            <div className="flex flex-wrap items-center gap-2">
                <Input placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} className="w-64" />
                <Button onClick={load} className="bg-indigo-600 hover:bg-indigo-700 text-white">Search</Button>
                <Button onClick={()=>setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">Add</Button>
            </div>

            {/* Table container (commercial polish) */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="text-left border-b bg-gray-50">
                        <th className="py-2 px-3">Date</th>
                        <th className="px-3">Patient</th>
                        <th className="px-3">Procedure</th>
                        <th className="px-3">Doctor</th>
                        <th className="px-3">Department</th>
                        <th className="px-3">Outcome</th>
                        <th className="px-3 w-32"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {items.map(r=> (
                        <tr key={r.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">{new Date(r.surgeryDate).toLocaleDateString()}</td>
                            <td className="px-3">{r.patientName}</td>
                            <td className="px-3">{r.procedure}</td>
                            <td className="px-3">{r.doctor}</td>
                            <td className="px-3">{r.department}</td>
                            <td className="px-3">{r.outcome||'-'}</td>
                            <td className="px-3">
                                <Button
                                    onClick={()=>remove(r.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Delete
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={7} className="py-10 text-center text-gray-500">
                                No records found.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Create dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>New record</DialogTitle></DialogHeader>
                    <div className="space-y-2">
                        <Input type="date" value={form.surgeryDate} onChange={e=>setForm({...form,surgeryDate:e.target.value})} />
                        <Input placeholder="Patient" value={form.patientName} onChange={e=>setForm({...form,patientName:e.target.value})} />
                        <Input placeholder="Procedure" value={form.procedure} onChange={e=>setForm({...form,procedure:e.target.value})} />
                        <Input placeholder="Doctor" value={form.doctor} onChange={e=>setForm({...form,doctor:e.target.value})} />
                        <Input placeholder="Department" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} />
                        <Input placeholder="Outcome" value={form.outcome} onChange={e=>setForm({...form,outcome:e.target.value})} />
                        <Input placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
                        <Button onClick={create} className="bg-indigo-600 hover:bg-indigo-700 text-white">Create</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
