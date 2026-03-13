
'use client';

import { ScoreboardMetric } from "@/types/scoreboard";
import { Trophy } from "lucide-react";
import { PremiumTrophy } from "@/components/ui/PremiumTrophy";
import { OceanWaves, TonganNgatu, NgatuDivider, WinnerBadge } from "@/components/ui/Patterns";
import { motion } from "framer-motion";

interface PodiumProps {
    standings: ScoreboardMetric[];
}

function AnimatedNumber({ value }: { value: number }) {
    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.8, type: "spring", stiffness: 200 }}
        >
            {value}
        </motion.span>
    );
}

export function Podium({ standings }: PodiumProps) {
    const first = standings.find(s => s.rank === 1);
    const second = standings.find(s => s.rank === 2);
    const third = standings.find(s => s.rank === 3);

    const podiumVariants = {
        hidden: { opacity: 0, y: 60 },
        visible: (delay: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.7,
                delay,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            },
        }),
    };

    return (
        <div className="flex flex-col md:flex-row items-end justify-center gap-4 min-h-[380px] mb-12 mt-8">
            {/* 2nd Place */}
            {second && (
                <motion.div
                    className="order-2 md:order-1 flex-1 max-w-[200px] flex flex-col items-center"
                    variants={podiumVariants}
                    initial="hidden"
                    animate="visible"
                    custom={0.2}
                >
                    <div className="mb-3 text-center">
                        <span className="text-lg font-bold text-white block truncate w-full px-2">{second.name}</span>
                        <span className="text-xl font-mono font-bold text-lagoon-100">
                            <AnimatedNumber value={second.points} /> pts
                        </span>
                    </div>
                    <motion.div
                        className="w-full h-40 bg-gradient-to-t from-ocean-deep via-ocean to-lagoon/30 border-t-2 border-x border-lagoon/50 rounded-t-lg relative group overflow-hidden shadow-[0_0_25px_rgba(28,114,147,0.25)]"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{ transformOrigin: "bottom" }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-lagoon/10 to-ocean-deep opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
                        <OceanWaves className="absolute inset-0 opacity-15 mix-blend-overlay" />
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-lagoon-100 to-transparent opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-lagoon/40 to-ocean-deep group-hover:from-lagoon/60 transition-all duration-500 drop-shadow-sm">2</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* 1st Place (Winner) */}
            {first && (
                <motion.div
                    className="order-1 md:order-2 flex-1 max-w-[240px] flex flex-col items-center z-10 -mx-2 md:mx-4"
                    variants={podiumVariants}
                    initial="hidden"
                    animate="visible"
                    custom={0.5}
                >
                    <div className="mb-6 text-center relative w-full">
                        {/* God Ray / Spotlight Effect */}
                        <motion.div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-tongan/20 blur-[80px] -z-10 rounded-full"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1.2, delay: 0.8 }}
                        />

                        <WinnerBadge className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-28 animate-pulse-slow drop-shadow-[0_0_15px_rgba(200,16,46,0.5)]" />
                        <div className="mt-12">
                            <span className="text-2xl font-black text-white uppercase tracking-wider block drop-shadow-md">{first.name}</span>
                            <span className="text-4xl font-mono font-black text-tongan drop-shadow-[0_0_10px_rgba(200,16,46,0.4)]">
                                <AnimatedNumber value={first.points} /> pts
                            </span>
                        </div>
                    </div>
                    <motion.div
                        className="w-full h-56 bg-gradient-to-t from-tongan-dark via-tongan to-tongan/30 border-t-[3px] border-x border-tongan-light/50 rounded-t-xl relative group overflow-hidden shadow-[0_0_40px_rgba(200,16,46,0.4)]"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        style={{ transformOrigin: "bottom" }}
                    >
                        {/* Animated background gradient to give it a rich look */}
                        <div className="absolute inset-0 bg-[length:200%_200%] bg-gradient-to-b from-transparent via-tongan/20 to-tongan-dark opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
                        <TonganNgatu className="absolute inset-0 opacity-10 mix-blend-overlay" />
                        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-tongan-dark via-tongan-light to-tongan-dark opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center pb-8">
                            <div className="relative w-28 h-28 group-hover:scale-110 transition-all duration-700 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                <PremiumTrophy variant="gold" className="w-full h-full" />
                            </div>
                        </div>
                        <div className="absolute bottom-6 left-0 right-0 text-center z-10">
                            <span className="px-4 py-1.5 bg-black/40 backdrop-blur-md border border-tongan-light/40 rounded-full text-xs font-black text-white uppercase tracking-[0.2em] shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-shadow">
                                Leader
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* 3rd Place */}
            {third && (
                <motion.div
                    className="order-3 md:order-3 flex-1 max-w-[200px] flex flex-col items-center"
                    variants={podiumVariants}
                    initial="hidden"
                    animate="visible"
                    custom={0.1}
                >
                    <div className="mb-3 text-center">
                        <span className="text-lg font-bold text-white block truncate w-full px-2">{third.name}</span>
                        <span className="text-xl font-mono font-bold text-slate-400">
                            <AnimatedNumber value={third.points} /> pts
                        </span>
                    </div>
                    <motion.div
                        className="w-full h-32 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-700/40 border-t-2 border-x border-slate-500/40 rounded-t-lg relative group overflow-hidden shadow-[0_0_20px_rgba(148,163,184,0.15)]"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        style={{ transformOrigin: "bottom" }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-600/10 to-slate-900 opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
                        <NgatuDivider className="absolute bottom-0 w-full opacity-10 mix-blend-overlay" />
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-600/50 to-slate-900 group-hover:from-slate-500/70 transition-all duration-500 drop-shadow-sm">3</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
