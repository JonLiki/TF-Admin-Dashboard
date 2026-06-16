'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { cn } from '@/lib/utils';

interface CategoryEntry {
    name: string;
    value: number;
}

interface BenchmarkCategoryChartProps {
    squatsTop: CategoryEntry[];
    pushupsTop: CategoryEntry[];
    burpeesTop: CategoryEntry[];
}

const categories = [
    { key: 'squats' as const, title: 'Squats', color: 'var(--color-lagoon)', gradientTo: 'var(--color-cyan-dim)', icon: '🦵', bg: 'from-lagoon/10 to-transparent', border: 'border-lagoon/20' },
    { key: 'pushups' as const, title: 'Push-ups', color: 'var(--color-tongan)', gradientTo: 'var(--color-tongan-dark)', icon: '💪', bg: 'from-tongan/10 to-transparent', border: 'border-tongan/20' },
    { key: 'burpees' as const, title: 'Burpees', color: 'var(--color-steel)', gradientTo: 'var(--color-steel)', icon: '🔥', bg: 'from-steel/10 to-transparent', border: 'border-steel/20' },
];

interface CustomTooltipProps {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-ocean-deep/95 border border-lagoon/20 rounded-xl px-4 py-2.5 shadow-xl backdrop-blur-md">
                <p className="text-xs text-foreground/60 font-medium mb-1">{label}</p>
                <p className="text-lg font-black font-mono text-foreground">{payload[0].value} <span className="text-xs font-normal text-foreground/60">reps</span></p>
            </div>
        );
    }
    return null;
};

function CategoryChart({ title, icon, color, gradientTo, bg, border, data }: {
    title: string;
    icon: string;
    color: string;
    gradientTo: string;
    bg: string;
    border: string;
    data: CategoryEntry[];
}) {
    if (!data || data.length === 0) return null;

    return (
        <PremiumCard className={cn('p-0 overflow-hidden', border)}>
            <div className={cn('px-5 py-4 border-b border-white/5 bg-gradient-to-r', bg)}>
                <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <h4 className="text-sm font-bold text-foreground tracking-wide">{title}</h4>
                    <span className="text-[10px] text-foreground/50 font-medium ml-auto uppercase tracking-wider">Top 5</span>
                </div>
            </div>
            <div className="px-2 py-3">
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                        >
                            <XAxis
                                type="number"
                                hide
                            />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={90}
                                tick={{ fill: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 600 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={false} />
                            <Bar
                                dataKey="value"
                                radius={[0, 6, 6, 0]}
                                barSize={22}
                                animationDuration={800}
                                animationBegin={100}
                            >
                                {data.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === 0 ? color : gradientTo}
                                        fillOpacity={1 - (index * 0.12)}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </PremiumCard>
    );
}

export function BenchmarkCategoryChart({ squatsTop, pushupsTop, burpeesTop }: BenchmarkCategoryChartProps) {
    const dataMap = {
        squats: squatsTop,
        pushups: pushupsTop,
        burpees: burpeesTop,
    };

    const hasData = squatsTop.length > 0 || pushupsTop.length > 0 || burpeesTop.length > 0;
    if (!hasData) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map(cat => (
                <CategoryChart
                    key={cat.key}
                    title={cat.title}
                    icon={cat.icon}
                    color={cat.color}
                    gradientTo={cat.gradientTo}
                    bg={cat.bg}
                    border={cat.border}
                    data={dataMap[cat.key]}
                />
            ))}
        </div>
    );
}
