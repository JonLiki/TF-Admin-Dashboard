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
    isCurrent: boolean;
}

interface MemberWeeklyTableProps {
    stats: WeeklyStat[];
}

export function MemberWeeklyTable({ stats }: MemberWeeklyTableProps) {
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
                            </tr>
                        ))}
                        {stats.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground italic">
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
