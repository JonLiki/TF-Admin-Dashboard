
'use client';

import { ScoreboardMetric } from "@/types/scoreboard";
import { Trophy } from "lucide-react";
import { OceanWaves, TonganNgatu, NgatuDivider, WinnerBadge } from "@/components/ui/Patterns";

interface PodiumProps {
    standings: ScoreboardMetric[];
}

export function Podium({ standings }: PodiumProps) {
    const first = standings.find(s => s.rank === 1);
    const second = standings.find(s => s.rank === 2);
    const third = standings.find(s => s.rank === 3);

    return (
        <div className="flex flex-col md:flex-row items-end justify-center gap-4 min-h-[380px] mb-12 mt-8">
            {/* 2nd Place */}
            {second && (
                <div className="order-2 md:order-1 flex-1 max-w-[200px] flex flex-col items-center">
                    <div className="mb-3 text-center">
                        <span className="text-lg font-bold text-white block truncate w-full px-2">{second.name}</span>
                        <span className="text-xl font-mono font-bold text-lagoon-100">{second.points} pts</span>
                    </div>
                    <div className="w-full h-40 bg-gradient-to-t from-ocean-deep via-ocean to-lagoon/20 border-t-2 border-x border-lagoon/30 rounded-t-lg relative group overflow-hidden shadow-[0_0_20px_rgba(28,114,147,0.15)]">
                        <OceanWaves className="absolute inset-0 opacity-10" />
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-lagoon to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl font-black text-lagoon/20 group-hover:text-lagoon/40 transition-colors drop-shadow-lg">2</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 1st Place (Winner) */}
            {first && (
                <div className="order-1 md:order-2 flex-1 max-w-[240px] flex flex-col items-center z-10 -mx-2 md:mx-4">
                    <div className="mb-6 text-center relative w-full">
                        {/* God Ray / Spotlight Effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-tongan/20 blur-[80px] -z-10 rounded-full" />

                        <WinnerBadge className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-28 animate-pulse-slow drop-shadow-[0_0_15px_rgba(200,16,46,0.5)]" />
                        <div className="mt-12">
                            <span className="text-2xl font-black text-white uppercase tracking-wider block drop-shadow-md">{first.name}</span>
                            <span className="text-4xl font-mono font-black text-tongan drop-shadow-[0_0_10px_rgba(200,16,46,0.4)]">{first.points} pts</span>
                        </div>
                    </div>
                    <div className="w-full h-56 bg-gradient-to-t from-tongan-dark via-tongan to-tongan/20 border-t-4 border-x border-tongan rounded-t-xl relative group overflow-hidden shadow-[0_0_50px_rgba(200,16,46,0.3)]">
                        <TonganNgatu className="absolute inset-0 opacity-10" />
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-tongan-light via-white to-tongan-light opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Trophy className="w-24 h-24 text-tongan-offwhite/20 group-hover:text-tongan-offwhite/40 group-hover:scale-110 transition-all duration-700" />
                        </div>
                        <div className="absolute bottom-6 left-0 right-0 text-center">
                            <span className="px-4 py-1 bg-tongan-dark/80 backdrop-blur-sm border border-tongan-light/30 rounded-full text-xs font-bold text-white uppercase tracking-[0.2em] shadow-lg">
                                Leader
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* 3rd Place */}
            {third && (
                <div className="order-3 md:order-3 flex-1 max-w-[200px] flex flex-col items-center">
                    <div className="mb-3 text-center">
                        <span className="text-lg font-bold text-white block truncate w-full px-2">{third.name}</span>
                        <span className="text-xl font-mono font-bold text-slate-400">{third.points} pts</span>
                    </div>
                    <div className="w-full h-32 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-700/30 border-t-2 border-x border-slate-600/30 rounded-t-lg relative group overflow-hidden shadow-[0_0_20px_rgba(148,163,184,0.1)]">
                        <NgatuDivider className="absolute bottom-0 w-full opacity-5" />
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-slate-500 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl font-black text-slate-500/20 group-hover:text-slate-500/40 transition-colors">3</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
