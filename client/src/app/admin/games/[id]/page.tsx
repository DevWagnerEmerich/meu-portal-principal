"use client";

import { useEffect, useState, use } from "react";
import { GameForm } from "@/components/admin/GameForm";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ActionModal, ModalType } from "@/components/ui/ActionModal";
import { API_URL } from "@/lib/config";
import { useRouter } from "next/navigation";

export default function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        type: ModalType;
    }>({
        isOpen: false,
        title: "",
        description: "",
        type: "info"
    });
    const router = useRouter();

    useEffect(() => {
        const fetchGame = async () => {
            try {
                // Buscando da lista geral e filtrando, ou poderia criar um endpoint específico GET /games/:id
                // Criamos o endpoint GET /games (lista), mas não GET /games/:id público,
                // Porém o admin tem acesso total, vamos assumir que precisamos achar na lista por enquanto
                // para não ter que criar rotas extras no backend agora se não for necessário.
                // Melhor: Vamos adicionar o GET /games/:id na API pública ou admin para facilitar?
                // O backend já tem `GET /games` que retorna tudo.

                // Vamos usar o endpoint de lista e filtrar no cliente por simplicidade e rapidez
                const res = await fetch(`${API_URL}/api/games`);
                if (res.ok) {
                    const data = await res.json();
                    const found = data.find((g: any) => g.id === id);
                    if (found) {
                        setGame(found);
                    } else {
                        setModalConfig({
                            isOpen: true,
                            title: "Jogo não encontrado",
                            description: "Não conseguimos localizar este jogo no banco de dados. Ele pode ter sido removido.",
                            type: "error"
                        });
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar jogo:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGame();
    }, [id, router]);

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-white" /></div>;
    }

    if (!game) return null;

    return (
        <div>
            <div className="mb-6 flex items-center gap-4">
                <Link href="/admin/games" className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft className="text-slate-400" />
                </Link>
                <h2 className="text-3xl font-bold text-white">Editar Jogo</h2>
            </div>

            <GameForm initialData={game} isEditing={true} />

            <ActionModal
                isOpen={modalConfig.isOpen}
                onClose={() => {
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                    router.push("/admin/games");
                }}
                title={modalConfig.title}
                description={modalConfig.description}
                type={modalConfig.type}
            />
        </div>
    );
}
