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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#C8102E" strokeWidth={3} dot={{ r: 4, fill: "#C8102E" }} />
                </LineChart>
            </ResponsiveContainer>
            {data.length < 2 && <p className="text-center text-sm text-gray-500 mt-4">Need more weigh-ins to show a trend.</p>}
        </div>
    );
}
