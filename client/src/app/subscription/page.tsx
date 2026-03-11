"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Shield, Users, ArrowRight, Building2, BookOpen, Mail, Phone, Loader2, CheckCircle2, User, GraduationCap, Crown, CreditCard } from "lucide-react";
import { API_URL } from "@/lib/config";
import { motion, AnimatePresence } from "framer-motion";
import { ActionModal, ModalType } from "@/components/ui/ActionModal";

interface Plan {
    id: string;
    title: string;
    price: number;
    original_price?: number;
    duration_days: number;
    features: string[];
}

export default function SubscriptionPage() {
    const router = useRouter();
    const [offer, setOffer] = useState<{ active: boolean; expiresAt: number | null }>({ active: false, expiresAt: null });
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState("");
    const [activeTab, setActiveTab] = useState<'teacher' | 'school'>('teacher');

    useEffect(() => {
        if (offer.active && offer.expiresAt) {
            const interval = setInterval(() => {
                const now = Date.now();
                const diff = (offer.expiresAt as number) - now;
                if (diff <= 0) {
                    setTimeLeft("Expirada");
                    setOffer(prev => ({ ...prev, active: false }));
                    clearInterval(interval);
                } else {
                    const h = Math.floor(diff / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);
                    setTimeLeft(`${h}h ${m}m ${s}s`);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [offer]);

    // Configurações e Planos Individuais (Teacher)
    const [plans, setPlans] = useState<Record<string, Plan>>({});

    // B2B Lead Form State
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        schoolName: "",
        contactName: "",
        contactEmail: "",
        contactPhone: ""
    });

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        type: ModalType;
    }>({
        isOpen: false,
        title: "",
        description: "",
        type: "info"
    });

    // Novo State B2B
    const [teacherCount, setTeacherCount] = useState(5);
    const BASE_FEE = 149.90; // Taxa plataforma base (até 5 professores)
    const COST_PER_ADDITIONAL_TEACHER = 19.90;

    useEffect(() => {
        // Fetch User Status (Offer) and Plans
        Promise.all([
            fetch(`${API_URL}/api/user-status?t=${Date.now()}`, { credentials: "include", cache: "no-store" }).then(res => res.json()),
            fetch(`${API_URL}/api/payment/plans?t=${Date.now()}`, { credentials: "include", cache: "no-store" }).then(res => res.json())
        ])
            .then(([statusData, plansData]) => {
                if (statusData.welcomeOffer) setOffer(statusData.welcomeOffer);
                if (plansData.plans) setPlans(plansData.plans);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // Calcula o preço final da escola
    const calculateSchoolPrice = () => {
        let price = BASE_FEE;
        if (teacherCount > 5) {
            price += (teacherCount - 5) * COST_PER_ADDITIONAL_TEACHER;
        }

        // Aplica o desconto de oferta se existir
        if (offer.active) {
            return price * 0.75;
        }
        return price;
    };

    const finalPrice = calculateSchoolPrice();

    const handleOpenQuoteModal = () => {
        setIsQuoteModalOpen(true);
        setIsSuccess(false);
    };

    const handleCloseModal = () => {
        setIsQuoteModalOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/api/contact/school-quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    teacherCount
                })
            });

            if (response.ok) {
                setIsSuccess(true);
            } else {
                const data = await response.json();
                setModalConfig({
                    isOpen: true,
                    title: "Erro na Solicitação",
                    description: data.message || 'Falha ao enviar a solicitação. Por favor, tente novamente.',
                    type: "error"
                });
            }
        } catch (error) {
            console.error('Erro ao enviar form:', error);
            setModalConfig({
                isOpen: true,
                title: "Erro de Conexão",
                description: 'Não foi possível conectar ao servidor. Verifique sua internet.',
                type: "error"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubscribeTeacher = (planId: string) => {
        router.push(`/subscription/checkout?plan=${planId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 pt-24 pb-20 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-20 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium"
                    >
                        {activeTab === 'school' ? (
                            <><Building2 className="w-4 h-4" /><span className="ml-2">BrincaBytes para Escolas</span></>
                        ) : (
                            <><Crown className="w-4 h-4" /><span className="ml-2">BrincaBytes Premium</span></>
                        )}
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-white tracking-tight"
                    >
                        Planos flexíveis que crescem com <span className="text-teal-400">{activeTab === 'school' ? 'sua Instituição' : 'Você'}</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-400"
                    >
                        Ferramentas exclusivas para professores engajarem alunos.
                        Alunos são e sempre serão gratuitos.
                    </motion.p>
                </div>

                {offer.active && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md mx-auto mb-10 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-4 text-center shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50"></div>
                        <div className="flex flex-col items-center gap-1">
                            <p className="font-bold text-emerald-400 flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                                <Sparkles className="w-4 h-4 fill-current animate-pulse" />
                                Oferta de Boas-Vindas
                            </p>
                            <p className="text-white font-medium">Garanta 25% de desconto vitalício!</p>
                            <div className="mt-2 text-emerald-300 text-xs font-bold flex items-center gap-2 bg-emerald-900/40 px-3 py-1.5 rounded-full border border-emerald-800/50">
                                ⏳ Expira em: <span className="font-mono text-[14px] text-white tracking-widest">{timeLeft || "Calculando..."}</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* TABS CONTROLLER */}
                <div className="flex justify-center mb-16">
                    <div className="bg-slate-900 border border-slate-700 rounded-full p-2 flex items-center relative w-full max-w-md shadow-2xl">
                        {/* Tab Indicator */}
                        <div
                            className={`absolute inset-y-2 left-2 w-[calc(50%-0.5rem)] rounded-full bg-indigo-600 transition-transform duration-300 ease-in-out ${activeTab === 'school' ? 'translate-x-full' : ''}`}
                        />

                        <button
                            onClick={() => setActiveTab('teacher')}
                            className={`flex-[1] relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-full transition-colors ${activeTab === 'teacher' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <GraduationCap className="w-4 h-4" /> Para Professores
                        </button>
                        <button
                            onClick={() => setActiveTab('school')}
                            className={`flex-[1] relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-full transition-colors ${activeTab === 'school' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Building2 className="w-4 h-4" /> Para Escolas
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* FLOW: INDIVIDUAL TEACHER */}
                    {activeTab === 'teacher' && (
                        <motion.div
                            key="tab-teacher"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="max-w-6xl mx-auto space-y-12 pt-8"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Rendendo dinamicamente os 3 planos caso a API tenha retornado */}
                                {Object.entries(plans).map(([key, plan]) => {
                                    const isPopular = key === 'semiannual';
                                    const isTrialPlan = key === 'monthly';
                                    return (
                                        <div
                                            key={key}
                                            className={`relative bg-slate-900 border rounded-3xl p-8 shadow-xl flex flex-col transition-transform hover:-translate-y-2 ${isPopular ? 'border-indigo-500 shadow-indigo-500/20' : isTrialPlan ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-slate-800'}`}
                                        >
                                            {isPopular && (
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                                                    Mais Popular
                                                </div>
                                            )}
                                            {isTrialPlan && (
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                                                    <Sparkles className="w-3 h-3 fill-current" /> 1 Mês Grátis
                                                </div>
                                            )}
                                            <div className="text-center mb-6">
                                                <h3 className="text-xl font-bold text-white mb-2">{plan.title}</h3>

                                                {plan.original_price && plan.original_price > plan.price ? (
                                                    <div className="mb-1 flex items-center justify-center gap-2">
                                                        <span className="text-slate-500 line-through text-lg decoration-red-500/50">De R$ {plan.original_price.toFixed(2).replace('.', ',')}</span>
                                                        <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">-25% OFF</span>
                                                    </div>
                                                ) : (
                                                    <div className="h-[28px] mb-1"></div>
                                                )}

                                                <div className="flex items-center justify-center gap-1">
                                                    <span className="text-slate-400 font-medium align-top mt-2">
                                                        {plan.original_price && plan.original_price > plan.price ? "Por R$" : "R$"}
                                                    </span>
                                                    <span className="text-5xl font-black text-white">{plan.price.toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                <p className="text-slate-500 text-sm mt-2">cobrado a cada {plan.duration_days} dias</p>
                                            </div>

                                            <div className="space-y-4 flex-1 mb-8">
                                                {plan.features.map((feature, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <Check className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                                                        <span className="text-slate-300 text-sm">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <Button
                                                onClick={() => handleSubscribeTeacher(key)}
                                                className={`w-full h-12 text-base font-bold transition-all ${isPopular ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
                                            >
                                                Assinar {plan.title}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* FLOW: B2B INSTITUTIONAL */}
                    {activeTab === 'school' && (
                        <motion.div
                            key="tab-school"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="max-w-5xl mx-auto flex flex-col lg:flex-row shadow-2xl rounded-3xl border border-slate-800"
                        >
                            {/* Left side: Calculator */}
                            <div className="bg-slate-900 border border-slate-800 rounded-t-3xl lg:rounded-l-3xl lg:rounded-tr-none p-8 md:p-12 h-full flex flex-col justify-center relative z-10 shadow-2xl flex-1">
                                <h3 className="text-2xl font-bold text-white mb-2">Tamanho da Equipe</h3>
                                <p className="text-slate-400 mb-8">Quantos professores usarão a plataforma?</p>

                                <div className="mb-12">
                                    <div className="flex justify-between text-sm font-medium text-slate-400 mb-4">
                                        <span>Apenas 1</span>
                                        <span className="text-white text-lg font-bold">{teacherCount} {teacherCount === 1 ? 'Professor' : 'Professores'}</span>
                                        <span>50+</span>
                                    </div>

                                    {/* Custom Range Slider */}
                                    <div className="relative w-full h-4 bg-slate-800 rounded-full">
                                        <input
                                            type="range"
                                            min="1"
                                            max="50"
                                            value={teacherCount}
                                            onChange={(e) => setTeacherCount(parseInt(e.target.value))}
                                            className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                                        />
                                        <div
                                            className="absolute h-full bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full z-10 transition-all duration-150"
                                            style={{ width: `${(teacherCount / 50) * 100}%` }}
                                        ></div>
                                        {/* Slider Thumb Visuals */}
                                        <div
                                            className="absolute top-1/2 -mt-3 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-indigo-500 z-10 transition-all duration-150 transform -translate-x-1/2 pointer-events-none"
                                            style={{ left: `${(teacherCount / 50) * 100}%` }}
                                        ></div>
                                    </div>

                                    <p className="text-xs text-slate-500 mt-6 text-center">
                                        * Planos acima de 50 professores possuem pacotes empresariais customizados. <br />Entre em contato com o suporte.
                                    </p>
                                </div>
                            </div>

                            {/* Right side: Price Display */}
                            <div className="bg-gradient-to-b from-indigo-900/50 to-slate-900 border-l border-indigo-500/20 rounded-b-3xl lg:rounded-r-3xl lg:rounded-bl-none p-8 md:p-12 relative z-0 flex flex-col shadow-2xl flex-1">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                                        <Users className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Plano Educacional</h3>
                                </div>

                                <div className="mb-8">
                                    <h4 className="text-3xl font-black text-white tracking-tight leading-tight">Média R$ {(finalPrice / teacherCount).toFixed(2).replace('.', ',')} /prof</h4>
                                    <p className="text-slate-400 mt-3 font-medium">Alunos ilimitados inclusos independente do número de professores.</p>
                                </div>

                                <div className="space-y-4 mb-8 flex-1">
                                    <div className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                                        <span className="text-slate-300">Acesso a todos os jogos Premium</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                                        <span className="text-slate-300">Painel administrativo para professores</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                                        <span className="text-slate-300"><span className="text-white font-bold">{teacherCount}</span> licenças de educador ativas</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <BookOpen className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                                        <span className="text-slate-300">Material de apoio pedagógico</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleOpenQuoteModal}
                                    size="lg"
                                    className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] transition-all"
                                >
                                    Solicitar Atendimento Especial
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                                <p className="text-center text-xs text-slate-500 mt-4">
                                    Sem compromisso. Entraremos em contato com a melhor proposta.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-20 text-center border-t border-slate-800 pt-10">
                    <p className="text-slate-400 text-sm max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
                        <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400" /> Transação segura</span>
                        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Relatórios (Em breve)</span>
                        <span className="flex items-center gap-2"><Users className="w-4 h-4 text-emerald-400" /> Treinamento incluso</span>
                    </p>
                </div>
            </div>

            {/* Lead Generation Modal overlay */}
            <AnimatePresence>
                {isQuoteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                            onClick={handleCloseModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl p-6 overflow-hidden z-10"
                        >
                            {!isSuccess ? (
                                <>
                                    <div className="text-center mb-6">
                                        <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                                            <Building2 className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Plano para Escolas</h3>
                                        <p className="text-slate-400 text-sm">
                                            Preencha os dados abaixo para que nossa equipe monte a proposta ideal para os seus <strong className="text-indigo-400">{teacherCount} professores</strong>.
                                        </p>
                                    </div>

                                    <form onSubmit={handleFormSubmit} className="space-y-4">
                                        <div>
                                            <label htmlFor="schoolName" className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Nome da Instituição</label>
                                            <div className="relative">
                                                <Building2 className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    id="schoolName"
                                                    type="text" required name="schoolName" value={formData.schoolName} onChange={handleInputChange}
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                                    placeholder="Sua Escola ou Colégio"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="contactName" className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Nome do Responsável</label>
                                            <div className="relative">
                                                <User className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    id="contactName"
                                                    type="text" required name="contactName" value={formData.contactName} onChange={handleInputChange}
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                                    placeholder="Coordenador ou Diretor"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="contactEmail" className="text-xs font-semibold text-slate-400 uppercase mb-1 block">E-mail</label>
                                                <div className="relative">
                                                    <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                                    <input
                                                        id="contactEmail"
                                                        type="email" required name="contactEmail" value={formData.contactEmail} onChange={handleInputChange}
                                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                                        placeholder="contato@..."
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label htmlFor="contactPhone" className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Telefone / WhatsApp</label>
                                                <div className="relative">
                                                    <Phone className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                                    <input
                                                        id="contactPhone"
                                                        type="tel" required name="contactPhone" value={formData.contactPhone} onChange={handleInputChange}
                                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                                        placeholder="(00) 00000-0000"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex gap-3">
                                            <Button type="button" variant="ghost" onClick={handleCloseModal} className="flex-1 text-slate-400 hover:text-white" disabled={isSubmitting}>
                                                Cancelar
                                            </Button>
                                            <Button type="submit" className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" disabled={isSubmitting}>
                                                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : "Solicitar Contato"}
                                            </Button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Solicitação Enviada!</h3>
                                    <p className="text-slate-400 text-sm mb-6 max-w-[280px] mx-auto">
                                        Nossa equipe recebeu os dados de {formData.schoolName} e entrará em contato em breve no número fornecido.
                                    </p>
                                    <Button onClick={handleCloseModal} className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                                        Fechar Janela
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ActionModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                description={modalConfig.description}
                type={modalConfig.type}
            />
        </div>
    );
}
