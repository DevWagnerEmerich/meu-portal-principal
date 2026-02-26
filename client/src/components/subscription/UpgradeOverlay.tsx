import { motion } from "framer-motion";
import { Zap, Timer, Crown, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";

interface UpgradeOverlayProps {
    reason?: 'energy' | 'vip';
}

export function UpgradeOverlay({ reason = 'energy' }: UpgradeOverlayProps) {
    const [timeLeft, setTimeLeft] = useState(600);
    const [offerData, setOfferData] = useState<{ active: boolean; expiresAt: number | null }>({ active: false, expiresAt: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const STORAGE_KEY = 'scarcity_timer_end';
        const DURATION = 600 * 1000;

        const storedEnd = localStorage.getItem(STORAGE_KEY);
        let endTime = storedEnd ? parseInt(storedEnd, 10) : 0;

        if (!endTime || endTime < Date.now()) {
            endTime = Date.now() + DURATION;
            localStorage.setItem(STORAGE_KEY, endTime.toString());
        }

        const tick = () => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
            setTimeLeft(remaining);
        };

        tick();
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

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4 relative overflow-hidden w-full max-w-4xl mx-auto">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-12 relative shadow-2xl overflow-hidden flex flex-col items-center"
            >
                {/* OFERTA RELÂMPAGO (IMEDIATA - SCARCITY) */}
                {offerData.active && (
                    <div className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 py-3 flex items-center justify-center gap-3 shadow-lg mb-8 -mx-8 md:-mx-12 w-[calc(100%+4rem)] md:w-[calc(100%+6rem)] relative z-20">
                        <Building2 className="w-5 h-5 text-white" />
                        <span className="text-white font-bold uppercase tracking-wide text-sm md:text-base">
                            25% DE DESCONTO PARA NOVAS ESCOLAS ATIVO
                        </span>
                    </div>
                )}

                <div className="flex flex-col items-center mb-10 w-full max-w-2xl">
                    {/* Icone Customizado */}
                    <div className={`w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border-2 ${reason === 'vip' ? 'border-amber-500' : 'border-red-500'} relative`}>
                        {reason === 'vip' ? (
                            <Crown className="w-10 h-10 text-amber-500" />
                        ) : (
                            <>
                                <Zap className="w-10 h-10 text-red-500" />
                                <div className="absolute -right-2 -top-2 bg-red-500 text-white text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full border-2 border-slate-900 shadow-md">
                                    0
                                </div>
                            </>
                        )}
                    </div>

                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                        {reason === 'vip' ? "Jogo Premium Exclusivo" : "Energia Esgotada!"}
                    </h2>
                    <p className={`text-lg md:text-xl leading-relaxed ${reason === 'vip' ? 'text-amber-200/80' : 'text-slate-400'}`}>
                        {reason === 'vip'
                            ? "Professor(a), este jogo super engajador faz parte do nosso acervo VIP para assinantes."
                            : "Você atingiu o limite seguro de testes gratuitos diários da sua conta."}
                        <br className="hidden md:block" />
                    </p>

                    <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
                        <span className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-2 block">Não pare a aula agora!</span>
                        <span className="text-white text-base block mb-4">Assine o Plano Premium e libere todos os jogos ilimitados para você ou sua escola instantaneamente.</span>

                        <div className="flex flex-col items-center bg-slate-900/80 rounded-xl py-3 border border-indigo-500/30">
                            <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-1">🎁 Promoção de Boas-Vindas expira em:</span>
                            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400 tabular-nums">
                                {formatTime(timeLeft)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SINGLE CALL TO ACTION FOR BOTH */}
                <div className="w-full max-w-md mx-auto space-y-4">
                    <Link href="/subscription" className="w-full block">
                        <Button className="w-full h-16 font-bold text-lg rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-xl shadow-indigo-500/25 border-t border-white/20">
                            Ver Planos Premium (Professores ou Escolas)
                            <ArrowRight className="w-6 h-6 ml-3" />
                        </Button>
                    </Link>

                    <Link href="/" className="block mt-6">
                        <Button variant="ghost" className="text-slate-500 hover:text-white text-sm">
                            Voltar ao menu inicial por enquanto
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
