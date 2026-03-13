'use client';

import { cn } from "@/lib/utils";
import Link from "next/link";

interface LeaderboardListProps {
    items: Array<{
        id: string;
        name: string;
        points: number;
    }>;
    startIndex: number; // e.g. 3 (for 4th place)
}

export function LeaderboardList({ items, startIndex }: LeaderboardListProps) {
    if (items.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-8 border-t border-lagoon/20 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-ocean-deep px-4 text-xs font-bold text-lagoon-100/50 uppercase tracking-widest border border-lagoon/20 rounded-full py-1">
                Contenders
            </div>

            {items.map((team, idx) => {
                const rank = startIndex + idx + 1;
                const isCloseToPodium = rank === 4 || rank === 5;
                return (
                    <Link href={`/scoreboard/team/${team.id}`} key={team.id} className={cn(
                        "relative flex items-center justify-between p-4 rounded-xl border transition-all duration-500 ease-out overflow-hidden group",
                        "bg-ocean-deep/30 border-lagoon/10 hover:border-lagoon/40 hover:shadow-[0_0_20px_-5px_rgba(28,114,147,0.3)] hover:-translate-y-1"
                    )}>
                        {/* Hover Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-ocean/40 via-ocean/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <span className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-lg text-sm font-black transition-colors border shadow-inner",
                                isCloseToPodium
                                    ? "bg-slate-800 text-slate-300 border-slate-600/50 group-hover:bg-slate-700 group-hover:text-white"
                                    : "bg-ocean-deep text-lagoon-100/50 border-white/5 group-hover:bg-lagoon/20 group-hover:text-lagoon-100 group-hover:border-lagoon/30"
                            )}>
                                {rank}
                            </span>
                            <div>
                                <span className="font-bold text-white group-hover:text-lagoon-100 transition-colors block drop-shadow-sm">
                                    {team.name}
                                </span>
                                <span className="text-[10px] uppercase text-tapa font-bold tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">Team</span>
                            </div>
                        </div>
                        <span className="relative z-10 font-mono font-black text-white text-lg bg-ocean-deep/80 border border-white/10 px-3 py-1 rounded-md min-w-[60px] text-center group-hover:bg-lagoon/20 group-hover:border-lagoon/40 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] group-hover:shadow-[0_0_10px_rgba(28,114,147,0.2)]">
                            {team.points}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
