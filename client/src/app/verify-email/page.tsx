"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { API_URL } from "@/lib/config";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Link de confirmação inválido ou ausente.");
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch(`${API_URL}/api/confirm-email?token=${token}`);
                if (res.ok) {
                    setStatus("success");
                } else {
                    setStatus("error");
                    setMessage("O link expirou ou já foi utilizado.");
                }
            } catch (err) {
                setStatus("error");
                setMessage("Erro ao conectar com o servidor.");
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center relative shadow-inner">
                    {status === "loading" && <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />}
                    {status === "success" && <CheckCircle2 className="w-10 h-10 text-emerald-500" />}
                    {status === "error" && <XCircle className="w-10 h-10 text-red-500" />}
                </div>
            </div>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                    {status === "loading" && "Validando seu E-mail..."}
                    {status === "success" && "E-mail Confirmado!"}
                    {status === "error" && "Ops! Algo deu errado"}
                </h1>
                <p className="text-slate-400">
                    {status === "loading" && "Aguarde um instante enquanto verificamos seu token."}
                    {status === "success" && "Sua conta foi ativada. Agora você tem acesso total ao BrincaBytes!"}
                    {status === "error" && message}
                </p>
            </div>

            {status !== "loading" && (
                <div className="pt-4">
                    <Link href="/login" className="block w-full">
                        <Button className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold h-12">
                            Ir para o Login
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Suspense fallback={
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl flex items-center gap-3">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-white font-medium">Carregando...</span>
                </div>
            }>
                <VerifyEmailContent />
            </Suspense>
        </main>
    );
}
