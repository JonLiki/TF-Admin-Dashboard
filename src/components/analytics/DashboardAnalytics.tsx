'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PremiumCard } from '../ui/PremiumCard';
import { Button } from '../ui/Components';
import { BarChart, Activity, Scale, Trophy, Medal } from 'lucide-react';
import { MetricAreaChart, MetricBarChart, AttendanceSessionChart } from './Charts';
import { cn } from '@/lib/utils';
import { Team, TeamWeekMetric, BlockWeek } from '@prisma/client';

type MetricType = 'points' | 'weight' | 'km' | 'attendance';

interface ExtendedMetric extends TeamWeekMetric {
    team: Team;
    blockWeek: BlockWeek;
}

interface DashboardAnalyticsProps {
    metrics: ExtendedMetric[];
    teams: Team[];
    title?: string;
    attendanceData?: Record<string, unknown>[];
}

interface WeekData {
    name: string;
    totalVal: number;
    count: number;
}

export default function DashboardAnalytics({ metrics, teams, attendanceData, title = "Group Performance Matrix" }: DashboardAnalyticsProps) {
    const [activeMetric, setActiveMetric] = useState<MetricType>('weight');

    // 1. Transform Data for Chart
    // 1. Transform Data for Chart
    const chartData = useMemo(() => {
        const weekMap = new Map<number, WeekData>();

        // Group metrics by week
        // We want to calculate ONE "Total" value for each week
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
                case 'points': val = m.pointsAwarded || 0; break;
                case 'weight': val = m.weightLossTotal || 0; break;
                case 'km': val = m.kmAverage || 0; break;
                case 'attendance': val = m.attendanceAverage || 0; break;
            }

            if (currentWeek) {
                currentWeek.totalVal += val;
                currentWeek.count += 1;
            }
        });

        // Convert map to array
        let results = Array.from(weekMap.values()).map(w => {
            // Determine how to aggregate "Total"
            // For Weight/Points: Sum is correct (Total block weight loss, total points awarded).
            // For KM/Attendance: Average is correct? "Total Average KM"? 
            // If User wants "Block Progress", usually "Total Weight Loss" (SUM).
            // But "Total KM"? Usually Average KM across cohort.

            let finalVal = w.totalVal;
            if (activeMetric === 'km' || activeMetric === 'attendance') {
                finalVal = w.totalVal / (w.count || 1); // Average of averages
            }

            return {
                name: w.name,
                Total: Number(finalVal.toFixed(2))
            };
        });

        // Logic for Cumulative
        if (activeMetric === 'points' || activeMetric === 'weight') {
            let runningTotal = 0;
            results = results.map(r => {
                runningTotal += r.Total;
                return { ...r, Total: Number(runningTotal.toFixed(2)) };
            });
        }

        return results;

    }, [metrics, activeMetric]);

    // 2. Calculate Table Stats (Aggregate)
    const tableData = useMemo(() => {
        return teams.map(team => {
            const teamMetrics = metrics.filter(m => m.teamId === team.id);

            const totalPoints = teamMetrics.reduce((sum, m) => sum + (m.pointsAwarded || 0), 0);
            const totalWeight = teamMetrics.reduce((sum, m) => sum + (m.weightLossTotal || 0), 0);
            const totalKm = teamMetrics.reduce((sum, m) => sum + (m.kmAverage || 0), 0); // Sum of averages is weird, strict sum of KM total? We don't have raw KM total here easily without joining logs. But `kmAverage` * memberCount? 
            // Actually `kmAverage` is avg per member. `kmTotal` isn't on the metric. 
            // Let's just average the averages for "Season Avg".
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
            if (activeMetric === 'points') return b.points - a.points;
            if (activeMetric === 'weight') return b.weight - a.weight;
            if (activeMetric === 'km') return b.avgKm - a.avgKm;
            return b.avgAtt - a.avgAtt;
        });
    }, [metrics, teams, activeMetric]);


    return (
        <PremiumCard className="p-0 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-ocean-deep">
                <div>
                    <h3 className="text-xl font-semibold text-white tracking-tight">{title}</h3>
                    <p className="text-xs font-normal text-slate-400 mt-1">Weekly Metrics Breakdown</p>
                </div>

                <div className="flex bg-ocean/20 p-1 rounded-lg border border-white/5 shadow-inner">
                    <TabButton
                        active={activeMetric === 'weight'}
                        onClick={() => setActiveMetric('weight')}
                        icon={Scale}
                        label="Weight"
                    />
                    <TabButton
                        active={activeMetric === 'points'}
                        onClick={() => setActiveMetric('points')}
                        icon={Trophy}
                        label="Points"
                    />
                    <TabButton
                        active={activeMetric === 'km'}
                        onClick={() => setActiveMetric('km')}
                        icon={Activity}
                        label="KM"
                    />
                    <TabButton
                        active={activeMetric === 'attendance'}
                        onClick={() => setActiveMetric('attendance')}
                        icon={UsersIcon}
                        label="Attendance"
                    />
                </div>
            </div>

            <div className="p-6 bg-ocean-deep">
                <motion.div
                    key={activeMetric}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <div className="h-[350px] w-full mb-8">
                        {activeMetric === 'weight' && (
                            <MetricAreaChart
                                data={chartData}
                                title="Cumulative Weight Loss"
                                color="#C8102E" // Tongan Red
                                unit="kg"
                            />
                        )}
                        {activeMetric === 'points' && (
                            <MetricAreaChart
                                data={chartData}
                                title="Total Points Awarded"
                                color="#1C7293" // Lagoon
                                unit="pts"
                            />
                        )}
                        {activeMetric === 'km' && (
                            <MetricBarChart
                                data={chartData}
                                title="Total Distance"
                                color="#0B3C5D" // Ocean
                                unit="km"
                            />
                        )}
                        {activeMetric === 'attendance' && (
                            <AttendanceSessionChart data={attendanceData || []} />
                        )}
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-white/5">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gradient-to-r from-ocean-deep via-ocean to-ocean-deep text-white font-semibold uppercase tracking-wider text-xs border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-lg">Group</th>
                                    <th className="px-6 py-4 text-right">Total Points</th>
                                    <th className="px-6 py-4 text-right">Total Weight Loss</th>
                                    <th className="px-6 py-4 text-right">Avg KM / Wk</th>
                                    <th className="px-6 py-4 text-right rounded-tr-lg">Avg Att / Wk</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-ocean-deep">
                                {tableData.map((row, index) => (
                                    <tr key={row.id} className={cn(
                                        "transition-all duration-200 group border-l-4 border-transparent hover:border-lagoon",
                                        index % 2 === 0 ? "bg-ocean-deep" : "bg-white/5", // Zebra striping
                                        "hover:bg-white/10 hover:shadow-inner"
                                    )}>
                                        <td className="px-6 py-4 font-medium text-slate-300 group-hover:text-white transition-colors">{row.name}</td>
                                        <td className={cn("px-6 py-4 text-right font-mono text-slate-300 group-hover:text-white", activeMetric === 'points' && "font-black text-lagoon-100 bg-lagoon/5")}>
                                            {row.points}
                                        </td>
                                        <td className={cn("px-6 py-4 text-right font-mono text-slate-300 group-hover:text-white", activeMetric === 'weight' && "font-black text-tongan bg-tongan/5")}>
                                            {row.weight.toFixed(1)} kg
                                        </td>
                                        <td className={cn("px-6 py-4 text-right font-mono text-slate-300 group-hover:text-white", activeMetric === 'km' && "font-black text-ocean-light bg-ocean-light/5")}>
                                            {row.avgKm.toFixed(1)} km
                                        </td>
                                        <td className={cn("px-6 py-4 text-right font-mono text-slate-300 group-hover:text-white", activeMetric === 'attendance' && "font-black text-ocean bg-ocean/5")}>
                                            {row.avgAtt.toFixed(1)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </PremiumCard>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: React.ElementType, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ease-out",
                active
                    ? "bg-lagoon text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
        >
            <Icon className={cn("w-4 h-4", active ? "text-white" : "stroke-[2.5px] opacity-70")} />
            <span className="hidden sm:inline">{label}</span>
        </button>
    )
}

function getSubtitle(metric: MetricType) {
    switch (metric) {
        case 'points': return "Total Points Awarded";
        case 'weight': return "Total Weight Loss (kg)";
        case 'km': return "Cohort Average Distance (km)";
        case 'attendance': return "Cohort Average Attendance (sessions)";
    }
}

function getMetricColor(metric: MetricType) {
    switch (metric) {
        case 'points': return ['#1C7293']; // Lagoon
        case 'weight': return ['#C8102E']; // Tongan Red
        case 'km': return ['#0B3C5D']; // Ocean Navy
        case 'attendance': return ['#1F2933']; // Charcoal
    }
}

// Icon wrapper
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
    // Re-importing Users inside component file is messy, relying on lucide import
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
