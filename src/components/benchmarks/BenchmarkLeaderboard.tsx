'use client';

import { PremiumCard } from '@/components/ui/PremiumCard';
import { Trophy, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
    name: string;
    initials: string;
    teamName: string;
    squats: number;
    pushups: number;
    burpees: number;
    totalReps: number;
}

interface BenchmarkLeaderboardProps {
    entries: LeaderboardEntry[];
}

const rankStyles = [
    { badge: '🥇', ring: 'ring-yellow-400/40', bg: 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/5', border: 'border-yellow-500/30', text: 'text-yellow-300' },
    { badge: '🥈', ring: 'ring-slate-300/30', bg: 'bg-gradient-to-r from-slate-400/15 to-slate-500/5', border: 'border-slate-400/25', text: 'text-slate-300' },
    { badge: '🥉', ring: 'ring-amber-600/30', bg: 'bg-gradient-to-r from-amber-700/15 to-amber-800/5', border: 'border-amber-600/25', text: 'text-amber-400' },
    { badge: '4', ring: 'ring-white/5', bg: 'bg-ocean/20', border: 'border-white/5', text: 'text-slate-400' },
    { badge: '5', ring: 'ring-white/5', bg: 'bg-ocean/20', border: 'border-white/5', text: 'text-slate-400' },
];

const exerciseColors = {
    squats: { bar: 'bg-[#66FCF1]', label: 'SQ', dot: 'bg-[#66FCF1]' },
    pushups: { bar: 'bg-[#C8102E]', label: 'PU', dot: 'bg-[#C8102E]' },
    burpees: { bar: 'bg-[#E2E8F0]', label: 'BP', dot: 'bg-[#E2E8F0]' },
};

export function BenchmarkLeaderboard({ entries }: BenchmarkLeaderboardProps) {
    if (!entries || entries.length === 0) return null;

    const maxReps = entries[0]?.totalReps || 1;

    return (
        <PremiumCard className="p-0 overflow-hidden border-lagoon/20">
            {/* Header */}
            <div className="p-6 border-b border-lagoon/15 bg-gradient-to-r from-ocean-deep/90 via-ocean/30 to-ocean-deep/90 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-yellow-500/20 to-tongan/20 rounded-xl border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Top Performers</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Cumulative reps across all weeks</p>
                    </div>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-4">
                    {Object.entries(exerciseColors).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-1.5">
                            <div className={cn('w-2.5 h-2.5 rounded-full', val.dot)} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{key}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Leaderboard Entries */}
            <div className="p-4 space-y-2">
                {entries.slice(0, 5).map((entry, index) => {
                    const style = rankStyles[index];
                    const barWidthPercent = Math.max((entry.totalReps / maxReps) * 100, 8);
                    const squatPct = entry.totalReps > 0 ? (entry.squats / entry.totalReps) * 100 : 33;
                    const pushupPct = entry.totalReps > 0 ? (entry.pushups / entry.totalReps) * 100 : 33;
                    const burpeePct = entry.totalReps > 0 ? (entry.burpees / entry.totalReps) * 100 : 34;

                    return (
                        <div
                            key={entry.name}
                            className={cn(
                                'relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300',
                                'hover:scale-[1.01] hover:-translate-y-px hover:shadow-lg',
                                style.bg, style.border
                            )}
                            style={{ animationDelay: `${index * 80}ms` }}
                        >
                            {/* Rank */}
                            <div className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0',
                                'ring-2 shadow-inner',
                                style.ring,
                                index < 3 ? 'bg-ocean-deep/80' : 'bg-ocean-deep/60'
                            )}>
                                {index < 3 ? (
                                    <span className="text-lg">{style.badge}</span>
                                ) : (
                                    <span className={cn('font-mono', style.text)}>{style.badge}</span>
                                )}
                            </div>

                            {/* Avatar + Name */}
                            <div className="flex items-center gap-3 w-40 shrink-0">
                                <div className={cn(
                                    'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border',
                                    'bg-ocean-deep text-lagoon-100/80 border-lagoon/20'
                                )}>
                                    {entry.initials}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{entry.name}</p>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">{entry.teamName}</p>
                                </div>
                            </div>

                            {/* Stacked Progress Bar */}
                            <div className="flex-1 min-w-0">
                                <div
                                    className="flex h-7 rounded-lg overflow-hidden shadow-inner bg-ocean-deep/60 border border-white/5 transition-all duration-700"
                                    style={{ width: `${barWidthPercent}%` }}
                                >
                                    <div
                                        className={cn('h-full transition-all duration-700', exerciseColors.squats.bar)}
                                        style={{ width: `${squatPct}%` }}
                                        title={`Squats: ${entry.squats}`}
                                    />
                                    <div
                                        className={cn('h-full transition-all duration-700', exerciseColors.pushups.bar)}
                                        style={{ width: `${pushupPct}%` }}
                                        title={`Pushups: ${entry.pushups}`}
                                    />
                                    <div
                                        className={cn('h-full transition-all duration-700', exerciseColors.burpees.bar)}
                                        style={{ width: `${burpeePct}%` }}
                                        title={`Burpees: ${entry.burpees}`}
                                    />
                                </div>
                            </div>

                            {/* Reps Breakdown */}
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono">
                                    <span className="text-[#66FCF1]">{entry.squats}</span>
                                    <span className="text-white/20">/</span>
                                    <span className="text-[#C8102E]">{entry.pushups}</span>
                                    <span className="text-white/20">/</span>
                                    <span className="text-slate-300">{entry.burpees}</span>
                                </div>
                                <div className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm font-black font-mono',
                                    'bg-ocean-deep/80 border border-white/10',
                                    index === 0 ? 'text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.15)]' : 'text-white'
                                )}>
                                    {entry.totalReps.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </PremiumCard>
    );
}
