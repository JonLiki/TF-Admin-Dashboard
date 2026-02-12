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
    const chartData = useMemo(() => {
        // 1. Aggregate totals per team
        const teamStats = teams.map(team => {
            const teamMetrics = metrics.filter(m => m.teamId === team.id);

            const totalWeight = teamMetrics.reduce((sum, m) => sum + (m.weightLossTotal || 0), 0);
            // const totalKm = teamMetrics.reduce((sum, m) => sum + (m.kmAverage || 0), 0) * teamMetrics.length; 
            // Actually, looking at previous logic:
            // avgKm = sum(kmAverage) / count.
            // For Radar, we probably want "Performance" which could be Total or Average.
            // Let's stick to TOTALS for Weight/KM/Lifestyle if possible, or Average for Attendance.

            // Let's use what DashboardAnalytics uses:
            // weight: sum(weightLossTotal)
            // avgKm: average of kmAverage (which is per member per week?) 
            // Actually teamWeekMetric.kmAverage is "Team Average KM". So avg of avg is the Block Average.

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

        // 2. Find Maximums for Normalization
        const maxValues = {
            Weight: Math.max(...teamStats.map(t => t.stats.Weight), 1),
            KM: Math.max(...teamStats.map(t => t.stats.KM), 1),
            Lifestyle: Math.max(...teamStats.map(t => t.stats.Lifestyle), 1),
            Attendance: 100 // Attendance is always max 100%
        };

        // 3. Transform for Recharts Radar
        // Recharts Radar expects data like:
        // [ { subject: 'Weight', TeamA: 100, TeamB: 50, fullMark: 100 }, ... ]

        // We want to compare Top 3 Teams usually? Or user selected?
        // Let's take Top 3 by overall points (approximation) or just first 3 for now.
        // Ideally we pass in "Active Teams" or similar. For now, let's just plot all if low count, or top 3.
        const topTeams = teamStats.slice(0, 3); // Todo: meaningful sort?

        const categories = ['Weight', 'KM', 'Lifestyle', 'Attendance'] as const;

        return categories.map(category => {
            const dataPoint: RadarDataPoint = { subject: category, fullMark: 100 };

            topTeams.forEach((team) => {
                const rawValue = team.stats[category];
                const maxValue = maxValues[category];
                // Normalize to 0-100
                const normalized = (rawValue / maxValue) * 100;

                dataPoint[team.name] = Math.round(normalized);
                dataPoint[`${team.name}_raw`] = rawValue.toFixed(1); // Store raw for tooltip if needed custom
            });

            return dataPoint;
        });

    }, [teams, metrics]);

    // Colors for different teams
    const colors = ['#C8102E', '#F2A900', '#00B8D4']; // Tongan Red, Yellow, Cyan/Lagoon

    return (
        <div className={className}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#ffffff33" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

                    {Object.keys(chartData[0] || {})
                        .filter(k => k !== 'subject' && k !== 'fullMark' && !k.endsWith('_raw'))
                        .map((teamName, index) => (
                            <Radar
                                key={teamName}
                                name={teamName}
                                dataKey={teamName}
                                stroke={colors[index % colors.length]}
                                fill={colors[index % colors.length]}
                                fillOpacity={0.3}
                            />
                        ))}

                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-ocean-deep border border-lagoon/20 p-3 rounded-lg shadow-xl backdrop-blur-md">
                                        <p className="text-white font-bold mb-2">{label}</p>
                                        {(payload as unknown as TooltipPayload[]).map((p) => (
                                            <div key={p.name} className="flex items-center gap-2 text-xs text-slate-300">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                                <span>{p.name}:</span>
                                                <span className="font-mono text-white">
                                                    {/* Attempt to show raw value if possible, else show normalized score */}
                                                    {p.value}% (Relative)
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
