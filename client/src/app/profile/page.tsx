"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Loader2, User, Calendar, Shield, Clock, LogOut, CreditCard } from "lucide-react";
import { ActionModal, ModalType } from "@/components/ui/ActionModal";

interface UserProfile {
    username: string;
    email: string;
    subscription_type: string;
    subscription_end_date: number | null;
    subscription_status: string | null;
    mp_preapproval_id: string | null;
    grace_period_ends_at: number | null;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        type: ModalType;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: "",
        description: "",
        type: "info"
    });
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_URL}/api/profile`, {
                    credentials: "include"
                });

                if (res.status === 401) {
                    router.push("/login");
                    return;
                }

                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/api/logout`, {
                method: "POST",
                credentials: "include"
            });
            window.location.href = "/";
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    const handleCancelSubscription = async () => {
        setModalConfig({
            isOpen: true,
            title: "Cancelar Assinatura?",
            description: "Tem certeza que deseja cancelar sua assinatura recorrente? Seu acesso VIP será mantido até o final do período que você já pagou.",
            type: "confirm",
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                setCancelLoading(true);
                try {
                    const res = await fetch(`${API_URL}/api/payment/cancel-subscription`, {
                        method: 'POST',
                        credentials: 'include'
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erro ao cancelar');

                    setProfile(prev => prev ? {
                        ...prev,
                        subscription_type: 'none',
                        subscription_end_date: null,
                        subscription_status: 'canceled',
                        mp_preapproval_id: null,
                        grace_period_ends_at: null
                    } : prev);

                    setModalConfig({
                        isOpen: true,
                        title: "Cancelado!",
                        description: "Sua assinatura foi cancelada com sucesso. Você não receberá novas cobranças.",
                        type: "success"
                    });
                } catch (err: any) {
                    setModalConfig({
                        isOpen: true,
                        title: "Erro no Cancelamento",
                        description: `Não foi possível processar o cancelamento: ${err.message}`,
                        type: "error"
                    });
                } finally {
                    setCancelLoading(false);
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                Erro ao carregar perfil.
            </div>
        );
    }

    const isVip = profile.subscription_type !== 'none';
    const planName = {
        'monthly': 'Plano Mensal',
        'semiannual': 'Plano Semestral',
        'annual': 'Plano Anual',
        'none': 'Gratuito'
    }[profile.subscription_type] || profile.subscription_type;

    const formatDate = (timestamp: number | null) => {
        if (!timestamp) return 'N/A';
        return new Date(Number(timestamp)).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    // Calculate days remaining
    const getDaysRemaining = () => {
        if (!profile.subscription_end_date) return 0;
        const now = new Date().getTime();
        const diff = Number(profile.subscription_end_date) - now;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const daysRemaining = getDaysRemaining();

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Meu Perfil</h1>
                        <p className="text-slate-400">Gerencie suas informações e assinatura</p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-transparent hover:border-red-500/30"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sair
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Personal Info Card */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-teal-400" />
                            <h2 className="text-lg font-semibold text-white">Dados Pessoais</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-400">Nome de Usuário</label>
                                <p className="text-lg text-white font-medium">{profile.username}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-400">E-mail</label>
                                <p className="text-lg text-white font-medium">{profile.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Card */}
                    <div className={`rounded-xl border relative overflow-hidden p-6 space-y-6 ${isVip ? 'bg-slate-900/50 border-amber-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
                        {isVip && (
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        )}

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                                <Shield className={`w-5 h-5 ${isVip ? 'text-amber-400' : 'text-slate-400'}`} />
                                <h2 className="text-lg font-semibold text-white">Assinatura</h2>
                            </div>
                            {isVip ? (
                                <span className="inline-flex items-center rounded-full border border-amber-500/50 px-2.5 py-0.5 text-xs font-semibold text-amber-400 bg-amber-500/20">
                                    VIP ATIVO
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full border border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-400 bg-slate-800">
                                    GRATUITO
                                </span>
                            )}
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="text-sm font-medium text-slate-400">Plano Atual</label>
                                <p className="text-xl text-white font-bold">{planName}</p>
                            </div>

                            {isVip ? (
                                <div className="space-y-4">
                                    {/* Alerta de carência (past_due) */}
                                    {profile.subscription_status === 'past_due' && profile.grace_period_ends_at && (
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-950/50 border border-red-500/30">
                                            <span className="text-red-400 text-lg">⚠️</span>
                                            <div>
                                                <p className="text-sm font-semibold text-red-400">Pagamento recusado</p>
                                                <p className="text-xs text-red-400/70 mt-0.5">
                                                    Seu acesso expira em {formatDate(profile.grace_period_ends_at)}. Atualize seu cartão para continuar.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                                        <Calendar className="w-8 h-8 text-slate-400" />
                                        <div>
                                            <p className="text-sm text-slate-400">Expira em</p>
                                            <p className="text-white font-medium">
                                                {formatDate(profile.subscription_end_date)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-amber-400/80">
                                        <Clock className="w-4 h-4" />
                                        <span>Restam {daysRemaining} dias de acesso premium</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800 text-center space-y-3">
                                    <p className="text-slate-300">Faça o upgrade para desbloquear todos os jogos e remover limites!</p>
                                </div>
                            )}
                        </div>

                        <div className="relative z-10 pt-2 space-y-3">
                            {!isVip ? (
                                <Button
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-orange-500/20"
                                    onClick={() => router.push('/subscription')}
                                >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Virar VIP Agora
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                                    onClick={() => router.push('/subscription')}
                                >
                                    Gerenciar / Renovar
                                </Button>
                            )}
                            {/* Botão cancelar assinatura recorrente */}
                            {profile.mp_preapproval_id && (
                                <Button
                                    variant="ghost"
                                    disabled={cancelLoading}
                                    onClick={handleCancelSubscription}
                                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-sm"
                                >
                                    {cancelLoading ? 'Cancelando...' : '✕ Cancelar Assinatura'}
                                </Button>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <ActionModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                description={modalConfig.description}
                type={modalConfig.type}
                loading={cancelLoading}
                confirmText="Sim, Cancelar"
                cancelText="Voltar"
            />
        </div>
    );
}
