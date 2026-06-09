'use client';

import React, { useState } from 'react';
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

interface CategoryConfig {
    key: 'weighIns' | 'km' | 'lifestyle' | 'attendance';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    strokeColor: string;
    radius: number;
    circumference: number;
    value: string;
    pct: number;
    colorClass: string;
}

function getPercentage(entered: number, total: number) {
    if (total === 0) return 100;
    return Math.round((entered / total) * 100);
}

function getTextColor(pct: number) {
    if (pct >= 90) return 'text-emerald-400';
    if (pct >= 50) return 'text-amber-400';
    return 'text-red-400';
}

function getBgColor(pct: number) {
    if (pct >= 90) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (pct >= 50) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    return 'bg-red-500/10 border-red-500/20 text-red-400';
}

export function DataCompletenessWidget({ data, currentWeekNumber }: DataCompletenessWidgetProps) {
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    const weighPct = getPercentage(data.weighIns.entered, data.weighIns.total);
    const kmPct = getPercentage(data.km.entered, data.km.total);
    const lifePct = getPercentage(data.lifestyle.entered, data.lifestyle.total);
    const attPct = getPercentage(data.attendance.sessionsWithData, data.attendance.totalSessions);

    const allComplete = weighPct >= 100 && kmPct >= 100 && lifePct >= 100 && attPct >= 100;

    const categoriesList: CategoryConfig[] = [
        {
            key: 'weighIns',
            label: 'Weigh-ins',
            icon: Scale,
            href: '/weigh-in',
            strokeColor: 'var(--color-lagoon)', // Lagoon Blue
            radius: 74,
            circumference: 2 * Math.PI * 74, // ~465
            value: `${data.weighIns.entered}/${data.weighIns.total}`,
            pct: weighPct,
            colorClass: 'text-lagoon'
        },
        {
            key: 'km',
            label: 'KM Logs',
            icon: Activity,
            href: '/km',
            strokeColor: 'var(--color-primary)', // Bio-Cyan
            radius: 58,
            circumference: 2 * Math.PI * 58, // ~364
            value: `${data.km.entered}/${data.km.total}`,
            pct: kmPct,
            colorClass: 'text-bio-cyan'
        },
        {
            key: 'lifestyle',
            label: 'Lifestyle',
            icon: Heart,
            href: '/lifestyle',
            strokeColor: 'var(--color-secondary)', // Volcanic Red
            radius: 42,
            circumference: 2 * Math.PI * 42, // ~263
            value: `${data.lifestyle.entered}/${data.lifestyle.total}`,
            pct: lifePct,
            colorClass: 'text-tongan-red'
        },
        {
            key: 'attendance',
            label: 'Attendance',
            icon: CalendarCheck,
            href: '/attendance',
            strokeColor: '#10B981', // Emerald Green
            radius: 26,
            circumference: 2 * Math.PI * 26, // ~163
            value: `${data.attendance.sessionsWithData}/${data.attendance.totalSessions}`,
            pct: attPct,
            colorClass: 'text-emerald-400'
        }
    ];

    const avgPercentage = Math.round((weighPct + kmPct + lifePct + attPct) / 4);
    const activeCat = categoriesList.find(c => c.key === hoveredCategory);
    const centerPct = activeCat ? activeCat.pct : avgPercentage;
    const centerLabel = activeCat ? activeCat.label : 'Complete';

    return (
        <PremiumCard className="overflow-hidden p-0 border-white/5 bg-ocean-deep/80 backdrop-blur-sm">
            <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                        {allComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)] animate-pulse-slow" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
                        )}
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                            Week {currentWeekNumber} Status
                        </h3>
                    </div>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shadow-inner transition-colors duration-300", getBgColor(avgPercentage))}>
                        {allComplete ? 'Ready' : `${avgPercentage}%`}
                    </span>
                </div>

                {/* Concentric rings & Legend grid */}
                <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                    {/* SVG Progress Rings */}
                    <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 170 170">
                            <defs>
                                <filter id="glow-effect" x="-10%" y="-10%" width="120%" height="120%">
                                    <feGaussianBlur stdDeviation="2" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>
                            {categoriesList.map(cat => {
                                const isHovered = hoveredCategory === cat.key;
                                const isAnyHovered = hoveredCategory !== null;
                                const fadeOpacity = isAnyHovered && !isHovered ? 0.15 : 0.85;

                                return (
                                    <g key={cat.key} className="transition-all duration-300">
                                        {/* Background track circle */}
                                        <circle
                                            cx="85"
                                            cy="85"
                                            r={cat.radius}
                                            fill="transparent"
                                            stroke="rgba(255, 255, 255, 0.03)"
                                            strokeWidth={isHovered ? 7.5 : 6}
                                            className="transition-all duration-300"
                                        />
                                        {/* Progress arc */}
                                        <motion.circle
                                            cx="85"
                                            cy="85"
                                            r={cat.radius}
                                            fill="transparent"
                                            stroke={cat.strokeColor}
                                            strokeWidth={isHovered ? 7.5 : 6}
                                            strokeDasharray={cat.circumference}
                                            initial={{ strokeDashoffset: cat.circumference }}
                                            animate={{ strokeDashoffset: cat.circumference - (cat.pct / 100) * cat.circumference }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            strokeLinecap="round"
                                            style={{
                                                opacity: fadeOpacity,
                                                filter: isHovered ? 'url(#glow-effect)' : 'none',
                                            }}
                                            className="transition-all duration-300 cursor-pointer"
                                            onMouseEnter={() => setHoveredCategory(cat.key)}
                                            onMouseLeave={() => setHoveredCategory(null)}
                                        />
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Center Statistics Overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                            <motion.span 
                                key={centerPct}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-xl font-black font-mono text-white tracking-tighter"
                            >
                                {centerPct}%
                            </motion.span>
                            <motion.span 
                                key={centerLabel}
                                initial={{ opacity: 0, y: 3 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mt-0.5"
                            >
                                {centerLabel}
                            </motion.span>
                        </div>
                    </div>

                    {/* Legend Rows */}
                    <div className="flex-1 w-full space-y-2.5">
                        {categoriesList.map(cat => {
                            const isHovered = hoveredCategory === cat.key;
                            const isAnyHovered = hoveredCategory !== null;

                            return (
                                <div
                                    key={cat.key}
                                    onMouseEnter={() => setHoveredCategory(cat.key)}
                                    onMouseLeave={() => setHoveredCategory(null)}
                                    className={cn(
                                        "transition-all duration-300",
                                        isAnyHovered && !isHovered ? "opacity-35" : "opacity-100"
                                    )}
                                >
                                    <Link href={cat.href} className="group block bg-ocean/10 hover:bg-ocean/20 border border-white/5 hover:border-white/10 rounded-lg p-2.5 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className={cn("p-1.5 rounded bg-black/30 border border-white/5 group-hover:scale-105 transition-transform", cat.colorClass)}>
                                                    <cat.icon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-white/90 group-hover:text-white transition-colors">
                                                        {cat.label}
                                                    </span>
                                                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5 leading-none">
                                                        {cat.value}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <span className={cn("text-[11px] font-bold font-mono", getTextColor(cat.pct))}>
                                                    {cat.pct}%
                                                </span>
                                                <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </PremiumCard>
    );
}
