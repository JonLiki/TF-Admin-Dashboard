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

import { CHART_COLORS } from '@/lib/theme';

interface ChartProps {
    data: Record<string, string | number>[];
    colors?: string[];
    title: string;
    subtitle?: string;
}

export interface AttendanceDataPoint {
    date: string | Date;
    percentage: number;
    type: string;
    displayDate?: string;
    tooltipDate?: string;
}

export interface MetricDataPoint {
    name: string;
    Total: number;
}

export function TeamComparisonChart({ data, title, subtitle, colors }: ChartProps) {
    // Extract team keys dynamically (exclude 'name' or 'week')
    const keys = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'name' && k !== 'week') : [];
    const chartColors = colors || CHART_COLORS.series;

    return (
        <PremiumCard className="p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getDate()}/${date.getMonth() + 1}`;
                            }}
                            stroke="var(--color-text-muted)"
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                            tickLine={{ stroke: 'var(--color-text-muted)' }}
                        />
                        <YAxis
                            stroke="var(--color-text-muted)"
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                            tickLine={{ stroke: 'var(--color-text-muted)' }}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-ocean-deep)',
                                border: '1px solid var(--color-lagoon)',
                                borderRadius: '8px',
                                color: '#f8fafc',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                            itemStyle={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                            labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Line
                            type="monotone"
                            dataKey="percentage"
                            name="Attendance %"
                            stroke="var(--color-tongan)"
                            strokeWidth={3}
                            dot={{ fill: 'var(--color-tongan)', strokeWidth: 2, r: 4, stroke: '#fff' }}
                            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                        />
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
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`${title}-gradient`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-tongan)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-tongan)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="var(--color-text-muted)"
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                            tickLine={{ stroke: 'var(--color-text-muted)' }}
                        />
                        <YAxis
                            stroke="var(--color-text-muted)"
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                            tickLine={{ stroke: 'var(--color-text-muted)' }}
                        />
                        <Tooltip
                            cursor={{ stroke: 'var(--color-tongan)', strokeWidth: 1, strokeDasharray: '4 4' }}
                            contentStyle={{
                                backgroundColor: 'var(--color-ocean-deep)',
                                border: '1px solid var(--color-lagoon)',
                                borderRadius: '8px',
                                color: '#f8fafc',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                            itemStyle={{ color: '#E2E8F0', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                            labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            formatter={(value: number | undefined) => [`${value || 0} kg`, title]}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="var(--color-tongan)"
                            fill={`url(#${title}-gradient)`}
                            strokeWidth={3}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </PremiumCard>
    );
}

// --- REUSABLE VOYAGER CHARTS ---

export function AttendanceSessionChart({ data }: { data: AttendanceDataPoint[] }) {
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
                                <stop offset="5%" stopColor="var(--color-lagoon)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-lagoon)" stopOpacity={0} />
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
                                backgroundColor: 'var(--color-ocean-deep)',
                                borderRadius: '12px',
                                border: '1px solid var(--color-lagoon)',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                                color: '#f8fafc',
                                padding: '12px'
                            }}
                            itemStyle={{ color: '#bae6fd', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            formatter={(value: number | undefined) => [`${value}%`, 'Attendance']}
                            labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0) {
                                    return (payload[0].payload as AttendanceDataPoint).tooltipDate + ` (${(payload[0].payload as AttendanceDataPoint).type})`;
                                }
                                return label;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="percentage"
                            stroke="var(--color-lagoon)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorAttendance)"
                            activeDot={{ r: 6, strokeWidth: 4, stroke: "var(--color-ocean-deep)", fill: '#fff' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </PremiumCard>
    );
}

export function MetricAreaChart({ data, color = "var(--color-lagoon)", unit = "", title }: { data: MetricDataPoint[], color?: string, unit?: string, title?: string }) {
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
                                backgroundColor: 'var(--color-ocean-deep)',
                                borderRadius: '12px',
                                border: '1px solid var(--color-lagoon)',
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
                            activeDot={{ r: 6, strokeWidth: 4, stroke: 'var(--color-ocean-deep)', fill: color }}
                            animationDuration={1500}
                            animationEasing="ease-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </PremiumCard>
    );
}

export function MetricBarChart({ data, color = "var(--color-primary)", unit = "", title }: { data: MetricDataPoint[], color?: string, unit?: string, title?: string }) {
    return (
        <PremiumCard className="p-0 border-none shadow-none bg-transparent">
            <div className="h-[350px] w-full p-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="var(--color-text-muted)"
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                            tickLine={{ stroke: 'var(--color-text-muted)' }}
                        />
                        <YAxis
                            stroke="var(--color-text-muted)"
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                            tickLine={{ stroke: 'var(--color-text-muted)' }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{
                                backgroundColor: 'var(--color-ocean-deep)',
                                border: '1px solid var(--color-lagoon)',
                                borderRadius: '8px',
                                color: '#f8fafc',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                            itemStyle={{ color: '#E2E8F0', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                            labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            formatter={(value: number | undefined) => [`${value || 0} ${unit}`, title]}
                        />
                        <Bar
                            dataKey="Total"
                            fill={color}
                            radius={[4, 4, 0, 0]}
                            animationDuration={1200}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </PremiumCard>
    );
}
