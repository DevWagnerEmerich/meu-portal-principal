"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_URL } from "@/lib/config";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus("error");
            setMessage("As senhas não coincidem.");
            return;
        }

        setStatus("loading");
        try {
            const res = await fetch(`${API_URL}/api/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("success");
            } else {
                setStatus("error");
                setMessage(data.message || "Erro ao redefinir senha. O link pode estar expirado.");
            }
        } catch (err) {
            setStatus("error");
            setMessage("Erro ao conectar com o servidor.");
        }
    };

    if (status === "success") {
        return (
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Senha Redefinida!</h1>
                    <p className="text-slate-400">Sua senha foi atualizada com sucesso. Você já pode fazer login.</p>
                </div>
                <Button
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold h-12"
                    onClick={() => router.push("/login")}
                >
                    Ir para o Login
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-8">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-700">
                    <Lock className="w-8 h-8 text-teal-400" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Nova Senha</h1>
                <p className="text-slate-400">Escolha uma senha forte para sua conta.</p>
            </div>

            {status === "error" && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{message}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Nova Senha</label>
                        <Input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-slate-950 border-slate-800 h-12"
                            minLength={6}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Confirmar Senha</label>
                        <Input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-slate-950 border-slate-800 h-12"
                            minLength={6}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold h-12 text-lg shadow-lg shadow-teal-600/20"
                    disabled={status === "loading" || !token}
                >
                    {status === "loading" ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            Redefinindo...
                        </>
                    ) : "Salvar Nova Senha"}
                </Button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Suspense fallback={
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl flex items-center gap-3">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-white font-medium">Carregando...</span>
                </div>
            }>
                <ResetPasswordContent />
            </Suspense>
        </main>
    );
}
