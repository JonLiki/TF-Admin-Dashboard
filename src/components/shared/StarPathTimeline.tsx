'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ChevronRight, Star } from 'lucide-react';

interface WeekOption {
    value: string;
    label: string;
}

interface StarPathTimelineProps {
    weeks: WeekOption[];
    selectedWeekId: string;
    basePath: string;
}

export function StarPathTimeline({ weeks, selectedWeekId, basePath }: StarPathTimelineProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Scroll active item into view on mount
    useEffect(() => {
        if (scrollContainerRef.current) {
            const activeItem = scrollContainerRef.current.querySelector('[data-active="true"]');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [selectedWeekId]);

    return (
        <div className="relative group max-w-xl">
            {/* Gradients to hint scroll */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0B1220] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0B1220] to-transparent z-10 pointer-events-none" />

            <div
                ref={scrollContainerRef}
                className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 px-4 bg-white/5 rounded-full border border-white/5 backdrop-blur-sm"
            >
                {weeks.map((week, index) => {
                    const isActive = week.value === selectedWeekId;
                    const isPast = index < weeks.findIndex(w => w.value === selectedWeekId);

                    return (
                        <React.Fragment key={week.value}>
                            {index > 0 && (
                                <div className={cn(
                                    "h-[1px] w-4 shrink-0 transition-colors",
                                    isPast || isActive ? "bg-lagoon/50" : "bg-white/10"
                                )} />
                            )}

                            <Link
                                href={`${basePath}?weekId=${week.value}`}
                                data-active={isActive}
                                className={cn(
                                    "relative flex items-center justify-center shrink-0 w-8 h-8 rounded-full transition-all duration-300 border",
                                    isActive
                                        ? "bg-tongan text-white border-tongan scale-110 shadow-[0_0_10px_rgba(200,16,46,0.4)]"
                                        : isPast
                                            ? "bg-lagoon/20 text-lagoon-100 border-lagoon/20 hover:bg-lagoon/30"
                                            : "bg-white/5 text-slate-500 border-transparent hover:bg-white/10 hover:text-slate-300"
                                )}
                            >
                                {isActive ? (
                                    <Star className="w-4 h-4 fill-white" />
                                ) : (
                                    <span className="text-[10px] font-bold font-mono">{index + 1}</span>
                                )}

                                {isActive && (
                                    <motion.div
                                        layoutId="activeGlow"
                                        className="absolute inset-0 rounded-full bg-tongan blur-md -z-10 opacity-50"
                                    />
                                )}
                            </Link>
                        </React.Fragment>
                    );
                })}
            </div>

            <div className="text-center mt-1">
                <p className="text-[9px] uppercase tracking-widest text-[#1C7293] font-bold">Voyager Timeline</p>
            </div>
        </div>
    );
}
