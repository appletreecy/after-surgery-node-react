// frontend/src/pages/Login.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { setUser } = useAuth();
    const navigate = useNavigate();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (submitting) return;
        setErr(null);
        setSubmitting(true);
        try {
            const res = await api.post("/auth/login", { email, password });
            setUser(res.data); // { id, email, name }
            navigate("/", { replace: true });
        } catch (e: any) {
            const msg =
                e?.response?.data?.error ??
                e?.message ??
                "Login failed. Please check your email/password.";
            setErr(String(msg));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen w-screen grid place-items-center bg-gray-100 px-4">
            <Card className="w-full max-w-xl shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Sign in</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="email">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPw ? "text" : "password"}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw((s) => !s)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                    aria-label={showPw ? "Hide password" : "Show password"}
                                >
                                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {err && (
                            <div className="text-red-600 text-sm border border-red-200 rounded-md p-2 bg-red-50">
                                {err}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </span>
                            ) : (
                                "Login"
                            )}
                        </Button>

                        <div className="text-sm text-gray-600 text-center">
                            No account?{" "}
                            <Link to="/register" className="underline hover:text-gray-800">
                                Create one
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
