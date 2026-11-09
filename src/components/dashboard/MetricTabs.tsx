'use client';

import { Activity, Scale, Trophy, Users as UsersIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

export type MetricType = 'weight' | 'km' | 'attendance' | 'lifestyle';

interface MetricTabsProps {
    activeMetric: MetricType;
    onChange: (metric: MetricType) => void;
}

export function MetricTabs({ activeMetric, onChange }: MetricTabsProps) {
    return (
        <div role="group" aria-label="Choose metric" className="flex flex-wrap gap-1 bg-ocean/20 p-1 rounded-lg border border-white/5 shadow-inner overflow-x-auto">
            <TabButton
                active={activeMetric === 'weight'}
                onClick={() => onChange('weight')}
                icon={Scale}
                label="Weight"
            />
            <TabButton
                active={activeMetric === 'km'}
                onClick={() => onChange('km')}
                icon={Activity}
                label="KM"
            />
            <TabButton
                active={activeMetric === 'lifestyle'}
                onClick={() => onChange('lifestyle')}
                icon={Trophy}
                label="Lifestyle"
            />
            <TabButton
                active={activeMetric === 'attendance'}
                onClick={() => onChange('attendance')}
                icon={UsersIcon}
                label="Attendance"
            />
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: React.ElementType, label: string }) {
    return (
        <button
            type="button" aria-label={label} aria-pressed={active}
            onClick={onClick}
            className={cn(
                "flex shrink-0 min-h-11 min-w-11 items-center space-x-2 px-4 py-2 focus-visible:outline-2 focus-visible:outline-lagoon rounded-md text-sm font-semibold transition-all duration-200 ease-out",
                active
                    ? "bg-lagoon text-white shadow-sm"
                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
            )}
        >
            <Icon className={cn("w-4 h-4 shrink-0", active ? "text-white" : "stroke-[2.5px] opacity-70")} />
            <span>{label}</span>
        </button>
    )
}
