import { useEffect, useState } from 'react';
import { api } from '../lib/api';
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
            <div className="flex items-center gap-2">
                <Input placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} />
                <Button onClick={load}>Search</Button>
                <Button onClick={()=>setOpen(true)}>Add</Button>
            </div>


            <table className="w-full text-sm">
                <thead>
                <tr className="text-left border-b">
                    <th className="py-2">Date</th>
                    <th>Patient</th>
                    <th>Procedure</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Outcome</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {items.map(r=> (
                    <tr key={r.id} className="border-b">
                        <td className="py-2">{new Date(r.surgeryDate).toLocaleDateString()}</td>
                        <td>{r.patientName}</td>
                        <td>{r.procedure}</td>
                        <td>{r.doctor}</td>
                        <td>{r.department}</td>
                        <td>{r.outcome||'-'}</td>
                        <td>
                            <Button variant="destructive" onClick={()=>remove(r.id)}>Delete</Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>


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
                        <Button onClick={create}>Create</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}