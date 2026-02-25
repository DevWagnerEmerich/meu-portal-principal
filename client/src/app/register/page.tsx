"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { API_URL } from "@/lib/config";



export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Estados do formulário
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Se houver erros de validação (array), pega o primeiro msg
                if (data.errors && Array.isArray(data.errors)) {
                    throw new Error(data.errors[0].msg);
                }
                throw new Error(data.message || "Erro ao criar conta");
            }

            // Sucesso!
            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Ocorreu um erro desconhecido");
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
                    <h2 className="text-3xl font-bold text-green-400 mb-4">Conta Criada! 🎉</h2>
                    <p className="text-slate-300 mb-4">Sua conta foi criada com sucesso.</p>
                    <p className="text-slate-400 text-sm">Você será redirecionado para o login em instantes...</p>
                </div>
            </main>
        )
    }

    return (
        <main id="main" className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Crie sua conta</h1>
                    <p className="text-slate-400">Junte-se ao BrincaBytes hoje mesmo.</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Usuário</label>
                        <Input
                            type="text"
                            placeholder="Escolha um nome de usuário"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">E-mail</label>
                        <Input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Senha</label>
                        <Input
                            type="password"
                            placeholder="Mínimo de 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white mt-4"
                        disabled={loading}
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Criar Conta
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    Já tem uma conta?{" "}
                    <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium">
                        Fazer login
                    </Link>
                </div>
            </div>
        </main>
    );
}
