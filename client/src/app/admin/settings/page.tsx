"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react";
import { API_URL } from "@/lib/config";
import { Switch } from "../../../components/ui/switch"; // Assuming you have a switch, or use checkbox

interface Setting {
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    description: string;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/settings`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error("Erro ao buscar settings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleUpdate = async (key: string, value: any) => {
        setSaving(key);
        try {
            const res = await fetch(`${API_URL}/api/admin/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value }),
                credentials: "include"
            });

            if (res.ok) {
                setSettings(prev => prev.map(s => s.key === key ? { ...s, value: String(value) } : s));
            } else {
                alert("Erro ao salvar.");
            }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar.");
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-white" /></div>;

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                    <SettingsIcon className="w-8 h-8 text-primary" />
                    Configurações do Sistema
                </h2>
                <p className="text-slate-400">Ajuste os parâmetros globais da plataforma.</p>
            </div>

            <div className="grid gap-6 max-w-2xl">
                {settings.map((setting) => (
                    <div key={setting.key} className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col gap-4">
                        <div>
                            <h3 className="font-medium text-white text-lg">{setting.key.replace(/_/g, ' ').toUpperCase()}</h3>
                            <p className="text-sm text-slate-400">{setting.description}</p>
                        </div>

                        <div className="flex items-center gap-4">
                            {setting.type === 'boolean' ? (
                                <div className="flex items-center gap-3">
                                    <Switch
                                        checked={setting.value === 'true'}
                                        onCheckedChange={(checked: boolean) => handleUpdate(setting.key, checked ? 'true' : 'false')}
                                        disabled={saving === setting.key}
                                        aria-label={setting.description}
                                    />
                                    <span className="text-sm font-medium text-white">
                                        {setting.value === 'true' ? 'ATIVADO' : 'DESATIVADO'}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex-1 flex gap-2">
                                    <Input
                                        defaultValue={setting.value}
                                        type={setting.type === 'number' ? 'number' : 'text'}
                                        onChange={(e) => {
                                            // Opção: Salvar on blur ou ter botão de salvar
                                            // Aqui vamos simplificar com botão de salvar ao lado
                                        }}
                                        id={`input-${setting.key}`}
                                        aria-label={setting.description}
                                        className="bg-slate-950 border-slate-700 text-white"
                                    />
                                    <Button
                                        onClick={() => {
                                            const val = (document.getElementById(`input-${setting.key}`) as HTMLInputElement).value;
                                            handleUpdate(setting.key, val);
                                        }}
                                        disabled={saving === setting.key}
                                    >
                                        {saving === setting.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
