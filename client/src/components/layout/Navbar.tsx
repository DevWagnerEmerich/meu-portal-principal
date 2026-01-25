"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Gamepad2, User, LogOut, Zap } from "lucide-react";
import { API_URL } from "@/lib/config";

export function Navbar() {
    const [user, setUser] = useState<{ loggedIn: boolean; username?: string; energy?: number; maxEnergy?: number; subscriptionType?: string; role?: string } | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch(`${API_URL}/api/user-status`, {
                    credentials: "include" // Importante para cookie
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                }
            } catch (err) {
                console.error("Failed to fetch user status", err);
            }
        };
        checkAuth();
    }, [pathname]); // Re-check on nav change

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/api/logout`, {
                method: "POST",
                credentials: "include"
            });
            window.location.href = "/"; // Hard reload
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    // Não exibe navbar nas pages de auth para focar no form
    if (pathname === "/login" || pathname === "/register") return null;

    return (
        <nav className="absolute top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                        <Gamepad2 className="text-white w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl text-white tracking-tight">Educatech</span>
                </Link>

                <div className="flex items-center gap-4">
                    {user?.loggedIn ? (
                        <>
                            <div className="hidden sm:flex items-center gap-4 text-slate-300">
                                <Link href="/profile" className="hover:opacity-80 transition-opacity">
                                    <div className="flex items-center gap-2 group">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-teal-500/50 transition-colors">
                                            <User className="w-4 h-4 text-slate-400 group-hover:text-teal-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-500 leading-none mb-0.5">Olá,</span>
                                            <span className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors">{user.username}</span>
                                        </div>
                                    </div>
                                </Link>

                                {user.subscriptionType === 'none' && user.role !== 'admin' ? (
                                    <div className="flex items-center gap-1 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800" title="Jogadas Grátis Restantes">
                                        <Zap className={`w-4 h-4 ${user.energy !== undefined && user.energy > 0 ? "text-yellow-400" : "text-slate-600"}`} fill={user.energy !== undefined && user.energy > 0 ? "currentColor" : "none"} />
                                        <span className="text-sm font-medium text-white">{user.energy}/{user.maxEnergy}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-3 py-1 rounded-full border border-amber-500/50">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-amber-400 blur-[2px] opacity-50 animate-pulse rounded-full"></div>
                                            <Zap className="w-4 h-4 text-amber-400 relative z-10" fill="currentColor" />
                                        </div>
                                        <span className="text-sm font-bold text-amber-400 tracking-wide uppercase">
                                            {user.role === 'admin' ? 'ADMIN' : 'VIP'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Sair</span>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" className="text-slate-300 hover:text-white">
                                    Entrar
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-teal-600 hover:bg-teal-500 text-white">
                                    Criar Conta
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav >
    );
}
