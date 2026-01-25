"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Loader2, Sparkles, CreditCard, Check, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { API_URL } from "@/lib/config";

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const planId = searchParams.get("plan");

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [offer, setOffer] = useState<{ active: boolean; expiresAt: number | null }>({ active: false, expiresAt: null });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // Fetch user data & check bonus
        fetch(`${API_URL}/api/user-status`, { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (!data.loggedIn) {
                    router.push("/login?redirect=/subscription/checkout");
                    return;
                }
                setUser(data);
                if (data.welcomeOffer) {
                    setOffer(data.welcomeOffer);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-white" /></div>;
    }

    if (!planId) {
        router.push("/");
        return null;
    }

    // Definição dos planos (sincronizado com BusinessRules do backend)
    const planData: Record<string, { price: number; title: string; description: string }> = {
        monthly: { price: 19.90, title: "Plano Mensal", description: "Renovação automática mensal" },
        semiannual: { price: 99.00, title: "Plano Semestral", description: "6 meses de acesso (R$ 16,50/mês)" },
        annual: { price: 179.00, title: "Plano Anual", description: "12 meses de acesso (R$ 14,92/mês)" }
    };

    const selectedPlan = planData[planId];
    if (!selectedPlan) {
        router.push("/");
        return null;
    }

    const selectedPrice = selectedPlan.price;
    const planName = selectedPlan.title;

    // Cálculo do desconto (25% se oferta ativa)
    const bonusMultiplier = offer.active ? 0.75 : 1;
    const finalPrice = parseFloat((selectedPrice * bonusMultiplier).toFixed(2));
    const discountAmount = parseFloat((selectedPrice - finalPrice).toFixed(2));

    const handlePayment = async () => {
        setProcessing(true);

        try {
            // Chama o backend para criar a Sessão do Stripe
            const response = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    id: planId,
                    title: planName
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erro ao criar sessão de pagamento");
            }

            const data = await response.json();

            // Redireciona para o checkout do Stripe
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("URL de checkout não recebida");
            }
        } catch (error: any) {
            console.error("Erro ao processar pagamento:", error);
            alert(`Erro: ${error.message || "Não foi possível processar o pagamento. Tente novamente."}`);
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col font-sans selection:bg-indigo-500/30">
            {/* Background Ambient Effects */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[100px]" />
            </div>

            <header className="relative z-10 p-6 container mx-auto flex items-center justify-between">
                <Link href="/" className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Voltar para Loja</span>
                </Link>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-medium text-slate-300">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    Ambiente Seguro 256-bit
                </div>
            </header>

            <main className="relative z-10 container mx-auto px-4 pb-20 pt-4 flex-1 flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-16 max-w-6xl">

                {/* Left Column: Order details (The "Receipt") */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 w-full max-w-lg"
                >
                    <div className="mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">Finalizar <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">Upgrade</span></h1>
                        <p className="text-slate-400 text-lg">Você está a um passo de desbloquear o acesso ilimitado.</p>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">{planName}</h3>
                                <p className="text-indigo-400 font-medium">{selectedPlan.description}</p>
                            </div>
                            <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-3 rounded-xl">
                                <Sparkles className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-3 text-slate-300">
                                <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-teal-400" />
                                </div>
                                <span className="font-medium">Jogadas Ilimitadas em todos os jogos</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-300">
                                <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-teal-400" />
                                </div>
                                <span className="font-medium">Sem anúncios ou interrupções</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-300">
                                <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-teal-400" />
                                </div>
                                <span className="font-medium">Suporte prioritário e acesso antecipado</span>
                            </div>
                        </div>

                        {offer.active && discountAmount > 0 && (
                            <div className="flex justify-between items-center bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 mb-6 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                                    <div>
                                        <p className="text-emerald-300 font-bold text-sm">Oferta de Boas-vindas Aplicada!</p>
                                        <p className="text-emerald-500/70 text-xs">Aproveite seus 25% de desconto extra</p>
                                    </div>
                                </div>
                                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-end">
                            <span className="text-slate-400 font-medium pb-2">Total a pagar hoje</span>
                            <div className="text-right">
                                {offer.active && <span className="text-slate-600 line-through text-lg block font-medium">R$ {selectedPrice.toFixed(2).replace('.', ',')}</span>}
                                <span className="text-5xl font-bold text-white tracking-tight">R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-6 opacity-50 grayscale transition-all hover:grayscale-0 hover:opacity-80">
                        {/* Secure Badges (Visual only) */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium uppercase tracking-wider">
                            <Lock className="w-3 h-3" /> Pagamento Seguro via Stripe
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Action Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full lg:w-[420px]"
                >
                    <div className="bg-white rounded-3xl p-1 shadow-2xl">
                        <div className="bg-slate-50 rounded-[20px] p-8 border border-slate-100 h-full flex flex-col">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-indigo-600" />
                                Dados do Pagamento
                            </h3>

                            <div className="space-y-6 flex-1">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Usuário</label>
                                    <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{user?.username || "Carregando..."}</p>
                                            <p className="text-xs text-slate-500">{user?.email || "..."}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="flex -space-x-2">
                                                <div className="w-8 h-5 bg-slate-800 rounded flex items-center justify-center text-[8px] text-white font-bold border border-white">VISA</div>
                                                <div className="w-8 h-5 bg-orange-600 rounded flex items-center justify-center text-[8px] text-white font-bold border border-white">MC</div>
                                            </div>
                                            <span className="text-xs font-bold text-indigo-900">Cartão de Crédito</span>
                                        </div>
                                        <p className="text-xs text-indigo-700/80 leading-relaxed">Liberação imediata. Ambiente criptografado de ponta a ponta.</p>
                                    </div>

                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl relative overflow-hidden">
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-200/50 text-emerald-800 text-[10px] font-bold rounded-full">RECOMENDADO</div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <span className="text-[8px] text-white font-bold">PIX</span>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-900">PIX Instantâneo</span>
                                        </div>
                                        <p className="text-xs text-emerald-700/80 leading-relaxed">Use o QR Code na próxima tela para liberação automática em segundos.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-200">
                                <Button
                                    onClick={handlePayment}
                                    disabled={processing}
                                    className="w-full h-16 text-lg font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                                    {processing ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Processando...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between w-full px-4">
                                            <span>Pagar R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </Button>
                                <p className="text-center text-[10px] text-slate-400 mt-4 leading-tight mx-auto max-w-[200px]">
                                    Ao continuar, você concorda com nossos Termos de Serviço. Garantia de 7 dias ou seu dinheiro de volta.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}>
            <CheckoutContent />
        </Suspense>
    );
}
