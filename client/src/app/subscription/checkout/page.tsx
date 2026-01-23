"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Loader2, Sparkles, CreditCard } from "lucide-react";
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
        <div className="min-h-screen bg-slate-950 flex flex-col">
            <header className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" className="text-slate-400 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Cancelar
                        </Button>
                    </Link>
                    <h1 className="text-white font-bold text-lg">Checkout Seguro</h1>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 max-w-5xl">
                {/* Resumo do Pedido */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 space-y-6"
                >
                    <h2 className="text-2xl font-bold text-white">Resumo do Pedido</h2>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                        <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{planName}</h3>
                                <p className="text-slate-400 text-sm">{selectedPlan.description}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded">Jogadas Ilimitadas</span>
                                    {planId !== 'monthly' && <span className="text-xs bg-teal-500/10 text-teal-400 px-2 py-1 rounded">Acesso Antecipado</span>}
                                    <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">Sem Anúncios</span>
                                </div>
                            </div>
                            <div className="text-right">
                                {offer.active && <span className="text-slate-500 line-through text-sm block">R$ {selectedPrice.toFixed(2).replace('.', ',')}</span>}
                            </div>
                        </div>

                        {offer.active && discountAmount > 0 && (
                            <div className="flex justify-between items-center bg-green-500/10 p-3 rounded-lg border border-green-500/20 mb-4 animate-pulse">
                                <div className="flex items-center gap-2 text-green-400">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="font-bold text-sm">Bônus de Boas-vindas (25% OFF)</span>
                                </div>
                                <span className="text-green-400 font-bold">- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <span className="text-lg text-slate-300">Total a pagar:</span>
                            <span className="text-3xl font-bold text-white">R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
                        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Pagamento 100% Seguro
                        </h4>
                        <p className="text-slate-400 text-sm mb-4">Processado com segurança pelo Stripe</p>

                        {/* Destaque PIX */}
                        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold text-sm">
                                    PIX
                                </div>
                                <div>
                                    <p className="text-green-400 font-bold text-sm">Pagamento Instantâneo</p>
                                    <p className="text-green-300 text-xs">Aprovação em segundos</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 items-center">
                            <div className="bg-slate-800 px-3 py-2 rounded text-xs text-slate-300 flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                Cartão
                            </div>
                            <div className="bg-slate-800 px-3 py-2 rounded text-xs text-slate-300">Boleto</div>
                        </div>
                    </div>
                </motion.div>

                {/* Card de Pagamento */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full md:w-96 bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-2xl h-fit"
                >
                    <h3 className="text-xl font-bold mb-6 text-slate-900">Finalizar Compra</h3>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Usuário:</span>
                            <span className="font-medium text-slate-900">{user?.username}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Plano:</span>
                            <span className="font-medium text-slate-900">{planName}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-4 flex justify-between font-bold text-lg">
                            <span className="text-slate-900">Total:</span>
                            <span className="text-green-600">R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>

                    <Button
                        onClick={handlePayment}
                        disabled={processing}
                        className="w-full h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Redirecionando...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5 mr-2" />
                                Pagar com PIX, Cartão ou Boleto
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-slate-500 mt-4">
                        🔒 Pagamento processado com segurança pelo Stripe<br />
                        <span className="text-green-600 font-medium">✨ PIX: Aprovação instantânea!</span>
                    </p>
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
