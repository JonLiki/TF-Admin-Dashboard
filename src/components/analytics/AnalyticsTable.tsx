'use client';

import { cn } from '@/lib/utils';
import { MetricType } from './DashboardAnalytics';

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

export function AnalyticsTable({ data, activeMetric }: AnalyticsTableProps) {
    return (
        <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full text-sm text-left">
                <thead className="bg-gradient-to-r from-ocean-deep via-ocean to-ocean-deep text-white font-semibold uppercase tracking-wider text-xs border-b border-white/10">
                    <tr>
                        <th className="px-6 py-4 rounded-tl-lg">Group</th>
                        <th className="px-6 py-4 text-right">Total Points</th>
                        <th className="px-6 py-4 text-right">Weight Loss</th>
                        <th className="px-6 py-4 text-right">Avg KM / Wk</th>
                        <th className="px-6 py-4 text-right">Avg Lifestyle</th>
                        <th className="px-6 py-4 text-right rounded-tr-lg">Avg Att / Wk</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-ocean-deep">
                    {data.map((row, index) => (
                        <tr key={row.id} className={cn(
                            "transition-all duration-200 group border-l-4 border-transparent hover:border-lagoon",
                            index % 2 === 0 ? "bg-ocean-deep" : "bg-white/5", // Zebra striping
                            "hover:bg-white/10 hover:shadow-inner"
                        )}>
                            <td className="px-6 py-4 font-medium text-slate-300 group-hover:text-white transition-colors">{row.name}</td>
                            <td className="px-6 py-4 text-right font-mono text-slate-300 group-hover:text-white">
                                {row.points}
                            </td>
                            <td className={cn("px-6 py-4 text-right font-mono text-slate-300 group-hover:text-white", activeMetric === 'weight' && "font-black text-tongan bg-tongan/5")}>
                                {row.weight.toFixed(1)} kg
                            </td>
                            <td className={cn("px-6 py-4 text-right font-mono text-slate-300 group-hover:text-white", activeMetric === 'km' && "font-black text-ocean-light bg-ocean-light/5")}>
                                {row.avgKm.toFixed(1)} km
                            </td>
                            <td className={cn("px-6 py-4 text-right font-mono text-slate-300 group-hover:text-white", activeMetric === 'lifestyle' && "font-black text-emerald-400 bg-emerald-500/5")}>
                                {row.avgLife.toFixed(1)}
                            </td>
                            <td className={cn("px-6 py-4 text-right font-mono text-slate-300 group-hover:text-white", activeMetric === 'attendance' && "font-black text-ocean bg-ocean/5")}>
                                {row.avgAtt.toFixed(1)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
