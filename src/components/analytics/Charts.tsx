'use client';

import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import { PremiumCard } from '../ui/PremiumCard';

interface ChartProps {
    data: Record<string, string | number>[];
    colors?: string[];
    title: string;
    subtitle?: string;
}

const COLORS = ['#C8102E', '#1C7293', '#0B3C5D', '#FBB117', '#8884d8'];

export function TeamComparisonChart({ data, title, subtitle, colors }: ChartProps) {
    // Extract team keys dynamically (exclude 'name' or 'week')
    const keys = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'name' && k !== 'week') : [];
    const chartColors = colors || COLORS;

    return (
        <PremiumCard className="p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            label={{ value: '', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#051621',
                                borderRadius: '12px',
                                border: '1px solid #1C7293',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                                color: '#f8fafc',
                                padding: '12px'
                            }}
                            itemStyle={{ color: '#E2E8F0', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        {keys.map((key, index) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={chartColors[index % chartColors.length]}
                                strokeWidth={3}
                                dot={{ r: 4, fill: chartColors[index % chartColors.length], strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </PremiumCard>
    );
}

export function TotalProgressChart({ data, title, subtitle }: ChartProps) {
    return (
        <PremiumCard className="p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#C8102E" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#C8102E" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            hide
                        />
                        <Tooltip
                            cursor={{ stroke: '#C8102E', strokeWidth: 1, strokeDasharray: '4 4' }}
                            contentStyle={{
                                backgroundColor: '#051621',
                                borderRadius: '12px',
                                border: '1px solid #1C7293',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                                color: '#f8fafc',
                                padding: '12px'
                            }}
                            itemStyle={{ color: '#E2E8F0', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#C8102E"
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                            strokeWidth={3}
                            name="Total Loss (kg)"
                        />
                        {/* Display value labels on top of points? Maybe cleaner without */}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </PremiumCard>
    );
}

// --- REUSABLE VOYAGER CHARTS ---

export function AttendanceSessionChart({ data }: { data: Record<string, any>[] }) {
    if (!data || data.length === 0) return (
        <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            No attendance data available yet.
        </div>
    );

    const formattedData = data.map(d => ({
        ...d,
        displayDate: new Date(d.date).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' }),
        tooltipDate: new Date(d.date).toLocaleDateString('en-NZ', { weekday: 'short', month: 'long', day: 'numeric' })
    }));

    return (
        <PremiumCard className="p-0 border-none shadow-none bg-transparent">
            {/* Header removed as it is handled in parent */}
            <div className="h-[350px] w-full p-4">
                {/* Background Gradient for Depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep/50 to-transparent rounded-xl pointer-events-none" />

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedData} margin={{ top: 20, right: 30, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1C7293" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#1C7293" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
                        <XAxis
                            dataKey="displayDate"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            fontFamily="var(--font-mono)"
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            unit="%"
                            domain={[0, 100]}
                            dx={-10}
                            fontFamily="var(--font-mono)"
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#051621',
                                borderRadius: '12px',
                                border: '1px solid #1C7293',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                                color: '#f8fafc',
                                padding: '12px'
                            }}
                            itemStyle={{ color: '#bae6fd', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            formatter={(value: number | undefined) => [`${value}%`, 'Attendance']}
                            labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0) {
                                    return (payload[0].payload as any).tooltipDate + ` (${(payload[0].payload as any).type})`;
                                }
                                return label;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="percentage"
                            stroke="#1C7293"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorAttendance)"
                            activeDot={{ r: 6, strokeWidth: 4, stroke: "#051621", fill: '#fff' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </PremiumCard>
    );
}

export function MetricAreaChart({ data, color = "#1C7293", unit = "", title }: { data: Record<string, any>[], color?: string, unit?: string, title?: string }) {
    return (
        <PremiumCard className="p-0 border-none shadow-none bg-transparent">
            <div className="h-[350px] w-full p-4 relative">
                {/* Background Gradient for Depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep/50 to-transparent rounded-xl pointer-events-none" />

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`colorGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            fontFamily="var(--font-mono)"
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            unit={unit}
                            dx={-5}
                            fontFamily="var(--font-mono)"
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#051621',
                                borderRadius: '12px',
                                border: '1px solid #1C7293',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                                color: '#f8fafc',
                                padding: '12px'
                            }}
                            itemStyle={{ color: '#E2E8F0', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            formatter={(value: number | undefined) => [`${value}${unit}`, title || 'Value']}
                            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="Total"
                            stroke={color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#colorGradient-${color})`}
                            activeDot={{ r: 6, strokeWidth: 4, stroke: '#051621', fill: color }}
                            animationDuration={1500}
                            animationEasing="ease-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </PremiumCard>
    );
}

export function MetricBarChart({ data, color = "#0B3C5D", unit = "", title }: { data: Record<string, any>[], color?: string, unit?: string, title?: string }) {
    return (
        <PremiumCard className="p-0 border-none shadow-none bg-transparent">
            <div className="h-[350px] w-full p-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            fontFamily="var(--font-mono)"
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            unit={unit}
                            dx={-5}
                            fontFamily="var(--font-mono)"
                        />
                        <Tooltip
                            cursor={{ fill: '#ffffff05' }}
                            contentStyle={{
                                backgroundColor: '#051621',
                                borderRadius: '12px',
                                border: '1px solid #1C7293',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                                color: '#f8fafc',
                                padding: '12px'
                            }}
                            itemStyle={{ color: '#E2E8F0', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            formatter={(value: number | undefined) => [`${value}${unit}`, title || 'Value']}
                        />
                        <Bar
                            dataKey="Total"
                            fill={color}
                            radius={[6, 6, 0, 0]}
                            animationDuration={1200}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </PremiumCard>
    );
}
