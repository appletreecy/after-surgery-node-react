import './App.css'

import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Button } from '@/components/ui/button';
import { api } from './lib/api';


export default function App(){
    const { user, setUser } = useAuth();
    const nav = useNavigate();
    async function logout(){ await api.post('/auth/logout'); setUser(null); nav('/login'); }
    if (!user) { nav('/login'); return null; }
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="border-b bg-white">
                <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
                    <h1 className="text-xl font-semibold">After Surgery Dashboard</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{user.name} ({user.email})</span>
                        <Button onClick={logout} variant="secondary">Logout</Button>
                    </div>
                </div>
            </header>
            <main className="max-w-6xl mx-auto p-4">
                <Outlet/>
            </main>
        </div>
    );
}

