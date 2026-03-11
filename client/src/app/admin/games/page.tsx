"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { ActionModal, ModalType } from "@/components/ui/ActionModal";
import { API_URL } from "@/lib/config";
import Image from "next/image";

interface Game {
    id: string;
    title: string;
    category: string;
    is_premium: boolean;
    is_featured: boolean;
    thumbnail: string;
}

export default function AdminGamesPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
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

    const fetchGames = async () => {
        try {
            const res = await fetch(`${API_URL}/api/games`);
            if (res.ok) {
                const data = await res.json();
                setGames(data);
            }
        } catch (error) {
            console.error("Erro ao buscar jogos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGames();
    }, []);

    const handleDelete = async (id: string) => {
        const game = games.find(g => g.id === id);
        setModalConfig({
            isOpen: true,
            title: "Excluir Jogo?",
            description: `Tem certeza que deseja remover "${game?.title}"? Esta ação não pode ser desfeita.`,
            type: "confirm",
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                setDeletingId(id);
                try {
                    const res = await fetch(`${API_URL}/api/games/${id}`, {
                        method: "DELETE",
                        credentials: "include"
                    });
                    if (res.ok) {
                        setGames(games.filter(g => g.id !== id));
                        setModalConfig({
                            isOpen: true,
                            title: "Excluído!",
                            description: "O jogo foi removido do portal com sucesso.",
                            type: "success"
                        });
                    } else {
                        throw new Error("Falha no servidor");
                    }
                } catch (error) {
                    console.error("Erro ao excluir:", error);
                    setModalConfig({
                        isOpen: true,
                        title: "Erro ao Excluir",
                        description: "Não foi possível remover o jogo agora. Tente novamente em alguns instantes.",
                        type: "error"
                    });
                } finally {
                    setDeletingId(null);
                }
            }
        });
    };

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-white" /></div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Gerenciar Jogos</h2>
                <Link href="/admin/games/new">
                    <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Jogo
                    </Button>
                </Link>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-800 text-slate-200 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Jogo</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4 text-center">Premium</th>
                                <th className="px-6 py-4 text-center">Destaque</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {games.map((game) => (
                                <tr key={game.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-12 h-8 relative rounded overflow-hidden bg-slate-700 shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={game.thumbnail.startsWith('http') ? game.thumbnail : `${API_URL}${game.thumbnail}`}
                                                alt={game.title}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{game.title}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-[150px]">{game.id}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                            {game.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`w-3 h-3 rounded-full mx-auto ${game.is_premium ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-slate-700'}`} />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`w-3 h-3 rounded-full mx-auto ${game.is_featured ? 'bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'bg-slate-700'}`} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/games/${game.id}`}>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-700 hover:text-blue-400">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 hover:bg-red-900/20 hover:text-red-400"
                                                onClick={() => handleDelete(game.id)}
                                                disabled={deletingId === game.id}
                                            >
                                                {deletingId === game.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {games.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Nenhum jogo encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <ActionModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                description={modalConfig.description}
                type={modalConfig.type}
                loading={deletingId !== null}
                confirmText="Sim, Excluir"
                cancelText="Cancelar"
            />
        </div>
    );
}
