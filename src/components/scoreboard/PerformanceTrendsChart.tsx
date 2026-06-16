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
import { CHART_SERIES } from '@/lib/theme';
import { animated, useSpring } from 'react-spring';

import { TrendDataPoint } from '@/lib/transformers/scoreboard';

export type TrendMetric = 'kmAverage' | 'weightLossTotal' | 'lifestyleAverage' | 'attendanceAverage';

interface PerformanceTrendsChartProps {
    data: Record<TrendMetric, TrendDataPoint[]>;
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
                        <h3 className="text-xl font-bold tracking-tight text-foreground mb-1">{title}</h3>
                        <p className="text-sm text-foreground/60">Compare team trajectories over the block.</p>
                    </div>

                    {/* Metric Selector Toggles */}
                    <div className="flex bg-black/40 backdrop-blur-md rounded-lg p-1 border border-white/10 mt-4 md:mt-0">
                        {metrics.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setActiveMetric(m.id as TrendMetric)}
                                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all duration-300 ${activeMetric === m.id
                                    ? 'bg-tongan text-white shadow-[0_0_15px_rgba(200,16,46,0.3)]'
                                    : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
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
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="var(--color-text-secondary)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={{ stroke: 'var(--border)' }}
                                fontFamily="var(--font-mono)"
                                dy={10}
                            />
                            <YAxis
                                stroke="var(--color-text-secondary)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                fontFamily="var(--font-mono)"
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--popover-background)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-lagoon)',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                                    backdropFilter: 'blur(10px)',
                                    color: 'var(--foreground)',
                                    padding: '12px'
                                }}
                                itemStyle={{ color: 'var(--foreground)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                                labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}
                                iconType="circle"
                            />

                            {teams.map((team, index) => (
                                <Line
                                    key={team}
                                    type="monotone"
                                    dataKey={team}
                                    stroke={CHART_SERIES[index % CHART_SERIES.length]}
                                    strokeWidth={3}
                                    dot={{ fill: CHART_SERIES[index % CHART_SERIES.length], strokeWidth: 2, r: 4, stroke: 'var(--color-ocean-deep)' }}
                                    activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--foreground)' }}
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
