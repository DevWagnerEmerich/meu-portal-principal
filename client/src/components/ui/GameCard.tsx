"use client";

import { motion } from "framer-motion";
import { Play, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./button";

interface GameCardProps {
    id: string;
    title: string;
    thumbnail: string;
    category?: string;
    isNew?: boolean;
}

export function GameCard({ id, title, thumbnail, category, isNew }: GameCardProps) {
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
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Badge Novo */}
                {isNew && (
                    <span className="absolute top-3 left-3 px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-black bg-yellow-400 rounded-sm shadow-lg">
                        Novo
                    </span>
                )}
            </div>

            {/* Conteúdo */}
            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        {category && <p className="text-xs font-semibold text-teal-400 mb-1">{category}</p>}
                        <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1">{title}</h3>
                    </div>
                </div>

                <div className="flex gap-3 mt-4 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <Link href={`/play/${id}`} className="w-full">
                        <Button className="w-full h-10 bg-teal-600 hover:bg-teal-500 text-white font-semibold">
                            <Play className="w-4 h-4 mr-2" fill="currentColor" />
                            Jogar
                        </Button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
