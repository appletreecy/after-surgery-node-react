import { Outlet, Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

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

    // ✅ Label generator (with "Table - " prefix)
    function currentTableLabel(pathname: string) {
        if (pathname.startsWith("/table-one")) return "Table - Table One";
        if (pathname.startsWith("/table-three")) return "Table - Table Three";
        if (pathname.startsWith("/table-four")) return "Table - Table Four";
        if (pathname.startsWith("/table-five")) return "Table - Table Five";
        return "Table - Tables";
    }

    function currentTableLabelMonthly(pathname: string) {
        if (pathname.startsWith("/table-one-monthly")) return "Table - Table One Monthly";
        if (pathname.startsWith("/table-two-monthly")) return "Table - Table Two Monthly";
        if (pathname.startsWith("/table-three-monthly")) return "Table - Table Three Monthly";
        if (pathname.startsWith("/table-four-monthly")) return "Table - Table Four Monthly";
        if (pathname.startsWith("/table-five")) return "Table - Table Five";
        return "Table Monthly - Tables";
    }

    const label = currentTableLabel(location.pathname);

    const labelMonthly = currentTableLabelMonthly(location.pathname);

    return (
        <div className="min-h-screen w-full bg-[rgb(var(--background))] overflow-x-hidden">
            {/* Solid header */}
            <header className="w-full bg-white border-b">
                <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2 sm:gap-6 px-6 py-3">
                    {/* Left: Product title */}
                    <h1 className="text-xl font-semibold text-gray-900">
                        After Surgery Dashboard
                    </h1>

                    {/* Right: Nav + User */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-6 w-full sm:w-auto">
                        {/* Dropdown Navigation */}
                        <nav className="flex flex-wrap items-center gap-3 text-sm w-full sm:w-auto">
                            <Link to="/table-joined" className={isActive("/table-joined")}>
                                Big Table
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto min-w-0 sm:min-w-[12rem] justify-between"
                                    >
                                        {labelMonthly}
                                        <svg
                                            aria-hidden="true"
                                            viewBox="0 0 20 20"
                                            className="ml-2 h-4 w-4"
                                        >
                                            <path d="M5.25 7.5L10 12.25L14.75 7.5H5.25Z" />
                                        </svg>
                                    </Button>
                                </DropdownMenuTrigger>

                                {/* Solid dropdown background */}
                                <DropdownMenuContent
                                    align="start"
                                    className="w-[75%] max-w-[12rem] bg-white shadow-lg border border-gray-200"
                                >
                                    <DropdownMenuLabel>MonthlyTables</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link to="/table-one-monthly" className={isActive("/table-one-monthly")}>
                                            Table One Monthly
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/table-two-monthly" className={isActive("/table-two-monthly")}>
                                            Table Two Monthly
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/table-three-monthly" className={isActive("/table-three-monthly")}>
                                            Table Three Monthly
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/table-four-monthly" className={isActive("/table-four-monthly")}>
                                            Table Four Monthly
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/table-five-monthly" className={isActive("/table-five-monthly")}>
                                            Table Five Monthly
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto min-w-0 sm:min-w-[12rem] justify-between"
                                    >
                                        {label}
                                        <svg
                                            aria-hidden="true"
                                            viewBox="0 0 20 20"
                                            className="ml-2 h-4 w-4"
                                        >
                                            <path d="M5.25 7.5L10 12.25L14.75 7.5H5.25Z" />
                                        </svg>
                                    </Button>
                                </DropdownMenuTrigger>

                                {/* Solid dropdown background */}
                                <DropdownMenuContent
                                    align="start"
                                    className="w-[75%] max-w-[12rem] bg-white shadow-lg border border-gray-200"
                                >
                                    <DropdownMenuLabel>Tables</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link to="/table-one" className={isActive("/table-one")}>
                                            Table One
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/table-two" className={isActive("/table-two")}>
                                            Table Two
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/table-three" className={isActive("/table-three")}>
                                            Table Three
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/table-four" className={isActive("/table-four")}>
                                            Table Four
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/table-five" className={isActive("/table-five")}>
                                            Table Five
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </nav>

                        {/* User Info + Logout */}
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:justify-end">
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
