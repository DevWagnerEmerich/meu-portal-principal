"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LayoutDashboard, Gamepad2, Users, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { API_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const res = await fetch(`${API_URL}/api/user-status`, { credentials: "include" });
                const data = await res.json();

                if (data.loggedIn && data.role === 'admin') {
                    setIsAuthorized(true);
                } else {
                    router.push("/"); // Redireciona se não for admin
                }
            } catch (error) {
                console.error("Erro ao verificar admin:", error);
                router.push("/");
            } finally {
                setIsLoading(false);
            }
        };

        checkAdmin();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <LayoutDashboard className="text-primary" />
                        Admin Panel
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin/games">
                        <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                            <Gamepad2 className="w-4 h-4 mr-2" />
                            Jogos
                        </Button>
                    </Link>
                    <Link href="/admin/users">
                        <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                            <Users className="w-4 h-4 mr-2" />
                            Usuários
                        </Button>
                    </Link>
                    <Link href="/admin/settings">
                        <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                            <Settings className="w-4 h-4 mr-2" />
                            Configurações
                        </Button>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/10" onClick={() => router.push('/')}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sair do Admin
                    </Button>
                </div>
            </aside>

            {/* Conteúdo Principal */}
            <main className="flex-1 overflow-auto">
                {/* <title>Admin Layout</title> <meta name="description" content="Dashboard"> <meta property="og:title" content="Dashboard"> */}
                <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 md:hidden">
                    <span className="font-bold text-white">Admin</span>
                    {/* Mobile menu toggle could go here */}
                </header>
                <div className="p-6 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
