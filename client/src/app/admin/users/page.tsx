"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, User as UserIcon, Shield, AlertTriangle } from "lucide-react";
import { ActionModal, ModalType } from "@/components/ui/ActionModal";
import { API_URL } from "@/lib/config";

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    subscription_type: string;
    created_at: string; // timestamp text/number
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ role: '', subscription_type: '', months: '1' });
    const [saving, setSaving] = useState(false);
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

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/users?page=${page}&limit=20&search=${search}`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setTotalPages(data.pages);
            }
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timeout);
    }, [page, search]);

    const handleDelete = async (id: number) => {
        const user = users.find(u => u.id === id);
        setModalConfig({
            isOpen: true,
            title: "Excluir Usuário?",
            description: `Tem certeza que deseja remover ${user?.username}? Esta ação apagará todo o histórico e não pode ser desfeita.`,
            type: "confirm",
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                try {
                    const res = await fetch(`${API_URL}/api/admin/users/${id}`, { method: 'DELETE', credentials: "include" });
                    if (res.ok) {
                        setUsers(users.filter(u => u.id !== id));
                        setModalConfig({
                            isOpen: true,
                            title: "Removido!",
                            description: "O usuário foi excluído do sistema permanentemente.",
                            type: "success"
                        });
                    } else {
                        throw new Error("Falha no servidor");
                    }
                } catch (error) {
                    console.error(error);
                    setModalConfig({
                        isOpen: true,
                        title: "Erro na Exclusão",
                        description: "Houve um problema ao tentar remover este usuário.",
                        type: "error"
                    });
                }
            }
        });
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setEditForm({
            role: user.role,
            subscription_type: user.subscription_type || 'none',
            months: '1'
        });
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: editForm.role,
                    subscription_type: editForm.subscription_type,
                    subscription_months: editForm.subscription_type !== 'none' ? editForm.months : undefined
                }),
                credentials: "include"
            });

            if (res.ok) {
                setEditingUser(null);
                fetchUsers();
                setModalConfig({
                    isOpen: true,
                    title: "Atualizado!",
                    description: "Os dados do usuário foram salvos com sucesso.",
                    type: "success"
                });
            } else {
                throw new Error("Erro na API");
            }
        } catch (error) {
            console.error(error);
            setModalConfig({
                isOpen: true,
                title: "Erro ao Salvar",
                description: "Não foi possível atualizar as informações do usuário.",
                type: "error"
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Gerenciar Usuários</h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Buscar por nome ou email..."
                        className="pl-10 bg-slate-950 border-slate-800 text-slate-200 focus:ring-primary"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-800 text-slate-200 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Função</th>
                                <th className="px-6 py-4">Plano</th>
                                <th className="px-6 py-4 text-right">Cadastrado em</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                                                <UserIcon className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-white">{user.username}</span>
                                        </td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-slate-700 text-slate-300'}`}>
                                                {user.role === 'admin' && <Shield className="w-3 h-3" />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.subscription_type !== 'none' ? (
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    {user.subscription_type}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 text-xs">Gratuito</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums">
                                            {new Date(Number(user.created_at)).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" variant="ghost" onClick={() => handleEditClick(user)}>Editar</Button>
                                                <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-900/20" onClick={() => handleDelete(user.id)}>Excluir</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-500">Página {page} de {totalPages}</span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage(p => p - 1)}
                            className="text-white hover:text-white"
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage(p => p + 1)}
                            className="text-white hover:text-white"
                        >
                            Próxima
                        </Button>
                    </div>
                </div>
            </div>

            {/* Edit Modal (Simple overlay for now) */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full space-y-4">
                        <h3 className="text-xl font-bold text-white">Editar Usuário</h3>
                        <p className="text-sm text-slate-400">Editando: {editingUser.username}</p>

                        <div className="space-y-2">
                            <label className="text-sm text-slate-300">Função</label>
                            <select
                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            >
                                <option value="user">Usuário</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-slate-300">Assinatura</label>
                            <select
                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                                value={editForm.subscription_type}
                                onChange={(e) => setEditForm({ ...editForm, subscription_type: e.target.value })}
                            >
                                <option value="none">Gratuito</option>
                                <option value="monthly">Mensal</option>
                                <option value="semiannual">Semestral</option>
                                <option value="annual">Anual</option>
                            </select>
                        </div>

                        {editForm.subscription_type !== 'none' && (
                            <div className="space-y-2">
                                <label className="text-sm text-slate-300">Adicionar tempo (meses)</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={editForm.months}
                                    onChange={(e) => setEditForm({ ...editForm, months: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                                <p className="text-xs text-slate-500">Isto estenderá a assinatura a partir de hoje.</p>
                            </div>
                        )}

                        <div className="flex gap-2 justify-end pt-4">
                            <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancelar</Button>
                            <Button disabled={saving} onClick={handleSaveEdit}>{saving ? <Loader2 className="animate-spin" /> : 'Salvar'}</Button>
                        </div>
                    </div>
                </div>
            )}

            <ActionModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                description={modalConfig.description}
                type={modalConfig.type}
                confirmText="Sim, Confirmar"
                cancelText="Cancelar"
            />
        </div>
    );
}
