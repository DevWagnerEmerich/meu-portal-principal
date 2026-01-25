"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component
import { Check, Sparkles, Zap, Shield, Star, Crown } from "lucide-react";
import { API_URL } from "@/lib/config";
import { motion } from "framer-motion";

export default function SubscriptionPage() {
    const router = useRouter();
    const [offer, setOffer] = useState<{ active: boolean; expiresAt: number | null }>({ active: false, expiresAt: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user status to check for welcome offer
        fetch(`${API_URL}/api/user-status`, { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (data.welcomeOffer) {
                    setOffer(data.welcomeOffer);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const plans = [
        {
            id: 'monthly',
            title: 'Mensal',
            price: 19.90,
            period: '/mês',
            description: 'Flexibilidade total para você',
            features: [
                'Acesso ilimitado a todos os jogos',
                'Sem anúncios',
                'Suporte por e-mail'
            ],
            icon: Zap,
            color: 'teal',
            popular: false
        },
        {
            id: 'semiannual',
            title: 'Semestral',
            price: 99.00,
            period: '/6 meses',
            pricePerMonth: '16,50',
            description: 'Perfeito para jogar sem preocupações',
            features: [
                'Tudo do plano Mensal',
                'Suporte Prioritário',
                'Acesso Antecipado a novos jogos',
                'Economize 17%'
            ],
            icon: Star,
            color: 'indigo',
            popular: true
        },
        {
            id: 'annual',
            title: 'Anual',
            price: 179.00,
            period: '/ano',
            pricePerMonth: '14,91',
            description: 'Melhor valor. Acesso VIP o ano todo.',
            features: [
                'Todos os benefícios VIP',
                'Distintivo exclusivo no perfil',
                'Desconto de 25% vs Mensal',
                'Prioridade máxima em novidades'
            ],
            icon: Crown,
            color: 'amber',
            popular: false
        }
    ];

    const calculatePrice = (price: number) => {
        if (!offer.active) return price;
        return (price * 0.75); // 25% discount
    };

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-20 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Seja Premium</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-white tracking-tight"
                    >
                        Desbloqueie todo o potencial do <span className="text-teal-400">Educatech</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-400"
                    >
                        Jogue sem limites, sem anúncios e com benefícios exclusivos.
                        Cancele quando quiser.
                    </motion.p>
                </div>

                {offer.active && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md mx-auto mb-12 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-4 text-center"
                    >
                        <p className="font-bold text-emerald-400 flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5 fill-current" />
                            Oferta de Boas-vindas Ativa!
                        </p>
                        <p className="text-sm text-emerald-200/80">
                            Aproveite 25% de desconto extra em qualquer plano hoje.
                        </p>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => {
                        const finalPrice = calculatePrice(plan.price);
                        const isDiscounted = offer.active;

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * (index + 1) }}
                                className={`relative group rounded-3xl p-8 border hover:border-opacity-100 transition-all duration-300 flex flex-col
                                    ${plan.popular
                                        ? 'bg-slate-900/80 border-indigo-500 ring-2 ring-indigo-500/20'
                                        : 'bg-slate-950/50 border-slate-800'
                                    }
                                `}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-indigo-500/20">
                                        MAIS POPULAR
                                    </div>
                                )}

                                <div className="mb-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 
                                        ${plan.color === 'teal' ? 'bg-teal-500/10 text-teal-400' :
                                            plan.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400' :
                                                'bg-amber-500/10 text-amber-400'}`}
                                    >
                                        <plan.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{plan.title}</h3>
                                    <p className="text-slate-400 text-sm h-10">{plan.description}</p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-end gap-1 mb-1">
                                        {isDiscounted && (
                                            <span className="text-slate-500 line-through text-sm mb-1 mr-2">
                                                R$ {plan.price.toFixed(2).replace('.', ',')}
                                            </span>
                                        )}
                                        <span className="text-4xl font-bold text-white">
                                            R$ {finalPrice.toFixed(2).replace('.', ',')}
                                        </span>
                                        <span className="text-slate-500 mb-1">{plan.period}</span>
                                    </div>
                                    {plan.pricePerMonth && (
                                        <p className="text-xs text-indigo-400 font-medium">Equivalente a R$ {plan.pricePerMonth}/mês</p>
                                    )}
                                </div>

                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                                <Check className="w-3 h-3 text-teal-400" />
                                            </div>
                                            <span className="text-slate-300 text-sm leading-tight">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => router.push(`/subscription/checkout?plan=${plan.id}`)}
                                    className={`w-full py-6 font-bold text-lg transition-all duration-300
                                        ${plan.popular
                                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                                            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                                        }
                                    `}
                                >
                                    Escolher {plan.title}
                                </Button>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
                        <Shield className="w-4 h-4" />
                        Pagamento 100% seguro via Mercado Pago. Cancele a qualquer momento.
                    </p>
                </div>
            </div>
        </div>
    );
}
