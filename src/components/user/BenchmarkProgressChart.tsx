'use client';

import React from 'react';
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
import { Dumbbell } from 'lucide-react';

export interface BenchmarkLog {
    blockWeek: {
        weekNumber: number;
    };
    squats: number;
    pushups: number;
    burpees: number;
}

interface BenchmarkProgressChartProps {
    logs: BenchmarkLog[];
}

export function BenchmarkProgressChart({ logs }: BenchmarkProgressChartProps) {
    if (!logs || logs.length === 0) {
        return null; // Don't render anything if no data yet
    }

    // Transform logs into chart data format
    const chartData = logs.map(log => ({
        week: `Week ${log.blockWeek.weekNumber}`,
        Squats: log.squats,
        Pushups: log.pushups,
        Burpees: log.burpees
    }));

    return (
        <PremiumCard className="p-6 relative overflow-visible border-lagoon/30 bg-gradient-to-br from-ocean-deep to-[#0a111a]">
            {/* Decorative Background Glow */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-lagoon/10 blur-3xl rounded-full pointer-events-none" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-lagoon/20 rounded-xl border border-lagoon/30">
                    <Dumbbell className="w-5 h-5 text-lagoon-100" />
                </div>
                <div>
                    <h3 className="text-xl font-bold tracking-tight text-foreground mb-1">Benchmark Progress</h3>
                    <p className="text-sm text-foreground/60">Track your maximum reps over the block.</p>
                </div>
            </div>

            <div className="h-[350px] w-full relative z-10 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                            dataKey="week"
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
                            itemStyle={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                            labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}
                            iconType="circle"
                        />

                        {/* Squats Line */}
                        <Line
                            type="monotone"
                            dataKey="Squats"
                            stroke="var(--color-lagoon)" // lagoon
                            strokeWidth={3}
                            dot={{ fill: 'var(--color-lagoon)', strokeWidth: 2, r: 4, stroke: 'var(--color-ocean-deep)' }}
                            activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--foreground)' }}
                        />
                        
                        {/* Pushups Line */}
                        <Line
                            type="monotone"
                            dataKey="Pushups"
                            stroke="var(--color-tongan)" // tongan
                            strokeWidth={3}
                            dot={{ fill: 'var(--color-tongan)', strokeWidth: 2, r: 4, stroke: 'var(--color-ocean-deep)' }}
                            activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--foreground)' }}
                        />

                        {/* Burpees Line */}
                        <Line
                            type="monotone"
                            dataKey="Burpees"
                            stroke="var(--color-steel)" // silver/slate
                            strokeWidth={3}
                            dot={{ fill: 'var(--color-steel)', strokeWidth: 2, r: 4, stroke: 'var(--color-ocean-deep)' }}
                            activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--foreground)' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </PremiumCard>
    );
}
