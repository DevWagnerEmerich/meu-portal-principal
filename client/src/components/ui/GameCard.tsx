// aria-label
"use client";

import { motion } from "framer-motion";
import { Play, Star, Crown, Download, Youtube } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./button";

interface GameCardProps {
    id: string;
    title: string;
    thumbnail: string;
    category?: string;
    is_premium?: boolean;
    isNew?: boolean;
    printable_url?: string;
    tutorial_url?: string;
}

export function GameCard({ id, title, thumbnail, category, is_premium, isNew, printable_url, tutorial_url }: GameCardProps) {
    return (
        <motion.div
            whileHover={{ y: -8 }}
            className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl"
        >
            {/* Imagem */}
            <div className="relative aspect-video w-full overflow-hidden">
                <img
                    src={thumbnail}
                    alt={title}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Badge Novo */}
                {isNew && !is_premium && !category?.toLowerCase().includes('premium') && !category?.toLowerCase().includes('vip') && (
                    <span className="absolute top-3 left-3 px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-highlight-foreground bg-highlight rounded-sm shadow-lg">
                        Novo
                    </span>
                )}

                {/* Badge VIP */}
                {(is_premium || category?.toLowerCase().includes('premium') || category?.toLowerCase().includes('vip')) && (
                    <span className="absolute top-3 left-3 px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-amber-900 bg-amber-400 rounded-sm shadow-lg flex items-center gap-1">
                        <Crown className="w-3 h-3" /> VIP
                    </span>
                )}
            </div>

            {/* Conteúdo */}
            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        {category && <p className="text-xs font-semibold text-teal-400 mb-1">{category}</p>}
                        <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{title}</h3>
                    </div>
                </div>

                <div className="flex flex-col gap-2 mt-4 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <Link href={`/play/${id}`} className="w-full">
                        <Button variant="secondary" className="w-full">
                            <Play className="w-4 h-4 mr-2" fill="currentColor" />
                            Jogar
                        </Button>
                    </Link>

                    {(tutorial_url || printable_url) && (
                        <div className="flex gap-2 w-full">
                            {tutorial_url && (
                                <a href={tutorial_url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                                    <Button variant="outline" className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/50" title="Como Jogar (Tutorial)">
                                        <Youtube className="w-4 h-4 mr-2 shrink-0" />
                                        <span className="truncate">Tutorial</span>
                                    </Button>
                                </a>
                            )}
                            {printable_url && (
                                <a href={printable_url} download target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                                    <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800" title="Baixar Material para Impressão">
                                        <Download className="w-4 h-4 mr-2 shrink-0" />
                                        <span className="truncate">PDF</span>
                                    </Button>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
