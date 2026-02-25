"use client";

import { GameForm } from "@/components/admin/GameForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewGamePage() {
    return (
        <div>
            <div className="mb-6 flex items-center gap-4">
                <Link href="/admin/games" className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft className="text-slate-400" />
                </Link>
                <h2 className="text-3xl font-bold text-white">Adicionar Novo Jogo</h2>
            </div>

            <GameForm />
        </div>
    );
}
