import { getActiveBlock } from '@/lib/queries';
import { getCheckInSnapshot } from '@/lib/check-in-queries';
import { addUtcDays } from '@/lib/dates';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { WeeklyCheckIn } from '@/components/check-in/WeeklyCheckIn';
import { CalendarCheck } from 'lucide-react';

export default async function CheckInPage({ searchParams }: { searchParams: Promise<{ weekId?: string }> }) {
    const block = await getActiveBlock();
    if (!block || !block.weeks.length) return <div className="p-6"><EmptyState icon={CalendarCheck} title="No training weeks available" description="Create or activate a block to begin weekly check-ins." actionLabel="Manage blocks" actionHref="/blocks" /></div>;
    const params = await searchParams;
    const now = new Date();
    const current = block.weeks.find(week => now >= week.startDate && now < addUtcDays(week.endDate, 1)) ?? (now < block.startDate ? block.weeks[0] : block.weeks[block.weeks.length - 1]);
    const selected = block.weeks.find(week => week.id === params.weekId) ?? current;
    const snapshot = await getCheckInSnapshot(selected.id);
    if (!snapshot) return <div className="p-6">This week is no longer available.</div>;
    const date = (value: Date) => value.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return <div className="min-h-full pb-10">
        <PageHeader title="Weekly check-in" subtitle={`${block.name} · Attendance, weight and weekly activity`} />
        <div className="px-4 sm:px-6 md:px-10 mt-6">
            <WeeklyCheckIn key={selected.id} weekId={selected.id} weekNumber={selected.weekNumber} isFinalized={selected.isFinalized}
                weeks={block.weeks.map(week => ({ value: week.id, label: `Week ${week.weekNumber} · ${date(week.startDate)}–${date(week.endDate)} · ${week.isFinalized ? 'Finalized' : 'Open'}` }))}
                members={snapshot.members} columns={snapshot.columns} />
        </div>
    </div>;
}
