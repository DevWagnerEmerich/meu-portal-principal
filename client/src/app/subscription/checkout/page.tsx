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
    const teachersParam = searchParams.get("teachers");

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ username?: string; email?: string } | null>(null);
    const [offer, setOffer] = useState<{ active: boolean; expiresAt: number | null }>({ active: false, expiresAt: null });
    const [processing, setProcessing] = useState(false);

    // Novas states para Checkout Transparente
    const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
    const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string; payment_id: string } | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Fetch user data & check bonus
        fetch(`${API_URL}/api/user-status?t=${Date.now()}`, { credentials: "include", cache: "no-store" })
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

    // Polling effect: Se o PIX foi gerado, checa o status DO PAGAMENTO a cada 5 segundos
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (pixData && pixData.payment_id) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`${API_URL}/api/payment/status/${pixData.payment_id}`, { credentials: "include", cache: "no-store" });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.status === 'approved') {
                            // Se for aprovado, verificamos a url de sucesso dependendo do status inicial do user
                            const isRenewal = user?.subscriptionType && user.subscriptionType !== 'none';
                            const url = isRenewal ? "/subscription/checkout/success?type=renewal" : "/subscription/checkout/success?type=new";
                            router.push(url);
                        }
                    }
                } catch (err) {
                    console.error("Erro no polling do PIX:", err);
                }
            }, 5000); // Check every 5 seconds
        }
        return () => clearInterval(interval);
    }, [pixData, router, user]);

    // Checks for invalid plan and redirects correctly in a useEffect
    useEffect(() => {
        if (!loading) {
            if (!planId) {
                router.push("/");
            } else if (!["monthly", "semiannual", "annual"].includes(planId)) {
                router.push("/");
            }
        }
    }, [planId, loading, router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-white" /></div>;
    }

    if (!planId || (!["monthly", "semiannual", "annual"].includes(planId))) {
        return null;
    }

    // Definição dos planos (sincronizado com BusinessRules do backend)
    const planData: Record<string, { price: number; title: string; description: string }> = {
        monthly: { price: 19.90, title: "Plano Mensal", description: "Renovação automática mensal" },
        semiannual: { price: 99.00, title: "Plano Semestral", description: "6 meses de acesso (R$ 16,50/mês)" },
        annual: { price: 179.00, title: "Plano Anual", description: "12 meses de acesso (R$ 14,92/mês)" }
    };

    const selectedPlan = planData[planId];
    const selectedPrice = selectedPlan.price;
    const planName = selectedPlan.title;

    // Cálculo do desconto (25% se oferta ativa)
    const bonusMultiplier = offer.active ? 0.75 : 1;
    const finalPrice = parseFloat((selectedPrice * bonusMultiplier).toFixed(2));
    const discountAmount = parseFloat((selectedPrice - finalPrice).toFixed(2));

    const handlePayment = async () => {
        setProcessing(true);

        try {
            if (paymentMethod === "card") {
                // FLUXO 1: Cartão -> Redireciona para o Checkout Pro
                const response = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ id: planId, title: planName })
                });

                if (!response.ok) throw new Error((await response.json()).error || "Erro ao criar sessão");

                const data = await response.json();
                if (data.url) window.location.href = data.url;
                else throw new Error("URL de checkout não recebida");
            } else {
                // FLUXO 2: PIX -> Checkout Transparente
                const response = await fetch(`${API_URL}/api/payment/create-pix-payment`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ id: planId, title: planName })
                });

                if (!response.ok) throw new Error((await response.json()).error || "Erro ao gerar PIX");

                const data = await response.json();
                if (data.success && data.qr_code_base64 && data.payment_id) {
                    setPixData({ qr_code: data.qr_code, qr_code_base64: data.qr_code_base64, payment_id: data.payment_id });
                    setProcessing(false);
                    // O polling começará automaticamente por causa do useEffect [pixData]
                } else {
                    throw new Error("Dados do PIX incompletos");
                }
            }
        } catch (error: unknown) {
            console.error("Erro ao processar pagamento:", error);
            const errorMessage = error instanceof Error ? error.message : "Não foi possível processar o pagamento.";
            alert(`Erro: ${errorMessage}`);
            setProcessing(false);
        }
    };

    const handleCopyPix = () => {
        if (pixData?.qr_code) {
            navigator.clipboard.writeText(pixData.qr_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col font-sans selection:bg-indigo-500/30">
            {/* Background Ambient Effects */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[100px]" />
            </div>

            {/* <title>Checkout</title> <meta name="description" content="Checkout process"> <meta property="og:title" content="Checkout"> aria-label */}
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
                            <Lock className="w-3 h-3" /> Processado via Mercado Pago
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
                                <CreditCard className="w-5 h-5 text-sky-600" />
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
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button
                                            onClick={() => setPaymentMethod("pix")}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${paymentMethod === "pix" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                        >
                                            <div className={`w-4 h-4 rounded flex items-center justify-center ${paymentMethod === "pix" ? "bg-emerald-500" : "bg-slate-300"}`}>
                                                <span className="text-[6px] text-white">PIX</span>
                                            </div>
                                            PIX (Recomendado)
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod("card")}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${paymentMethod === "card" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                        >
                                            <CreditCard className={`w-4 h-4 ${paymentMethod === "card" ? "text-sky-600" : "text-slate-400"}`} />
                                            Cartão de Crédito
                                        </button>
                                    </div>

                                    {paymentMethod === "card" && (
                                        <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="flex -space-x-2">
                                                    <div className="w-8 h-5 bg-slate-800 rounded flex items-center justify-center text-[8px] text-white font-bold border border-white">VISA</div>
                                                    <div className="w-8 h-5 bg-orange-600 rounded flex items-center justify-center text-[8px] text-white font-bold border border-white">MC</div>
                                                    <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-[8px] text-white font-bold border border-white">ELO</div>
                                                </div>
                                                <span className="text-xs font-bold text-sky-900">Checkout Seguro</span>
                                            </div>
                                            <p className="text-xs text-sky-700/80 leading-relaxed">Você será redirecionado para o ambiente seguro do Mercado Pago para inserir os dados do cartão.</p>
                                        </div>
                                    )}

                                    {paymentMethod === "pix" && !pixData && (
                                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl relative overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <span className="text-[8px] text-white font-bold">PIX</span>
                                                </div>
                                                <span className="text-xs font-bold text-emerald-900">PIX Instantâneo</span>
                                            </div>
                                            <p className="text-xs text-emerald-700/80 leading-relaxed">Clique em Pagar para gerar o QR Code. A liberação do sistema acontece em tempo real.</p>
                                        </div>
                                    )}

                                    {pixData && paymentMethod === "pix" && (
                                        <div className="flex flex-col items-center justify-center p-6 bg-white border-2 border-emerald-500/20 rounded-2xl shadow-inner animate-in zoom-in-95">
                                            <div className="font-bold text-emerald-800 mb-4 text-center">
                                                Escaneie o QR Code
                                                <p className="text-xs font-normal text-slate-500 mt-1">Aguardando pagamento...</p>
                                            </div>

                                            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 mb-4">
                                                <img
                                                    src={`data:image/jpeg;base64,${pixData.qr_code_base64}`}
                                                    alt="QR Code PIX"
                                                    className="w-48 h-48"
                                                />
                                            </div>

                                            <p className="text-xs text-slate-500 mb-2 font-medium">Ou copie o código abaixo:</p>
                                            <button
                                                onClick={handleCopyPix}
                                                className={`w-full py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2 ${copied ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                            >
                                                {copied ? (
                                                    <><Check className="w-4 h-4" /> Copiado com sucesso!</>
                                                ) : (
                                                    <><Lock className="w-4 h-4" /> Copiar Código PIX</>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(!pixData || paymentMethod === "card") && (
                                <div className="mt-8 pt-6 border-t border-slate-200">
                                    <Button
                                        onClick={handlePayment}
                                        disabled={processing}
                                        className={paymentMethod === "pix"
                                            ? "w-full h-16 text-lg font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                                            : "w-full h-16 text-lg font-bold rounded-xl bg-[#009EE3] hover:bg-[#008CC9] text-white shadow-xl shadow-sky-500/20 hover:shadow-2xl hover:shadow-sky-500/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                                        }
                                    >
                                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-500" />
                                        {processing ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>{paymentMethod === "pix" ? "Gerando PIX..." : "Processando..."}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between w-full px-4">
                                                <span>{paymentMethod === "pix" ? "Gerar PIX de R$" : "Pagar R$"} {finalPrice.toFixed(2).replace('.', ',')}</span>
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        )}
                                    </Button>
                                    <p className="text-center text-[10px] text-slate-400 mt-4 leading-tight mx-auto max-w-[200px]">
                                        {paymentMethod === "pix"
                                            ? "Você não sairá desta página. A liberação é feita aqui mesmo."
                                            : "Ao continuar, você será redirecionado para o ambiente seguro do Mercado Pago."
                                        }
                                    </p>
                                </div>
                            )}
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
