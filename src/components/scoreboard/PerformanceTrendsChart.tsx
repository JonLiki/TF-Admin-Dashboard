'use client';

import React, { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { CHART_COLORS } from '@/lib/theme';
import { animated, useSpring } from 'react-spring';

export type TrendMetric = 'kmAverage' | 'weightLossTotal' | 'lifestyleAverage' | 'attendanceAverage';

interface PerformanceTrendsChartProps {
    data: Record<TrendMetric, any[]>;
    teams: string[];
    title?: string;
}

export function PerformanceTrendsChart({ data, teams, title = "Performance Trends" }: PerformanceTrendsChartProps) {
    const [activeMetric, setActiveMetric] = useState<TrendMetric>('kmAverage');

    // React Spring Animation for the card entrance
    const props = useSpring({
        to: { opacity: 1, y: 0 },
        from: { opacity: 0, y: 20 },
        config: { tension: 280, friction: 20 }
    });

    const metrics = [
        { id: 'kmAverage', label: 'KM Avg' },
        { id: 'weightLossTotal', label: 'Weight Loss' },
        { id: 'lifestyleAverage', label: 'Lifestyle' },
        { id: 'attendanceAverage', label: 'Attendance' }
    ];

    return (
        <animated.div style={props}>
            <PremiumCard className="p-6 relative overflow-visible">
                {/* Decorative Background Glow */}
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-tongan/10 blur-3xl rounded-full pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 relative z-10">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-white mb-1">{title}</h3>
                        <p className="text-sm text-slate-400">Compare team trajectories over the block.</p>
                    </div>

                    {/* Metric Selector Toggles */}
                    <div className="flex bg-black/40 backdrop-blur-md rounded-lg p-1 border border-white/10 mt-4 md:mt-0">
                        {metrics.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setActiveMetric(m.id as TrendMetric)}
                                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all duration-300 ${activeMetric === m.id
                                    ? 'bg-tongan text-white shadow-[0_0_15px_rgba(200,16,46,0.3)]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[350px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data[activeMetric]} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                fontFamily="var(--font-mono)"
                                dy={10}
                            />
                            <YAxis
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                fontFamily="var(--font-mono)"
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(11, 12, 16, 0.95)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(102, 252, 241, 0.2)',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                                    backdropFilter: 'blur(10px)',
                                    color: '#f8fafc',
                                    padding: '12px'
                                }}
                                itemStyle={{ color: '#E2E8F0', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                                labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px', fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8' }}
                                iconType="circle"
                            />

                            {teams.map((team, index) => (
                                <Line
                                    key={team}
                                    type="monotone"
                                    dataKey={team}
                                    stroke={CHART_COLORS.series[index % CHART_COLORS.series.length]}
                                    strokeWidth={3}
                                    dot={{ fill: CHART_COLORS.series[index % CHART_COLORS.series.length], strokeWidth: 2, r: 4, stroke: '#111827' }}
                                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                                    animationDuration={1500}
                                    animationEasing="ease-out"
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </PremiumCard>
        </animated.div>
    );
}
