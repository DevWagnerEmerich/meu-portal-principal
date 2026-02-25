"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Gamepad2, User, LogOut, Zap, LayoutDashboard } from "lucide-react";
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
        window.addEventListener("user-updated", checkAuth);
        return () => window.removeEventListener("user-updated", checkAuth);
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
    // Também não exibe no admin, pois o admin tem seu próprio layout
    if (pathname === "/login" || pathname === "/register" || pathname?.startsWith("/admin") || pathname?.startsWith("/play")) return null;

    return (
        <nav className="absolute top-0 w-full z-50 border-b border-border/10 bg-background/50 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <Gamepad2 className="text-white w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl text-foreground tracking-tight">BrincaBytes</span>
                </Link>

                <div className="flex items-center gap-4">
                    {user?.loggedIn ? (
                        <>
                            <div className="hidden sm:flex items-center gap-4 text-muted-foreground">
                                <Link href="/profile" className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring rounded-lg p-1">
                                    <div className="flex items-center gap-2 group">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border group-hover:border-secondary/50 transition-colors">
                                            <User className="w-4 h-4 text-muted-foreground group-hover:text-secondary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground/80 leading-none mb-0.5">Olá,</span>
                                            <span className="text-sm font-medium text-foreground group-hover:text-secondary transition-colors">{user?.username}</span>
                                        </div>
                                    </div>
                                </Link>

                                {user?.subscriptionType === 'none' && user?.role !== 'admin' ? (
                                    <div className="flex items-center gap-1 bg-muted/50 px-3 py-1 rounded-full border border-border" title="Jogadas Grátis Restantes">
                                        <Zap className={`w-4 h-4 ${user?.energy !== undefined && user.energy > 0 ? "text-highlight" : "text-muted-foreground"}`} fill={user?.energy !== undefined && user.energy > 0 ? "currentColor" : "none"} />
                                        <span className="text-sm font-medium text-foreground">{user?.energy}/{user?.maxEnergy}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-highlight/20 to-highlight/10 px-3 py-1 rounded-full border border-highlight/50">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-highlight blur-[2px] opacity-50 animate-pulse rounded-full"></div>
                                            <Zap className="w-4 h-4 text-highlight relative z-10" fill="currentColor" />
                                        </div>
                                        <span className="text-sm font-bold text-highlight tracking-wide uppercase">
                                            {user?.role === 'admin' ? 'ADMIN' : 'VIP'}
                                        </span>
                                    </div>
                                )}

                                {user?.role === 'admin' && (
                                    <Link href="/admin">
                                        <Button variant="ghost" size="sm" className="text-highlight hover:text-highlight hover:bg-highlight/10 border border-transparent hover:border-highlight/20 ml-2">
                                            <LayoutDashboard className="w-4 h-4 mr-2" />
                                            Admin
                                        </Button>
                                    </Link>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Sair</span>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                                    Entrar
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button variant="secondary" className="text-white">
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
