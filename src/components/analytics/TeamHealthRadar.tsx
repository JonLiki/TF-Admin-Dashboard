'use client';

import { useMemo } from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import { Team, TeamWeekMetric } from '@prisma/client';
import { CHART_COLORS } from '@/lib/theme';

interface ExtendedMetric extends TeamWeekMetric {
    teamId: string;
}

interface TeamHealthRadarProps {
    teams: Team[];
    metrics: ExtendedMetric[];
    className?: string;
}

interface RadarDataPoint {
    subject: string;
    fullMark: number;
    [key: string]: string | number;
}

interface TooltipPayload {
    name: string;
    value: number;
    color: string;
    payload: RadarDataPoint;
}

export function TeamHealthRadar({ teams, metrics, className }: TeamHealthRadarProps) {
    const { chartData, topTeams, hasData } = useMemo(() => {
        if (!teams || teams.length === 0) {
            return { chartData: [], topTeams: [], hasData: false };
        }

        // 1. Aggregate totals per team
        const teamStats = teams.map(team => {
            const teamMetrics = metrics.filter(m => m.teamId === team.id);

            const totalWeight = teamMetrics.reduce((sum, m) => sum + (m.weightLossTotal || 0), 0);
            const avgKm = teamMetrics.reduce((sum, m) => sum + (m.kmAverage || 0), 0) / (teamMetrics.length || 1);
            const avgLife = teamMetrics.reduce((sum, m) => sum + (m.lifestyleAverage || 0), 0) / (teamMetrics.length || 1);
            const avgAtt = teamMetrics.reduce((sum, m) => sum + (m.attendanceAverage || 0), 0) / (teamMetrics.length || 1);

            return {
                id: team.id,
                name: team.name,
                stats: {
                    Weight: Math.max(0, totalWeight), // Ensure non-negative for chart
                    KM: avgKm,
                    Lifestyle: avgLife,
                    Attendance: avgAtt
                }
            };
        });

        // Check if we have ANY data (sum of all stats > 0)
        const totalSum = teamStats.reduce((acc, t) =>
            acc + t.stats.Weight + t.stats.KM + t.stats.Lifestyle + t.stats.Attendance, 0
        );

        // 2. Find Maximums for Normalization
        const maxValues = {
            Weight: Math.max(...teamStats.map(t => t.stats.Weight), 1),
            KM: Math.max(...teamStats.map(t => t.stats.KM), 1),
            Lifestyle: Math.max(...teamStats.map(t => t.stats.Lifestyle), 1),
            Attendance: 100 // Attendance is always max 100%
        };

        // 3. Transform for Recharts Radar
        // Sort by Weight logic matching the dashboard, or just take first 3
        const sortedTeams = teamStats
            .sort((a, b) => b.stats.Weight - a.stats.Weight)
            .slice(0, 3);

        const categories = ['Weight', 'KM', 'Lifestyle', 'Attendance'] as const;

        const data = categories.map(category => {
            const dataPoint: RadarDataPoint = { subject: category, fullMark: 100 };

            sortedTeams.forEach((team) => {
                const rawValue = team.stats[category];
                const maxValue = maxValues[category];
                // Normalize to 0-100
                const normalized = (rawValue / maxValue) * 100;

                dataPoint[team.name] = Math.round(normalized);
                dataPoint[`${team.name}_raw`] = rawValue.toFixed(1); // Store raw for tooltip if needed custom
            });

            return dataPoint;
        });

        return {
            chartData: data,
            topTeams: sortedTeams.map(t => t.name),
            hasData: totalSum > 0
        };

    }, [teams, metrics]);

    // Colors for different teams - Tongan Marvel Palette
    const colors = CHART_COLORS.series.slice(0, 3);

    if (!teams || teams.length === 0) {
        return (
            <div className={`flex items-center justify-center ${className} h-full`}>
                <p className="text-slate-500 text-sm">No teams available</p>
            </div>
        );
    }

    if (!hasData) {
        return (
            <div className={`flex flex-col items-center justify-center ${className} h-full`}>
                <Radar className="w-12 h-12 text-slate-700 mb-2 opacity-20" />
                <p className="text-slate-500 text-sm">No metrics recorded yet</p>
            </div>
        );
    }

    return (
        <div className={className || "w-full h-full"}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <defs>
                        {colors.map((color, index) => (
                            <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                            </linearGradient>
                        ))}
                    </defs>
                    <PolarGrid stroke="#66FCF120" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#C5C6C7', fontSize: 12, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

                    {topTeams.map((teamName, index) => (
                        <Radar
                            key={teamName}
                            name={teamName}
                            dataKey={teamName}
                            stroke={colors[index % colors.length]}
                            strokeWidth={3}
                            fill={`url(#gradient-${index % colors.length})`}
                            fillOpacity={0.4}
                        />
                    ))}

                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-[#0B0C10]/80 backdrop-blur-md border border-[#66FCF1]/30 p-4 rounded-xl shadow-[0_0_15px_rgba(102,252,241,0.15)]">
                                        <p className="text-[#66FCF1] font-bold mb-3 border-b border-[#66FCF1]/10 pb-2 uppercase tracking-wider text-glow">{label}</p>
                                        {(payload as unknown as TooltipPayload[]).map((p) => (
                                            <div key={p.name} className="flex items-center gap-3 text-sm text-[#C5C6C7] mb-1 last:mb-0">
                                                <span className="w-3 h-3 rounded-full border border-white/10 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: p.color, color: p.color }} />
                                                <span className="flex-1 font-semibold">{p.name}:</span>
                                                <span className="font-mono text-white font-bold">
                                                    {p.value}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
