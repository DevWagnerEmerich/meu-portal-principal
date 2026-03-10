"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

export function TrialFloatingBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(true); // Default to true until checked
    const [user, setUser] = useState<{ loggedIn: boolean; subscriptionType?: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Hydrate dismissal state from sessionStorage
        const saved = sessionStorage.getItem("trial-banner-dismissed");
        if (saved !== "true") {
            setIsDismissed(false);
        }
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch(`${API_URL}/api/user-status`, {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                }
            } catch (err) {
                console.error("Failed to fetch user status", err);
            }
        };

        checkAuth();

        // Listen for user updates (login/logout)
        window.addEventListener("user-updated", checkAuth);
        return () => window.removeEventListener("user-updated", checkAuth);
    }, []);

    useEffect(() => {
        // Only show if user is logged in, not a VIP, and hasn't dismissed it in this session
        if (user?.loggedIn && user?.subscriptionType === 'none' && !isDismissed) {
            const timer = setTimeout(() => setIsVisible(true), 1500); // Slight delay for better UX
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [user, isDismissed]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => {
            setIsDismissed(true);
            sessionStorage.setItem("trial-banner-dismissed", "true");
        }, 500);
    };

    const handleAction = () => {
        router.push("/subscription");
    };

    if (!user?.loggedIn) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    className="fixed bottom-6 left-4 right-4 md:left-auto md:right-8 z-[100] md:max-w-2xl w-auto overflow-visible"
                >
                    <div className="relative bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(79,70,229,0.2)]">
                        {/* Close Button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-20"
                            aria-label="Fechar"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg transform -rotate-3 border border-slate-200">
                            <CreditCard className="w-8 h-8 text-indigo-600" />
                        </div>

                        <div className="text-center md:text-left space-y-1 pr-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2 justify-center md:justify-start">
                                <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
                                1 Mês Inteiramente Grátis
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                                Comece agora e aproveite 30 dias de acesso <span className="text-indigo-400 font-bold">VIP Premium</span> sem pagar nada. Cancele quando quiser.
                            </p>
                        </div>

                        <Button
                            onClick={handleAction}
                            className="w-full md:w-auto md:ml-auto bg-white hover:bg-slate-100 text-indigo-600 font-bold px-8 h-12 rounded-xl whitespace-nowrap shadow-xl shadow-indigo-500/10"
                        >
                            Aproveitar 30 Dias Grátis
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
