"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Gamepad2, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";

export function Hero() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch(`${API_URL}/api/user-status`, {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    setIsLoggedIn(data.loggedIn);
                }
            } catch (err) {
                console.error("Failed to fetch user status in Hero", err);
            }
        };
        checkAuth();

        // Listener opcional caso o login ocorra na mesma página (nesta arquitetura usualmente redireciona, mas é bom ter)
        window.addEventListener("user-updated", checkAuth);
        return () => window.removeEventListener("user-updated", checkAuth);
    }, []);

    return (
        <section className="relative overflow-hidden bg-slate-950 py-20 sm:py-32">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-teal-500/20 blur-[120px]" />
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[120px]" />

            <div className="container relative z-10 mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-4 py-1.5 text-sm font-medium text-teal-400 ring-1 ring-inset ring-teal-500/20 mb-8">
                        <Sparkles className="w-4 h-4" />
                        Nova Experiência BrincaBytes
                    </span>

                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl max-w-4xl mx-auto mb-6">
                        Aprender pode ser a <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">melhor parte do dia.</span>
                    </h1>

                    <p className="mt-6 text-lg leading-8 text-slate-300 max-w-2xl mx-auto mb-10">
                        Transforme a sala de aula escolar em uma aventura com jogos incríveis que desafiam a mente.
                        A ferramenta perfeita para professores inovadores e escolas do futuro.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-10">
                        <Link href="#jogos">
                            <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
                                <Gamepad2 className="w-5 h-5 mr-2" />
                                Explorar Jogos
                            </Button>
                        </Link>
                        {!isLoggedIn && (
                            <Link href="/register">
                                <Button size="lg" variant="ghost" className="w-full sm:w-auto text-white hover:bg-slate-800 border border-slate-700">
                                    <UserPlus className="w-5 h-5 mr-2" />
                                    Criar Conta Grátis
                                </Button>
                            </Link>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
