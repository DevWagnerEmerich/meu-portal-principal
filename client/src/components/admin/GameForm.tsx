"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { API_URL } from "@/lib/config";

interface GameData {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    game_url: string;
    printable_url: string;
    category: string;
    is_premium: boolean;
    is_featured: boolean;
}

interface GameFormProps {
    initialData?: GameData;
    isEditing?: boolean;
}

export function GameForm({ initialData, isEditing = false }: GameFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<GameData>(initialData || {
        id: "",
        title: "",
        description: "",
        thumbnail: "",
        game_url: "",
        printable_url: "",
        category: "Geral",
        is_premium: false,
        is_featured: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const url = isEditing
                ? `${API_URL}/api/games/${formData.id}`
                : `${API_URL}/api/games`;

            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
                credentials: "include"
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Erro ao salvar jogo.");
            }

            router.push("/admin/games");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">ID (Slug)</label>
                        <Input
                            name="id"
                            value={formData.id}
                            onChange={handleChange}
                            placeholder="ex: jogo-da-memoria"
                            disabled={isEditing}
                            required
                            className={isEditing ? "opacity-50 cursor-not-allowed" : ""}
                        />
                        <p className="text-xs text-slate-500">Identificador único na URL.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Título</label>
                        <Input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Nome do Jogo"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Descrição</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="flex w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Breve descrição do jogo..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Categoria</label>
                    <Input
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        placeholder="ex: Matemática, Português"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">URL do Jogo</label>
                        <Input
                            name="game_url"
                            value={formData.game_url}
                            onChange={handleChange}
                            placeholder="https://..."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">URL da Imagem (Thumbnail)</label>
                        <Input
                            name="thumbnail"
                            value={formData.thumbnail}
                            onChange={handleChange}
                            placeholder="/assets/..."
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">URL para Imprimir (PDF)</label>
                    <Input
                        name="printable_url"
                        value={formData.printable_url || ""}
                        onChange={handleChange}
                        placeholder="/downloads/..."
                    />
                </div>

                <div className="flex gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="is_premium"
                            checked={formData.is_premium}
                            onChange={handleCheckboxChange}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-600"
                        />
                        <span className="text-sm text-slate-300 select-none">Premium (Exclusivo Assinantes)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="is_featured"
                            checked={formData.is_featured}
                            onChange={handleCheckboxChange}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-600"
                        />
                        <span className="text-sm text-slate-300 select-none">Destaque na Home</span>
                    </label>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Link href="/admin/games">
                    <Button type="button" variant="ghost" className="text-slate-400 hover:text-white">
                        Cancelar
                    </Button>
                </Link>
                <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 min-w-[120px]">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar Jogo</>}
                </Button>
            </div>
        </form>
    );
}
