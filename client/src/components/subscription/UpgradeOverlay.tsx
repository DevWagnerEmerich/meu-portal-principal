"use client";

import { motion } from "framer-motion";
import { Zap, Check, Timer, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";

interface Plan {
    id: string;
    title: string;
    monthlyPrice: number;
    totalPrice: number | null;
    durationLabel: string;
    popular?: boolean;
    savings?: string;
}

export function UpgradeOverlay() {
    const [timeLeft, setTimeLeft] = useState(600); // Começa com 10 min padrão
    const [offerData, setOfferData] = useState<{ active: boolean; expiresAt: number | null }>({ active: false, expiresAt: null });
    const [loading, setLoading] = useState(true);
    const [welcomeTimeLeft, setWelcomeTimeLeft] = useState<string>("");

    useEffect(() => {
        // Lógica de persistência do timer de escassez (10 minutos)
        const STORAGE_KEY = 'scarcity_timer_end';
        const DURATION = 600 * 1000; // 10 minutos em ms

        const storedEnd = localStorage.getItem(STORAGE_KEY);
        let endTime = storedEnd ? parseInt(storedEnd, 10) : 0;

        // Se não existir ou já tiver passado muito tempo (reset opcional), cria novo alvo
        if (!endTime || endTime < Date.now()) {
            endTime = Date.now() + DURATION;
            localStorage.setItem(STORAGE_KEY, endTime.toString());
        }

        const tick = () => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
            setTimeLeft(remaining);
        };

        tick(); // Atualiza imediatamente
        const timer = setInterval(tick, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetch(`${API_URL}/api/user-status`, { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (data.welcomeOffer) {
                    setOfferData(data.welcomeOffer);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (offerData.expiresAt) {
            const updateWelcomeTimer = () => {
                const now = Date.now();
                const diff = offerData.expiresAt! - now;
                if (diff <= 0) {
                    setWelcomeTimeLeft("Expirado");
                    return;
                }
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                setWelcomeTimeLeft(`${days}d ${hours}h`);
            };
            updateWelcomeTimer();
            const interval = setInterval(updateWelcomeTimer, 60000); // Atualiza a cada minuto
            return () => clearInterval(interval);
        }
    }, [offerData.expiresAt]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const hasBonus = offerData.active;
    const bonusMultiplier = hasBonus ? 0.75 : 1; // 25% off se tiver bonus

    const plans: Plan[] = [
        {
            id: 'monthly',
            title: 'Mensal',
            monthlyPrice: 19.90 * bonusMultiplier,
            totalPrice: null,
            durationLabel: '/mês',
            savings: hasBonus ? '25% OFF (Novo Jogador)' : undefined
        },
        {
            id: 'semiannual',
            title: 'Semestral',
            monthlyPrice: (99.00 * bonusMultiplier) / 6,
            totalPrice: 99.00 * bonusMultiplier,
            durationLabel: '/mês',
            popular: true,
            savings: hasBonus ? '45% OFF (Plano + Novo Jogador)' : 'Economize 20%'
        },
        {
            id: 'annual',
            title: 'Anual',
            monthlyPrice: (179.00 * bonusMultiplier) / 12,
            totalPrice: 179.00 * bonusMultiplier,
            durationLabel: '/mês',
            savings: hasBonus ? '55% OFF (Plano + Novo Jogador)' : 'Economize 35%'
        }
    ];

    if (loading) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4 relative overflow-hidden w-full max-w-6xl mx-auto">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-10 relative shadow-2xl overflow-hidden"
            >
                {/* 1. OFERTA RELÂMPAGO (IMEDIATA - SCARCITY) */}
                <div className="w-full bg-gradient-to-r from-red-600 to-orange-600 py-3 flex items-center justify-center gap-3 shadow-lg mb-8 -mx-6 md:-mx-10 w-[calc(100%+3rem)] md:w-[calc(100%+5rem)] relative z-20">
                    <Timer className="w-5 h-5 text-white animate-pulse" />
                    <span className="text-white font-bold uppercase tracking-wide text-sm md:text-base animate-pulse">
                        OFERTA RELÂMPAGO! APROVEITE AGORA
                    </span>
                </div>

                <div className="flex flex-col items-center mb-6">
                    {/* Timer Gigante Relâmpago */}
                    <div className="mb-4 flex flex-col items-center animate-bounce">
                        <span className="text-red-500 font-bold text-xs uppercase tracking-widest mb-1">Volta a jogar em</span>
                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-700 tabular-nums">
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border-2 border-slate-700 relative">
                        <Zap className="w-8 h-8 text-slate-500" />
                        <div className="absolute -right-1 -top-1 bg-red-500 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-900">
                            0
                        </div>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Acabou a energia?
                    </h2>
                    <p className="text-slate-400 text-lg max-w-xl">
                        Aproveite as ofertas abaixo para desbloquear o acesso ilimitado.
                    </p>
                </div>

                {/* 2. OFERTA DE BOAS-VINDAS (7 DIAS - DISCRETA) */}
                {hasBonus && (
                    <div className="mb-8 bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-3 flex items-center justify-center gap-2 max-w-2xl mx-auto">
                        <Star className="w-4 h-4 text-green-400 fill-green-400" />
                        <span className="text-indigo-200 text-sm font-medium">
                            Status Novo Jogador: <strong>25% de Desconto Extra</strong> ativo por mais <span className="text-white bg-indigo-600 px-1.5 py-0.5 rounded text-xs">{welcomeTimeLeft}</span>
                        </span>
                    </div>
                )}

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${plan.popular
                                ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10 scale-105 z-10'
                                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                    Mais Popular
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-white mb-2">{plan.title}</h3>

                            {/* Tag de Economia (Savings) */}
                            {plan.savings && (
                                <span className={`inline-block text-xs font-bold px-2 py-1 rounded mb-4 self-start ${hasBonus ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-slate-700 text-slate-300'}`}>
                                    {plan.savings}
                                </span>
                            )}

                            <div className="mt-auto mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm text-slate-400">R$</span>
                                    <span className="text-4xl font-extrabold text-white">{plan.monthlyPrice.toFixed(2).replace('.', ',')}</span>
                                    <span className="text-slate-400">{plan.durationLabel}</span>
                                </div>
                                {plan.totalPrice && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Total de R$ {plan.totalPrice.toFixed(2).replace('.', ',')}
                                    </p>
                                )}
                            </div>

                            <ul className="space-y-3 mb-8 text-left">
                                <li className="flex items-center gap-2 text-sm text-slate-300">
                                    <Check className="w-4 h-4 text-indigo-400" />
                                    <span>Jogadas <strong>Ilimitadas</strong></span>
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-300">
                                    {plan.id === 'monthly' ? (
                                        <Check className="w-4 h-4 text-slate-600" />
                                    ) : (
                                        <Check className="w-4 h-4 text-indigo-400" />
                                    )}
                                    <span className={plan.id === 'monthly' ? "text-slate-500 line-through" : ""}>Acesso Antecipado</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-300">
                                    <Check className="w-4 h-4 text-indigo-400" />
                                    <span>Sem anúncios</span>
                                </li>
                            </ul>

                            <Link href={`/subscription/checkout?plan=${plan.id}`} className="w-full">
                                <Button className={`w-full h-12 font-bold text-base rounded-xl ${plan.popular
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                                    }`}>
                                    Assinar {plan.title}
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>

                <Link href="/">
                    <Button variant="ghost" className="text-slate-500 hover:text-white">
                        Não obrigado, vou esperar até amanhã
                    </Button>
                </Link>
            </motion.div>
        </div>
    );
}
