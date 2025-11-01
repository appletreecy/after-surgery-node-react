import { useState } from 'react';
import { api } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export default function Register(){
    const [email,setEmail]=useState('');
    const [name,setName]=useState('');
    const [password,setPassword]=useState('');
    const [err,setErr]=useState<string|null>(null);
    const nav = useNavigate();


    async function submit(e: React.FormEvent){
        e.preventDefault(); setErr(null);
        try {
            await api.post('/auth/register',{email,name,password});
            nav('/login');
        } catch(e:any){ setErr(e?.response?.data?.error||'Register failed'); }
    }


    return (
        <div className="min-h-screen grid place-items-center">
            <Card className="w-full max-w-sm">
                <CardHeader><CardTitle>Create account</CardTitle></CardHeader>
                <CardContent>
                    <form className="space-y-3" onSubmit={submit}>
                        <Input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
                        <Input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
                        <Input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
                        {err && <div className="text-red-600 text-sm">{err}</div>}
                        <Button type="submit" className="w-full">Register</Button>
                        <div className="text-sm text-gray-600">Have an account? <Link to="/login" className="underline">Login</Link></div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}