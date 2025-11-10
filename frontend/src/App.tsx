import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function App() {
    const { user, setUser, loading } = useAuth();
    const location = useLocation();

    async function logout() {
        await api.post("/auth/logout");
        setUser(null);
    }

    if (loading) return <div className="p-6">Loading…</div>;
    if (!user) return <Navigate to="/login" replace />;

    const isActive = (path: string) =>
        location.pathname === path
            ? "text-indigo-600 font-medium"
            : "text-gray-600 hover:text-gray-900";

    return (
        <div className="min-h-screen w-full bg-[rgb(var(--background))]">
            <header className="w-full bg-white/90 border-b backdrop-blur">
                <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3">
                    {/* Left: Product title */}
                    <h1 className="text-xl font-semibold text-gray-900">
                        After Surgery Dashboard
                    </h1>

                    {/* Right: Nav + User */}
                    <div className="flex items-center gap-6">
                        <nav className="flex items-center gap-5 text-sm">
                            <a href="/table-one" className={isActive("/table-one")}>Table One</a>
                            <a href="/table-three" className={isActive("/table-three")}>Table Three</a>
                            <a href="/table-four" className={isActive("/table-four")}>Table Four</a>
                        </nav>

                        <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
                {user.name}
              </span>
                            <Button
                                onClick={logout}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Full width content area */}
            <main className="w-full min-h-screen px-6 py-6">
                <Outlet />
            </main>
        </div>
    );
}
