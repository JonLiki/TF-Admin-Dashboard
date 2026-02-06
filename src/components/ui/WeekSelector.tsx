'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronDown, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WeekOption {
    value: string;
    label: string;
}

interface WeekSelectorProps {
    weeks: WeekOption[];
    selectedWeekId: string;
    basePath: string;
}

export function WeekSelector({ weeks, selectedWeekId, basePath }: WeekSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedWeek = weeks.find(w => w.value === selectedWeekId) || weeks[0];

    return (
        <div className="relative">
            {/* Dropdown Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm",
                    "bg-ocean-deep/80 backdrop-blur-sm border border-white/10",
                    "text-white hover:bg-ocean-deep hover:border-lagoon/30",
                    "transition-all duration-200 shadow-[var(--shadow-md)]",
                    "hover:shadow-[var(--shadow-lg)] active:scale-[0.98]",
                    isOpen && "bg-ocean-deep border-lagoon/30"
                )}
            >
                <Calendar className="w-4 h-4 text-lagoon-100" />
                <span className="font-mono font-semibold">{selectedWeek.label}</span>
                <ChevronDown className={cn(
                    "w-4 h-4 text-slate-400 transition-transform duration-200",
                    isOpen && "rotate-180"
                )} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full mt-2 left-0 z-20 w-48 rounded-lg border border-white/10 bg-ocean-deep/95 backdrop-blur-md shadow-[var(--shadow-xl)] overflow-hidden"
                        >
                            <div className="py-1 max-h-64 overflow-y-auto">
                                {weeks.map((week, index) => {
                                    const isActive = week.value === selectedWeekId;
                                    const isPast = index < weeks.findIndex(w => w.value === selectedWeekId);

                                    return (
                                        <Link
                                            key={week.value}
                                            href={`${basePath}?weekId=${week.value}`}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "block px-4 py-2.5 text-sm font-medium transition-all duration-150",
                                                "hover:bg-lagoon/10 relative group",
                                                isActive && "bg-tongan/20 text-white font-bold",
                                                !isActive && isPast && "text-lagoon-100",
                                                !isActive && !isPast && "text-slate-400"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono">{week.label}</span>
                                                {isActive && (
                                                    <span className="text-xs bg-tongan px-2 py-0.5 rounded-full">Current</span>
                                                )}
                                                {isPast && !isActive && (
                                                    <span className="text-xs text-lagoon-100">✓</span>
                                                )}
                                            </div>

                                            {isActive && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-tongan" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
