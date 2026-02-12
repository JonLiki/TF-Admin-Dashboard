'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MemberWeightChartProps {
    data: { date: string; weight: number }[];
}

export default function MemberWeightChart({ data }: MemberWeightChartProps) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-50" />
                    <XAxis
                        dataKey="date"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--foreground)"
                        className="opacity-70"
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--foreground)"
                        className="opacity-70"
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--card-background)',
                            color: 'var(--card-foreground)',
                            boxShadow: 'var(--shadow-md)'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="var(--color-primary)"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "var(--color-primary)" }}
                        activeDot={{ r: 6, fill: "var(--color-primary)" }}
                    />
                </LineChart>
            </ResponsiveContainer>
            {data.length < 2 && <p className="text-center text-sm text-muted-foreground mt-4">Need more weigh-ins to show a trend.</p>}
        </div>
    );
}
