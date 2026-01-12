"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Gamepad2, Sparkles, Trophy } from "lucide-react";

export function Hero() {
    return (
        <section className="relative overflow-hidden bg-slate-950 py-20 sm:py-32">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px]" />
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px]" />

            <div className="container relative z-10 mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20 mb-8">
                        <Sparkles className="w-4 h-4" />
                        Nova Experiência Educatech
                    </span>

                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl max-w-4xl mx-auto mb-6">
                        Aprender pode ser a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">melhor parte do dia.</span>
                    </h1>

                    <p className="mt-6 text-lg leading-8 text-slate-300 max-w-2xl mx-auto mb-10">
                        Transforme o estudo em uma aventura com jogos incríveis que desafiam sua mente.
                        Para alunos que amam um desafio e professores que buscam inovar.
                    </p>

                    <div className="flex items-center justify-center gap-x-6">
                        <Button size="lg" variant="primary">
                            <Gamepad2 className="w-5 h-5 mr-2" />
                            Explorar Jogos
                        </Button>
                        <Button size="lg" variant="ghost" className="text-white hover:bg-slate-800">
                            <Trophy className="w-5 h-5 mr-2" />
                            Ver Destaques
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
