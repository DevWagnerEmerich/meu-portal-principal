"use client";

import { useEffect, useState } from "react";
import { GameCard } from "../ui/GameCard";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { API_URL } from "@/lib/config";

// Tipo do jogo vindo da API
interface Game {
    id: string;
    title: string;
    thumbnail: string;
    type?: string;
}

export function FeaturedGames() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        // Tenta buscar do backend (porta 3001)
        // Como o backend serve 'games.json' estático, podemos pegar de lá
        const fetchGames = async () => {
            try {
                // Tenta conectar na porta 3001 (Backend) ou 3000 (se tiver proxy)
                // Ajuste a URL conforme onde o backend estiver rodando
                const response = await fetch(`${API_URL}/games.json`);
                if (!response.ok) throw new Error('Falha ao buscar jogos');

                const data = await response.json();
                // Pega os primeiros 6 jogos como destaque
                setGames(data.slice(0, 6));
            } catch (error) {
                console.error("Erro ao carregar jogos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <section className="bg-slate-950 py-20" id="jogos">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Jogos em Destaque</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        Confira os jogos mais acessados e comece a diversão agora mesmo.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {games.map((game, index) => (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <GameCard
                                id={game.id}
                                title={game.title}
                                thumbnail={game.thumbnail.startsWith('http') ? game.thumbnail : `${API_URL}${game.thumbnail}`} // Ajusta URL da imagem apenas se for relativa
                                category={game.type === 'premium' ? 'Premium de Assinante' : 'Grátis'}
                                isNew={index < 2} // Apenas um exemplo visual
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
