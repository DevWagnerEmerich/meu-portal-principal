"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, XCircle, HelpCircle, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export type ModalType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    description: string;
    type?: ModalType;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
}

export function ActionModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    type = 'info',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    loading = false
}: ActionModalProps) {
    const icons = {
        info: <Info className="w-6 h-6 text-blue-400" />,
        success: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
        warning: <AlertCircle className="w-6 h-6 text-amber-400" />,
        error: <XCircle className="w-6 h-6 text-red-400" />,
        confirm: <HelpCircle className="w-6 h-6 text-indigo-400" />,
    };

    const colors = {
        info: "border-blue-500/30 bg-blue-500/10",
        success: "border-emerald-500/30 bg-emerald-500/10",
        warning: "border-amber-500/30 bg-amber-500/10",
        error: "border-red-500/30 bg-red-500/10",
        confirm: "border-indigo-500/30 bg-indigo-500/10",
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={loading ? undefined : onClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden z-10"
                    >
                        {!loading && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        <div className="text-center space-y-4">
                            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mx-auto border-2 shadow-lg", colors[type])}>
                                {icons[type]}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {description}
                                </p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                {type === 'confirm' ? (
                                    <>
                                        <Button
                                            variant="ghost"
                                            onClick={onClose}
                                            className="flex-1 text-slate-400 hover:text-white border border-transparent hover:border-slate-800"
                                            disabled={loading}
                                        >
                                            {cancelText}
                                        </Button>
                                        <Button
                                            onClick={onConfirm}
                                            className="flex-[1.5] bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Processando
                                                </div>
                                            ) : confirmText}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={onClose}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold"
                                        disabled={loading}
                                    >
                                        Entendido
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Premium Bottom Accent */}
                        <div className={cn("absolute bottom-0 left-0 w-full h-1 opacity-50",
                            type === 'confirm' ? "bg-indigo-500" :
                                type === 'success' ? "bg-emerald-500" :
                                    type === 'error' ? "bg-red-500" :
                                        type === 'warning' ? "bg-amber-500" : "bg-blue-500"
                        )} />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
