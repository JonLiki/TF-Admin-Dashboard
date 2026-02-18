'use client';

import { useState, useMemo } from 'react';
import { PremiumCard } from '../ui/PremiumCard';
import { MetricTabs, MetricType } from '@/components/dashboard/MetricTabs';
import { cn } from '@/lib/utils';
import { Team, TeamWeekMetric, BlockWeek } from '@prisma/client';
import { AnalyticsCharts } from './AnalyticsCharts';
import { AnalyticsTable } from './AnalyticsTable';
import { TeamHealthRadar } from './TeamHealthRadar';
import { AttendanceDataPoint } from './Charts';

interface ExtendedMetric extends TeamWeekMetric {
    team: Team;
    blockWeek: BlockWeek;
}

interface DashboardAnalyticsProps {
    metrics: ExtendedMetric[];
    teams: Team[];
    title?: string;
    attendanceData?: AttendanceDataPoint[];
    weeklyTotals?: { weekNumber: number; totalKm: number; totalLifestyle: number }[];
}

interface WeekData {
    name: string;
    totalVal: number;
    count: number;
}

export default function DashboardAnalytics({ metrics, teams, attendanceData, weeklyTotals, title = "Group Performance Matrix" }: DashboardAnalyticsProps) {
    const [activeMetric, setActiveMetric] = useState<MetricType>('weight');
    const [viewMode, setViewMode] = useState<'charts' | 'radar'>('charts');

    // 1. Transform Data for Chart
    const chartData = useMemo(() => {
        // Handle pre-calculated totals for KM and Lifestyle
        if (activeMetric === 'km' || activeMetric === 'lifestyle') {
            if (!weeklyTotals) return [];
            return weeklyTotals.map(w => ({
                name: `W${w.weekNumber}`,
                Total: activeMetric === 'km' ? Number(w.totalKm.toFixed(1)) : w.totalLifestyle
            }));
        }

        const weekMap = new Map<number, WeekData>();

        // Group metrics by week
        const sortedMetrics = [...metrics].sort((a, b) => a.blockWeek.weekNumber - b.blockWeek.weekNumber);

        sortedMetrics.forEach(m => {
            const weekNum = m.blockWeek.weekNumber;
            const weekKey = `W${weekNum}`;

            if (!weekMap.has(weekNum)) {
                weekMap.set(weekNum, { name: weekKey, totalVal: 0, count: 0 });
            }

            const currentWeek = weekMap.get(weekNum);

            let val = 0;
            switch (activeMetric) {
                case 'weight': val = m.weightLossTotal || 0; break;
                // case 'attendance': val = m.attendanceAverage || 0; break; // Attendance has its own chart
            }

            if (currentWeek) {
                currentWeek.totalVal += val;
                currentWeek.count += 1;
            }
        });

        // Convert map to array
        let results = Array.from(weekMap.values()).map(w => {
            const finalVal = w.totalVal;
            // For weight, we want the SUM (Total Block Weight Loss)
            return {
                name: w.name,
                Total: Number(finalVal.toFixed(2))
            };
        });

        // Logic for Cumulative Weight
        if (activeMetric === 'weight') {
            let runningTotal = 0;
            results = results.map(r => {
                runningTotal += r.Total;
                return { ...r, Total: Number(runningTotal.toFixed(2)) };
            });
        }

        return results;

    }, [metrics, activeMetric, weeklyTotals]);

    // 2. Calculate Table Stats (Aggregate)
    const tableData = useMemo(() => {
        return teams.map(team => {
            const teamMetrics = metrics.filter(m => m.teamId === team.id);

            const totalPoints = teamMetrics.reduce((sum, m) => sum + (m.pointsAwarded || 0), 0);
            const totalWeight = teamMetrics.reduce((sum, m) => sum + (m.weightLossTotal || 0), 0);
            const avgKm = teamMetrics.reduce((sum, m) => sum + (m.kmAverage || 0), 0) / (teamMetrics.length || 1);
            const avgAtt = teamMetrics.reduce((sum, m) => sum + (m.attendanceAverage || 0), 0) / (teamMetrics.length || 1);
            const avgLife = teamMetrics.reduce((sum, m) => sum + (m.lifestyleAverage || 0), 0) / (teamMetrics.length || 1);

            return {
                id: team.id,
                name: team.name,
                points: totalPoints,
                weight: totalWeight,
                avgKm,
                avgAtt,
                avgLife
            };
        }).sort((a, b) => {
            // Sort by active metric
            if (activeMetric === 'weight') return b.weight - a.weight;
            if (activeMetric === 'km') return b.avgKm - a.avgKm;
            if (activeMetric === 'lifestyle') return b.avgLife - a.avgLife;
            // Default or attendance
            return b.avgAtt - a.avgAtt;
        });
    }, [metrics, teams, activeMetric]);


    return (
        <PremiumCard className="p-0 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-ocean-deep">
                <div className="flex items-center gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-white tracking-tight">{title}</h3>
                        <p className="text-xs font-normal text-slate-400 mt-1">Weekly Metrics Breakdown</p>
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-ocean/20 rounded-lg p-0.5 border border-white/5 ml-4">
                        <button
                            onClick={() => setViewMode('charts')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
                                viewMode === 'charts' ? "bg-lagoon text-white shadow-sm" : "text-slate-400 hover:text-white"
                            )}
                        >
                            Trends
                        </button>
                        <button
                            onClick={() => setViewMode('radar')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
                                viewMode === 'radar' ? "bg-tongan text-white shadow-sm" : "text-slate-400 hover:text-white"
                            )}
                        >
                            Radar
                        </button>
                    </div>
                </div>

                {viewMode === 'charts' && (
                    <MetricTabs activeMetric={activeMetric} onChange={setActiveMetric} />
                )}
            </div>

            <div className="p-6 bg-ocean-deep">
                {viewMode === 'charts' ? (
                    <AnalyticsCharts
                        activeMetric={activeMetric}
                        chartData={chartData}
                        attendanceData={attendanceData}
                    />
                ) : (
                    <div className="h-[400px] w-full mb-8 flex flex-col">
                        <TeamHealthRadar teams={teams} metrics={metrics} className="flex-1 w-full min-h-0" />
                        <p className="text-center text-xs text-slate-500 mt-2">
                            Visualizes team balance across all 4 metrics. Higher values indicate better performance relative to other teams.
                        </p>
                    </div>
                )}

                <AnalyticsTable
                    data={tableData}
                    activeMetric={activeMetric}
                />
            </div>
        </PremiumCard>
    );
}
