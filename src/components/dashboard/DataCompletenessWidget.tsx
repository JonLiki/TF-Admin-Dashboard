'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { cn } from '@/lib/utils';
import {
    Scale,
    Activity,
    Heart,
    CalendarCheck,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

export interface DataCompletenessData {
    weighIns: { entered: number; total: number };
    km: { entered: number; total: number };
    lifestyle: { entered: number; total: number };
    attendance: { sessionsWithData: number; totalSessions: number };
}

interface DataCompletenessWidgetProps {
    data: DataCompletenessData;
    currentWeekNumber: number;
}

const categories = [
    { key: 'weighIns' as const, label: 'Weigh-ins', icon: Scale, href: '/weigh-in', color: 'lagoon' },
    { key: 'km' as const, label: 'KM Logs', icon: Activity, href: '/km', color: 'blue' },
    { key: 'lifestyle' as const, label: 'Lifestyle', icon: Heart, href: '/lifestyle', color: 'pink' },
];

function getPercentage(entered: number, total: number) {
    if (total === 0) return 100;
    return Math.round((entered / total) * 100);
}

function getBarColor(pct: number) {
    if (pct >= 90) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
}

function getTextColor(pct: number) {
    if (pct >= 90) return 'text-emerald-400';
    if (pct >= 50) return 'text-amber-400';
    return 'text-red-400';
}

export function DataCompletenessWidget({ data, currentWeekNumber }: DataCompletenessWidgetProps) {
    const allComplete = categories.every(c => getPercentage(data[c.key].entered, data[c.key].total) >= 100)
        && getPercentage(data.attendance.sessionsWithData, data.attendance.totalSessions) >= 100;

    return (
        <PremiumCard>
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            {allComplete ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                            )}
                            Week {currentWeekNumber} Data Status
                        </h3>
                    </div>
                    {allComplete && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Complete
                        </span>
                    )}
                </div>

                <div className="space-y-3">
                    {categories.map((cat, i) => {
                        const { entered, total } = data[cat.key];
                        const pct = getPercentage(entered, total);
                        return (
                            <motion.div
                                key={cat.key}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link href={cat.href} className="group block">
                                    <div className="flex items-center gap-3">
                                        <cat.icon className="w-4 h-4 text-white/40 group-hover:text-lagoon transition-colors shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-white/70 group-hover:text-white transition-colors">{cat.label}</span>
                                                <span className={cn("text-xs font-mono font-bold", getTextColor(pct))}>
                                                    {entered}/{total}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={cn("h-full rounded-full", getBarColor(pct))}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
                                                />
                                            </div>
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 text-white/0 group-hover:text-white/40 transition-all group-hover:translate-x-0.5 shrink-0" />
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}

                    {/* Attendance row */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <Link href="/attendance" className="group block">
                            <div className="flex items-center gap-3">
                                <CalendarCheck className="w-4 h-4 text-white/40 group-hover:text-lagoon transition-colors shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-white/70 group-hover:text-white transition-colors">Attendance</span>
                                        <span className={cn(
                                            "text-xs font-mono font-bold",
                                            getTextColor(getPercentage(data.attendance.sessionsWithData, data.attendance.totalSessions))
                                        )}>
                                            {data.attendance.sessionsWithData}/{data.attendance.totalSessions} sessions
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className={cn("h-full rounded-full", getBarColor(getPercentage(data.attendance.sessionsWithData, data.attendance.totalSessions)))}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${getPercentage(data.attendance.sessionsWithData, data.attendance.totalSessions)}%` }}
                                            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-white/0 group-hover:text-white/40 transition-all group-hover:translate-x-0.5 shrink-0" />
                            </div>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </PremiumCard>
    );
}
