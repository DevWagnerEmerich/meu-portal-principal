"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Crown, ArrowRight, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
    const router = useRouter();
    const [isRenewal, setIsRenewal] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('type') === 'renewal') {
            setIsRenewal(true);
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Efeitos de Fundo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-teal-500/20 rounded-full blur-[80px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="bg-slate-900 border border-slate-800 p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full text-center relative z-10"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
                    className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)] relative"
                >
                    <CheckCircle className="w-12 h-12 text-white" />

                    {/* Partículas animadas */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 border-2 border-emerald-400 rounded-full"
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        {isRenewal ? "Renovação Aprovada!" : "Pagamento Aprovado!"}
                    </h1>
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                        {isRenewal
                            ? "Sua fidelidade é incrível! Seus novos dias de assinatura foram adicionados ao seu saldo VIP atual com sucesso."
                            : "Sua assinatura premium foi ativada com sucesso. Agora você tem acesso ilimitado a todos os nossos jogos interativos e educativos."}
                    </p>

                    <div className="bg-slate-800/50 rounded-2xl p-6 mb-8 border border-slate-700/50">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            {isRenewal ? <Clock className="w-6 h-6 text-emerald-400" /> : <Crown className="w-6 h-6 text-amber-400" />}
                            <h3 className="text-white font-bold text-lg">
                                {isRenewal ? "Saldo de Dias Atualizado" : "Status: VIP Ativo"}
                            </h3>
                        </div>
                        <p className="text-sm text-slate-400">
                            {isRenewal ? "Continue aproveitando o portal sem interrupções." : "Plataforma desbloqueada em tempo real."}
                        </p>
                    </div>

                    <Button
                        onClick={() => router.push('/')}
                        className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02]"
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Acessar Meus Jogos
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
