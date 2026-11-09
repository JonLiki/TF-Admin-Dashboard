'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export interface DataCompletenessData {
    weighIns: { entered: number; total: number };
    km: { entered: number; total: number };
    lifestyle: { entered: number; total: number };
    attendance: { sessionsWithData: number; totalSessions: number };
}
interface Props {
    data: DataCompletenessData;
    currentWeekNumber: number;
    weekId?: string;
    weighInDate?: string;
}
export function DataCompletenessWidget({ data, currentWeekNumber, weekId, weighInDate }: Props) {
    const categories = [
        { label: 'Weigh-ins', ...data.weighIns, unit: 'members need weigh-ins', href: `/weigh-in?status=missing${weighInDate ? `&date=${encodeURIComponent(weighInDate)}` : ''}` },
        { label: 'Distance', ...data.km, unit: 'members need distance entries', href: `/km?status=missing${weekId ? `&weekId=${weekId}` : ''}` },
        { label: 'Lifestyle', ...data.lifestyle, unit: 'members need lifestyle entries', href: `/lifestyle?status=missing${weekId ? `&weekId=${weekId}` : ''}` },
        { label: 'Attendance', entered: data.attendance.sessionsWithData, total: data.attendance.totalSessions, unit: 'sessions have no attendance recorded', href: `/attendance${weekId ? `?weekId=${weekId}` : ''}` },
    ];
    return <section aria-label={`Week ${currentWeekNumber} missing data`} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {categories.map(category => {
                const missing = Math.max(0, category.total - category.entered);
                const pct = category.total ? Math.min(100, Math.round(category.entered / category.total * 100)) : 0;
                return <Link key={category.label} href={category.href} className="rounded-xl border border-border bg-surface-ocean p-4 transition-colors hover:border-lagoon focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagoon">
                    <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-semibold">{category.label}</h4><ArrowRight aria-hidden="true" className="h-4 w-4 text-foreground/60" /></div>
                    <p className="mt-3 text-sm font-semibold">{category.total === 0 ? 'Nothing scheduled' : missing ? `${missing} ${category.unit}` : <span className="inline-flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />{category.label === 'Attendance' ? 'Every session has records' : 'All entries recorded'}</span>}</p>
                    <p className="mt-1 text-xs text-foreground/70">{category.entered} of {category.total} {category.label === 'Attendance' ? 'sessions with records' : 'members recorded'}</p>
                    <div aria-hidden="true" className="mt-3 h-1 rounded-full bg-foreground/10"><div className="h-full rounded-full bg-lagoon" style={{ width: `${pct}%` }} /></div>
                </Link>;
            })}
        </div>
        <p className="text-xs text-foreground/70">Attendance tracks sessions with at least one record. Open attendance to check every member.</p>
    </section>;
}
