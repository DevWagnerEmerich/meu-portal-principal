"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Chrome } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Estados do formulário
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("http://localhost:3001/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
                credentials: "include" // Importante para salvar o cookie de sessão
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Erro ao fazer login");
            }

            // Sucesso!
            router.push("/");
            // Força um refresh para atualizar o estado de login na home (simples por enquanto)
            router.refresh();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Redireciona para o endpoint do backend que inicia o OAuth
        window.location.href = "http://localhost:3001/api/auth/google";
    };

    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo de volta!</h1>
                    <p className="text-slate-400">Entre para continuar sua jornada.</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Usuário</label>
                        <Input
                            type="text"
                            placeholder="Seu nome de usuário"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Senha</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300">
                            Esqueceu a senha?
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                        disabled={loading}
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Entrar
                    </Button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-900 px-2 text-slate-500">Ou continue com</span>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={handleGoogleLogin}
                >
                    <Chrome className="w-4 h-4 mr-2" />
                    Google
                </Button>

                <div className="mt-6 text-center text-sm text-slate-400">
                    Não tem uma conta?{" "}
                    <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
                        Cadastre-se grátis
                    </Link>
                </div>
            </div>
        </main>
    );
}
