
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/Components';
import { Users, Scale, Activity, ArrowRight, LucideIcon, Crown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { OceanWaves, TonganNgatu } from '@/components/ui/Patterns';
import DashboardAnalytics from '@/components/analytics/DashboardAnalytics';
import ClientOnly from '@/components/ui/ClientOnly';
import { AnimatedNumber } from '@/components/ui/MicroAnimations';
import { Team, TeamWeekMetric, BlockWeek } from '@prisma/client';
import { AttendanceDataPoint } from '@/components/analytics/Charts';

import { StatCard } from '@/components/dashboard/StatCard';

interface ExtendedMetric extends TeamWeekMetric {
    team: Team;
    blockWeek: BlockWeek;
}

import { Variants } from 'framer-motion';

interface LeaderboardItem {
    id: string;
    name: string;
    points: number;
}
interface DashboardStats {
    currentWeekNumber: number;
    totalLoss: number;
    teams: number;
    allMetrics: ExtendedMetric[];
    teamsList: Team[];
    attendanceData: AttendanceDataPoint[];
    leaderboard: LeaderboardItem[];
    weeklyTotals: { weekNumber: number; totalKm: number; totalLifestyle: number }[];
}

interface DashboardClientViewProps {
    stats: DashboardStats;
}

export function DashboardClientView({ stats }: DashboardClientViewProps) {

    // Stagger settings
    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 20 } }
    };

    return (
        <motion.div
            className="px-6 md:px-10 space-y-8 mt-6"
            initial="hidden"
            animate="show"
            variants={container}
        >
            {/* BENTO GRID LAYOUT - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-min">

                {/* 1. HERO METRIC: Current Week (Top Left) */}
                <motion.div variants={item} className="col-span-1">
                    <StatCard
                        label="Current Phase"
                        value={`Week ${stats.currentWeekNumber}`}
                        icon={Activity}
                        colorClass="bg-lagoon/10 text-lagoon-100"
                        className="border-lagoon/20 hover:border-lagoon/50 h-full"
                        pattern="waves"
                    />
                </motion.div>

                {/* 2. HERO METRIC: Total Loss (Top Mid) - Full width on mobile, 2 cols on desktop */}
                <motion.div variants={item} className="col-span-1 sm:col-span-2 md:col-span-2">
                    <StatCard
                        label="Block Weight Loss"
                        value={`${stats.totalLoss.toFixed(1)} kg`}
                        icon={Scale}
                        colorClass="bg-tongan/20 text-tongan-red"
                        subtext="Total"
                        borderClass="border-tongan/30"
                        className="bg-gradient-to-r from-tongan-dark/80 to-ocean-deep hover:border-tongan/50 h-full shadow-[0_4px_20px_rgba(200,16,46,0.15)]"
                        pattern="ngatu"
                    />
                </motion.div>

                <motion.div variants={item} className="col-span-1">
                    <StatCard
                        label="Active Teams"
                        value={stats.teams}
                        icon={Users}
                        colorClass="bg-ocean/30 text-blue-200"
                        className="border-white/5 hover:border-white/20 h-full"
                        pattern="waves"
                        isNumber={true}
                    />
                </motion.div>

                {/* 4. MAIN CHART (Middle Left) - Stack on mobile, 3 cols on desktop */}
                <motion.div variants={item} className="col-span-1 sm:col-span-2 md:col-span-3 md:row-span-2 h-full min-h-[400px] md:min-h-[500px]">
                    <ClientOnly>
                        <DashboardAnalytics
                            metrics={stats.allMetrics}
                            teams={stats.teamsList}
                            attendanceData={stats.attendanceData}
                            weeklyTotals={stats.weeklyTotals}
                            title="Performance Matrix"
                        />
                    </ClientOnly>
                </motion.div>

                {/* 5. LEADERBOARD (Middle Right) - Stack on mobile, 1 col on desktop */}
                <motion.div variants={item} className="col-span-1 sm:col-span-2 md:col-span-1 md:row-span-2 text-white flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-tongan" />
                            <h3 className="text-lg font-bold font-display tracking-wide text-white">Top Ranks</h3>
                        </div>
                        <Link href="/scoreboard" className="text-[10px] font-bold text-tongan hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1 group">
                            Full Board <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="flex-1 space-y-3">
                        {stats.leaderboard.map((team, index) => {
                            // Rank Styles
                            let rankStyle = "bg-ocean/20 border-white/5 text-slate-400";
                            // let iconColor = "bg-ocean-deep text-slate-500";

                            if (index === 0) {
                                rankStyle = "bg-gradient-to-r from-tongan/20 to-tongan/5 border-tongan/30 shadow-lg shadow-tongan/10";
                            } else if (index === 1) {
                                rankStyle = "bg-ocean/30 border-lagoon/20 hover:border-lagoon/40";
                            } else if (index === 2) {
                                rankStyle = "bg-ocean/20 border-orange-700/20 hover:border-orange-700/40";
                            }

                            return (
                                <Link href={`/scoreboard/team/${team.id}`} key={team.id} className="block group">
                                    <div className={cn(
                                        "flex items-center justify-between p-3 rounded-xl border transition-all duration-300 relative overflow-hidden",
                                        rankStyle,
                                        "hover:scale-[1.02] hover:shadow-xl group-hover:bg-ocean/40"
                                    )}>
                                        {/* Texture */}
                                        {index < 3 && <div className="absolute inset-0 opacity-[0.05] pointer-events-none"><OceanWaves /></div>}

                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm border shadow-inner", index === 0 ? "bg-tongan text-white border-tongan-light" : "bg-ocean-deep border-white/10 text-lagoon-100")}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className={cn("font-bold text-sm group-hover:text-white transition-colors", index === 0 ? "text-white" : "text-white/90")}>{team.name}</p>
                                                {index === 0 && <span className="text-[9px] font-bold text-tongan uppercase tracking-wider">Leader</span>}
                                            </div>
                                        </div>

                                        <div className="relative z-10">
                                            <span className={cn("font-mono font-black text-lg", index === 0 ? "text-white" : "text-slate-300")}>
                                                {team.points}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}

                        {/* Quick Actions */}
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link href="/weigh-in" className="mt-4 block">
                                <Button className="w-full bg-ocean-deep border border-dashed border-lagoon/30 hover:border-tongan text-lagoon-100/60 hover:text-white hover:bg-tongan/10 justify-center h-12 shadow-none transition-all duration-300 group">
                                    <Scale className="w-4 h-4 mr-2 group-hover:text-tongan transition-colors" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Log Weigh-in</span>
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
}
