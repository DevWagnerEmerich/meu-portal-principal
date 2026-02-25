"use client";

import { useEffect, useState, use, useRef } from "react";
import { Loader2, ArrowLeft, Maximize } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UpgradeOverlay } from "@/components/subscription/UpgradeOverlay";
import { API_URL } from "@/lib/config";

interface Game {
    id: string;
    title: string;
    game_url: string;
}

export default function PlayGamePage({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = use(params);

    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(true);
    const [canPlay, setCanPlay] = useState(false);
    const [accessMessage, setAccessMessage] = useState("");

    const startedRef = useRef(false);

    const toggleFullScreen = () => {
        const gameContainer = document.getElementById("game-container");
        if (!document.fullscreenElement) {
            gameContainer?.requestFullscreen().catch((err) => {
                console.error(`Erro ao ativar tela cheia: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const fetchGameAndAccess = async () => {
            if (startedRef.current) return;
            startedRef.current = true;

            try {
                // 1. Buscar detalhes do jogo
                const gamesRes = await fetch(`${API_URL}/games.json`);
                const games: Game[] = await gamesRes.json();
                const foundGame = games.find(g => g.id === gameId);

                if (foundGame) {
                    setGame(foundGame);

                    // 2. Tentar iniciar o jogo (consumir energia)
                    const response = await fetch(`${API_URL}/api/game-start`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ gameSrc: foundGame.game_url, gameId: foundGame.id }),
                        credentials: "include"
                    });

                    const data = await response.json();

                    if (response.ok) {
                        setCanPlay(true);
                        setAccessMessage("Bom jogo!");
                        // Avisa o Navbar para atualizar a energia
                        window.dispatchEvent(new Event("user-updated"));
                    } else {
                        setCanPlay(false);
                        setAccessMessage(data.message || "Acesso negado.");
                    }
                }
            } catch (error) {
                console.error("Erro ao processar jogo:", error);
                setAccessMessage("Erro ao conectar ao servidor.");
            } finally {
                setLoading(false);
            }
        };

        if (gameId) {
            fetchGameAndAccess();
        }
    }, [gameId]);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!game) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-slate-950 text-white">
                <h2 className="text-2xl mb-4">Jogo não encontrado 😢</h2>
                <Link href="/">
                    <Button variant="secondary">Voltar para Home</Button>
                </Link>
            </div>
        );
    }

    // Se não puder jogar (sem energia ou sem login), mostra tela de bloqueio
    if (!canPlay) {
        // Verifica se é falta de login
        if (accessMessage.includes("autenticado") || accessMessage.includes("login")) {
            return (
                <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-8 text-white">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
                        <h2 className="text-3xl font-bold mb-4 text-white">Faça Login para Jogar</h2>
                        <p className="text-slate-400 mb-8">Salve seu progresso e ganhe jogadas gratuitas todos os dias!</p>
                        <Link href="/login" className="block w-full">
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 text-lg h-12">
                                Entrar com minha conta
                            </Button>
                        </Link>
                        <div className="mt-6">
                            <Link href="/">
                                <Button variant="ghost" className="text-slate-500 hover:text-white">
                                    Voltar para Home
                                </Button>
                            </Link>
                        </div>
                    </div>
                </main>
            )
        }

        // Se for falta de energia/limite ou bloqueio VIP (Erro 403), mostra o UpgradeOverlay
        const isVipBlock = accessMessage.includes("exclusivo");

        return (
            <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative">
                <div className="absolute top-4 left-4 z-10">
                    <Link href="/">
                        <Button variant="ghost" className="text-slate-400 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                    </Link>
                </div>
                {/* Aqui entra nosso novo componente de alta conversão */}
                <UpgradeOverlay reason={isVipBlock ? 'vip' : 'energy'} />
            </main>
        );
    }

    // Se puder jogar, mostra o jogo
    return (
        <main className="min-h-screen bg-slate-950 flex flex-col">
            {/* <title>Jogar</title> <meta name="description" content="Jogar BrincaBytes"> <meta property="og:title" content="Jogar"> */}
            <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="text-slate-300">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                    </Link>
                    <h1 className="text-lg font-bold text-white">{game.title}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white" onClick={toggleFullScreen}>
                        <Maximize className="w-4 h-4 mr-2 hidden sm:block" />
                        <span className="hidden sm:inline">Tela Cheia</span>
                        <Maximize className="w-5 h-5 sm:hidden" />
                    </Button>
                    <div className="text-sm text-slate-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="hidden sm:inline">Jogando</span>
                    </div>
                </div>
            </header>

            <div id="game-container" className="flex-1 w-full bg-black relative">
                <iframe
                    src={game.game_url.startsWith('http') ? game.game_url : `${API_URL}${game.game_url}`}
                    className="w-full h-full absolute inset-0 border-0"
                    allowFullScreen
                    allow="autoplay"
                />
            </div>
        </main>
    );
}
