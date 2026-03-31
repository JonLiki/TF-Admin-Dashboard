'use client';

import { PremiumCard } from '@/components/ui/PremiumCard';
import { cn } from '@/lib/utils';

interface WeeklyStat {
    weekNumber: number;
    weekLabel: string;
    weight?: number;
    weightLoss?: number;
    km?: number;
    lifestylePosts?: number;
    attendance?: {
        present: number;
        total: number;
    };
    benchmarks?: {
        squats: number;
        pushups: number;
        burpees: number;
    };
    isCurrent: boolean;
}

interface MemberWeeklyTableProps {
    stats: WeeklyStat[];
}

export function MemberWeeklyTable({ stats }: MemberWeeklyTableProps) {
    // Determine if any week has benchmark data
    const hasBenchmarks = stats.some(s => s.benchmarks);

    return (
        <PremiumCard className="overflow-hidden p-0">
            <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-foreground">Weekly Breakdown</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                        <tr>
                            <th className="px-6 py-3">Week</th>
                            <th className="px-6 py-3 text-right">Weight (kg)</th>
                            <th className="px-6 py-3 text-right">Loss (kg)</th>
                            <th className="px-6 py-3 text-right">KM</th>
                            <th className="px-6 py-3 text-center">Lifestyle</th>
                            <th className="px-6 py-3 text-center">Attendance</th>
                            {hasBenchmarks && (
                                <th className="px-6 py-3 text-center">Benchmarks</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {stats.map((week) => (
                            <tr
                                key={week.weekNumber}
                                className={cn(
                                    "hover:bg-muted/30 transition-colors",
                                    week.isCurrent && "bg-primary/5 dark:bg-primary/10"
                                )}
                            >
                                <td className="px-6 py-3 font-medium text-foreground">
                                    {week.weekLabel}
                                    {week.isCurrent && <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider">Current</span>}
                                </td>
                                <td className="px-6 py-3 text-right font-mono text-foreground/80">
                                    {week.weight ? week.weight.toFixed(1) : <span className="text-muted-foreground/50">-</span>}
                                </td>
                                <td className="px-6 py-3 text-right font-mono">
                                    {week.weightLoss !== undefined ? (
                                        <span className={cn(
                                            week.weightLoss > 0 ? "text-green-600 dark:text-green-400 font-bold" : "text-muted-foreground/50"
                                        )}>
                                            {week.weightLoss > 0 ? `-${week.weightLoss.toFixed(1)}` : '0.0'}
                                        </span>
                                    ) : <span className="text-muted-foreground/50">-</span>}
                                </td>
                                <td className="px-6 py-3 text-right font-mono text-foreground/80">
                                    {week.km ? week.km.toFixed(1) : <span className="text-muted-foreground/50">-</span>}
                                </td>
                                <td className="px-6 py-3 text-center">
                                    {week.lifestylePosts !== undefined ? (
                                        <span className="inline-flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded font-bold text-xs min-w-[24px]">
                                            {week.lifestylePosts}
                                        </span>
                                    ) : <span className="text-muted-foreground/50">-</span>}
                                </td>
                                <td className="px-6 py-3 text-center">
                                    {week.attendance ? (
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="font-bold text-foreground">{week.attendance.present}</span>
                                            <span className="text-muted-foreground">/</span>
                                            <span className="text-muted-foreground">{week.attendance.total}</span>
                                        </div>
                                    ) : <span className="text-muted-foreground/50">-</span>}
                                </td>
                                {hasBenchmarks && (
                                    <td className="px-6 py-3 text-center">
                                        {week.benchmarks ? (
                                            <div className="inline-flex items-center gap-1">
                                                <span className="inline-flex items-center justify-center bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[22px]" title="Squats">
                                                    {week.benchmarks.squats}
                                                </span>
                                                <span className="text-muted-foreground/30 text-[10px]">/</span>
                                                <span className="inline-flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[22px]" title="Push-ups">
                                                    {week.benchmarks.pushups}
                                                </span>
                                                <span className="text-muted-foreground/30 text-[10px]">/</span>
                                                <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[22px]" title="Burpees">
                                                    {week.benchmarks.burpees}
                                                </span>
                                            </div>
                                        ) : <span className="text-muted-foreground/50">-</span>}
                                    </td>
                                )}
                            </tr>
                        ))}
                        {stats.length === 0 && (
                            <tr>
                                <td colSpan={hasBenchmarks ? 7 : 6} className="px-6 py-8 text-center text-muted-foreground italic">
                                    No weekly data available yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </PremiumCard>
    );
}
