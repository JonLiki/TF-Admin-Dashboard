'use client';

import { PremiumCard } from "@/components/ui/PremiumCard";
import { StatCard } from "@/components/dashboard/StatCard";
import MemberWeightChart from "@/components/analytics/MemberWeightChart";
import { TrendingDown, TrendingUp, Scale, CalendarCheck, Flame, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { MemberProgress } from "@/lib/transformers/memberProgress";

export function MemberProgressHero({ progress }: { progress: MemberProgress }) {
    const { kgLost, pctChange, startWeight, latestWeight, trend, sessionsAttended, streak, weighInCount } = progress;
    const hasWeighIns = weighInCount > 0;
    const lost = (kgLost ?? 0) > 0;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* HERO: total weight change */}
                <PremiumCard
                    variant="hero"
                    className="md:col-span-1 p-6 flex flex-col justify-between min-h-[200px] bg-gradient-to-br from-tongan-dark/70 to-ocean-deep border-tongan/30"
                >
                    <div className="flex items-center gap-2 text-tongan-light">
                        {lost ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                        <span className="text-micro font-bold uppercase tracking-widest">
                            {hasWeighIns ? (lost ? "Total Lost" : "Since Start") : "Your Progress"}
                        </span>
                    </div>

                    {hasWeighIns ? (
                        <div>
                            <div className="font-mono text-4xl md:text-5xl font-black text-foreground tracking-tighter drop-shadow-md">
                                {Math.abs(kgLost ?? 0).toFixed(1)} <span className="text-2xl">kg</span>
                            </div>
                            <div className="text-micro font-semibold text-foreground/60 mt-2 tracking-wide">
                                {pctChange !== null && (
                                    <span className={cn("font-bold", lost ? "text-emerald-400" : "text-tongan-red")}>
                                        {pctChange > 0 ? "+" : ""}{pctChange}%
                                    </span>
                                )}
                                {startWeight !== null && latestWeight !== null && (
                                    <span> · {startWeight.toFixed(1)} → {latestWeight.toFixed(1)} kg</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-foreground/60">
                            Log your first weigh-in to start tracking your journey.
                        </p>
                    )}
                </PremiumCard>

                {/* Weight trend */}
                <PremiumCard variant="quiet" className="md:col-span-2 p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <LineChart className="w-4 h-4 text-lagoon-100" />
                        <h3 className="text-sm font-bold text-foreground tracking-tight">Weight Trend</h3>
                    </div>
                    {weighInCount >= 2 ? (
                        <MemberWeightChart data={trend} />
                    ) : (
                        <div className="h-[260px] flex items-center justify-center text-center px-4 text-sm text-foreground/50">
                            Log another weigh-in to see your trend line.
                        </div>
                    )}
                </PremiumCard>
            </div>

            {/* Supporting stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    label="Current Weight"
                    value={latestWeight !== null ? `${latestWeight.toFixed(1)} kg` : "—"}
                    icon={Scale}
                    colorClass="bg-lagoon/10 text-lagoon-100"
                />
                <StatCard
                    label="Sessions Attended"
                    value={sessionsAttended}
                    icon={CalendarCheck}
                    colorClass="bg-emerald-500/10 text-emerald-400"
                    isNumber
                />
                <StatCard
                    label="Check-in Streak"
                    value={streak > 0 ? `${streak} wk` : "—"}
                    icon={Flame}
                    colorClass="bg-tongan/20 text-tongan-red"
                />
            </div>
        </div>
    );
}
