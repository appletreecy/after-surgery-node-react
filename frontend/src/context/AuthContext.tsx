import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

type User = { id: number; email: string; name: string } | null
type CtxType = { user: User; setUser: (u: User)=>void; loading: boolean }
const Ctx = createContext<CtxType>({ user: null, setUser: () => {}, loading: true })
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null)
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        api.get('/auth/me').then(r => setUser(r.data.user)).finally(() => setLoading(false))
    }, [])
    return <Ctx.Provider value={{ user, setUser, loading }}>{children}</Ctx.Provider>
}
