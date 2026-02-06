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

            {items.map((team, idx) => (
                <Link href={`/scoreboard/team/${team.id}`} key={team.id} className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all duration-500 ease-out",
                    "bg-ocean/20 border-lagoon/10 hover:border-lagoon/40 hover:bg-ocean/40 hover:shadow-[0_0_15px_-3px_rgba(28,114,147,0.2)] hover:-translate-y-0.5 group"
                )}>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-ocean-deep text-sm font-bold text-lagoon-100/50 group-hover:bg-lagoon/20 group-hover:text-lagoon-100 transition-colors border border-white/5 group-hover:border-lagoon/30 shadow-inner">
                            {startIndex + idx + 1}
                        </span>
                        <div>
                            <span className="font-bold text-white group-hover:text-lagoon-100 transition-colors block">
                                {team.name}
                            </span>
                            <span className="text-[10px] uppercase text-tapa font-semibold tracking-wider opacity-60 group-hover:opacity-100">Team</span>
                        </div>
                    </div>
                    <span className="font-mono font-bold text-white text-lg bg-ocean-deep/50 border border-white/5 px-2 py-1 rounded-md min-w-[60px] text-center group-hover:bg-lagoon/10 group-hover:border-lagoon/20 transition-colors shadow-inner">
                        {team.points}
                    </span>
                </Link>
            ))}
        </div>
    );
}
