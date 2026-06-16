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

export function TeamComparisonChart({ data, title, subtitle }: ChartProps) {
    return (
        <PremiumCard className="p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                {subtitle && <p className="text-sm text-foreground/60">{subtitle}</p>}
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <defs>
                            <filter id="teamComparisonGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--color-tongan)" floodOpacity="0.4" />
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
                                color: 'var(--foreground)',
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
                            dot={{ fill: 'var(--color-tongan)', strokeWidth: 2, r: 4, stroke: 'var(--foreground)' }}
                            activeDot={{ r: 6, stroke: 'var(--foreground)', strokeWidth: 2 }}
                            filter="url(#teamComparisonGlow)"
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
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                {subtitle && <p className="text-sm text-foreground/60">{subtitle}</p>}
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`${title}-gradient`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-tongan)" stopOpacity={0.4} />
                                <stop offset="50%" stopColor="var(--color-tongan)" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="var(--color-tongan)" stopOpacity={0} />
                            </linearGradient>
                            <filter id={`${title}-glow`} x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--color-tongan)" floodOpacity="0.4" />
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
                                color: 'var(--foreground)',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                            itemStyle={{ color: 'var(--foreground)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
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
                            filter={`url(#${title}-glow)`}
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
        <div className="h-full flex items-center justify-center text-foreground/50 text-sm">
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
                                <stop offset="5%" stopColor="var(--color-lagoon)" stopOpacity={0.4} />
                                <stop offset="50%" stopColor="var(--color-lagoon)" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="var(--color-lagoon)" stopOpacity={0} />
                            </linearGradient>
                            <filter id="attendanceGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--color-lagoon)" floodOpacity="0.4" />
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                            dataKey="displayDate"
                            stroke="var(--color-text-secondary)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            fontFamily="var(--font-mono)"
                        />
                        <YAxis
                            stroke="var(--color-text-secondary)"
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
                                color: 'var(--foreground)',
                                padding: '12px'
                            }}
                            itemStyle={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                            labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
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
                            activeDot={{ r: 6, strokeWidth: 4, stroke: "var(--color-ocean-deep)", fill: 'var(--foreground)' }}
                            filter="url(#attendanceGlow)"
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
                            <linearGradient id={`colorGradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                <stop offset="50%" stopColor={color} stopOpacity={0.15} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                            <filter id={`filterGlow-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={color} floodOpacity="0.4" />
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="var(--color-text-secondary)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            fontFamily="var(--font-mono)"
                        />
                        <YAxis
                            stroke="var(--color-text-secondary)"
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
                                color: 'var(--foreground)',
                                padding: '12px'
                            }}
                            itemStyle={{ color: 'var(--foreground)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                            labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            formatter={(value: number | undefined) => [`${value}${unit}`, title || 'Value']}
                            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="Total"
                            stroke={color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#colorGradient-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
                            activeDot={{ r: 6, strokeWidth: 4, stroke: 'var(--color-ocean-deep)', fill: color }}
                            animationDuration={1500}
                            animationEasing="ease-out"
                            filter={`url(#filterGlow-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
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
                        <defs>
                            <filter id={`barGlow-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.35" />
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
                            cursor={{ fill: 'var(--border)' }}
                            contentStyle={{
                                backgroundColor: 'var(--color-ocean-deep)',
                                border: '1px solid var(--color-lagoon)',
                                borderRadius: '8px',
                                color: 'var(--foreground)',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                            itemStyle={{ color: 'var(--foreground)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                            labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            formatter={(value: number | undefined) => [`${value || 0} ${unit}`, title]}
                        />
                        <Bar
                            dataKey="Total"
                            fill={color}
                            radius={[4, 4, 0, 0]}
                            animationDuration={1200}
                            filter={`url(#barGlow-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </PremiumCard>
    );
}
