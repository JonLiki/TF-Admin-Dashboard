'use client';

import { cn } from '@/lib/utils';
import { MetricType } from '@/components/dashboard/MetricTabs';

interface TableRow {
    id: string;
    name: string;
    points: number;
    weight: number;
    avgKm: number;
    avgAtt: number;
    avgLife: number;
}

interface AnalyticsTableProps {
    data: TableRow[];
    activeMetric: MetricType;
}

const rankBorderColors = [
    'border-l-tongan', // 1st - Red/Gold
    'border-l-lagoon', // 2nd - Cyan
    'border-l-amber-600', // 3rd - Bronze
];

export function AnalyticsTable({ data, activeMetric }: AnalyticsTableProps) {
    return (
        <div className="overflow-x-auto rounded-xl border border-white/5 shadow-lg">
            <table className="w-full text-sm text-left">
                <thead className="bg-ocean-deep/80 backdrop-blur-md text-white font-semibold uppercase tracking-wider text-xs border-b border-white/10 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-4 rounded-tl-xl">Group</th>
                        <th className="px-6 py-4 text-right font-mono">Total Points</th>
                        <th className="px-6 py-4 text-right font-mono">Weight Loss</th>
                        <th className="px-6 py-4 text-right font-mono">Avg KM / Wk</th>
                        <th className="px-6 py-4 text-right font-mono">Avg Lifestyle</th>
                        <th className="px-6 py-4 text-right rounded-tr-xl font-mono">Avg Att / Wk</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-ocean-deep">
                    {data.map((row, index) => (
                        <tr key={row.id} className={cn(
                            "transition-all duration-200 group border-l-4",
                            // Rank-colored left border for top 3
                            rankBorderColors[index] || "border-transparent",
                            // Improved zebra striping
                            index % 2 === 0 ? "bg-ocean-deep" : "bg-white/[0.02]",
                            "hover:bg-white/[0.06] hover:shadow-[inset_0_0_20px_rgba(102,252,241,0.03)]"
                        )}>
                            <td className="px-6 py-4 font-medium text-slate-300 group-hover:text-white transition-colors">
                                <span className="flex items-center gap-2">
                                    {index < 3 && <span className="text-xs">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>}
                                    {row.name}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-300 group-hover:text-white tabular-nums">
                                {row.points}
                            </td>
                            <td className={cn("px-6 py-4 text-right font-mono tabular-nums text-slate-300 group-hover:text-white", activeMetric === 'weight' && "font-black text-tongan bg-tongan/5")}>
                                {row.weight.toFixed(1)} kg
                            </td>
                            <td className={cn("px-6 py-4 text-right font-mono tabular-nums text-slate-300 group-hover:text-white", activeMetric === 'km' && "font-black text-ocean-light bg-ocean-light/5")}>
                                {row.avgKm.toFixed(2)} km
                            </td>
                            <td className={cn("px-6 py-4 text-right font-mono tabular-nums text-slate-300 group-hover:text-white", activeMetric === 'lifestyle' && "font-black text-emerald-400 bg-emerald-500/5")}>
                                {row.avgLife.toFixed(1)}
                            </td>
                            <td className={cn("px-6 py-4 text-right font-mono tabular-nums text-slate-300 group-hover:text-white", activeMetric === 'attendance' && "font-black text-ocean bg-ocean/5")}>
                                {row.avgAtt.toFixed(1)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

