'use client';

import { useState } from 'react';
import { submitBenchmarkLogsBulk } from '@/actions/data';
import { benchmarkDraftFormData } from '@/lib/entry-drafts';
import { useEntryDrafts } from '@/hooks/useEntryDrafts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SearchInput } from '@/components/ui/SearchInput';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { UnsavedChangesGuard } from '@/components/ui/UnsavedChangesGuard';
import { EntryFilters, type EntryFilter } from '@/components/ui/EntryFilters';

const fields = ['squats', 'pushups', 'burpees'] as const;
type Scores = Record<typeof fields[number], number>;
interface Member { id: string; firstName: string; lastName: string; team: { name: string } | null; benchmarkLogs: Scores[] }
interface Props { members: Member[]; weekId: string; dateStr: string }

export function BenchmarkLogList(props: Props) {
    return <BenchmarkForm key={`${props.weekId}:${props.dateStr}`} {...props} />;
}

function BenchmarkForm({ members, weekId, dateStr }: Props) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<EntryFilter>('all');
    const { drafts, errors, count, state, formAction, isPending, formRef, change, discard, saveBeforeLeaving } = useEntryDrafts(submitBenchmarkLogsBulk, 'benchmark', 'blockWeekId', `${weekId}:${dateStr}`, undefined, true, drafts => benchmarkDraftFormData(drafts, members, weekId, dateStr));
    const recorded = members.filter(member => member.benchmarkLogs.length > 0).length;
    const visible = members.filter(member => {
        const matches = `${member.firstName} ${member.lastName} ${member.team?.name ?? ''}`.toLowerCase().includes(search.toLowerCase());
        const edited = fields.some(field => `${field}_${member.id}` in drafts);
        const invalid = fields.some(field => `${field}_${member.id}` in errors);
        return matches && (filter === 'all' || (filter === 'missing' && !member.benchmarkLogs.length) || (filter === 'recorded' && !!member.benchmarkLogs.length) || (filter === 'edited' && edited) || (filter === 'errors' && invalid));
    });
    return <>
        <UnsavedChangesGuard dirty={count > 0} isPending={isPending} onSave={saveBeforeLeaving} onDiscard={discard} message={state?.success === false ? state.message : undefined} />
        <form ref={formRef} action={formAction} noValidate className="space-y-4">
            <PremiumCard className="p-4 sm:p-6 space-y-4">
                <h2 className="text-lg font-bold">Benchmark logger</h2>
                <p className="text-sm text-foreground/80">Enter whole repetitions. Unchanged scores are preserved when you save.</p>
                <div className="flex flex-wrap items-center gap-3">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search members or teams" className="w-full sm:w-64" />
                    <EntryFilters value={filter} onChange={setFilter} errorCount={Object.keys(errors).length} onShowErrors={() => { setSearch(''); setFilter('errors'); }} />
                </div>
                <p role="status" className="text-sm text-foreground/80">{visible.length} of {members.length} members shown</p>
                {visible.map(member => {
                    const edited = fields.some(field => `${field}_${member.id}` in drafts);
                    return <div key={member.id} className="rounded-xl border border-border bg-surface-ocean p-4 space-y-3">
                        <div className="flex flex-wrap justify-between gap-2">
                            <div><h3 className="font-semibold">{member.firstName} {member.lastName}</h3><p className="text-sm text-foreground/80">{member.team?.name ?? 'Unassigned'}</p></div>
                            <span className="text-sm">{edited ? 'Edited — not saved' : member.benchmarkLogs.length ? 'Recorded' : 'Missing'}</span>
                        </div>
                        <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-3">
                            {fields.map(field => {
                                const key = `${field}_${member.id}`;
                                const saved = String(member.benchmarkLogs[0]?.[field] ?? '');
                                return <Input key={field} type="number" inputMode="numeric" min={0} step={1}
                                    label={field === 'pushups' ? 'Push-ups' : field === 'squats' ? 'Squats' : 'Burpees'}
                                    aria-label={`${field} for ${member.firstName} ${member.lastName}`} value={drafts[key] ?? saved}
                                    onChange={event => change(key, event.target.value, saved)} error={errors[key]} disabled={isPending} />;
                            })}
                        </div>
                    </div>;
                })}
                {!visible.length && <div className="py-8 text-center"><p>No members match these filters.</p><Button type="button" variant="ghost" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</Button></div>}
            </PremiumCard>
            <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-deep p-4 shadow-lg">
                <span className="text-sm">{count ? `${count} unsaved score changes` : `${recorded} of ${members.length} recorded`}</span>
                <Button type="button" variant="ghost" disabled={!count || isPending} onClick={discard}>Discard changes</Button>
                <Button type="submit" disabled={!count} isLoading={isPending}>Save changes</Button>
            </div>
            <p role={state?.success === false ? 'alert' : 'status'} className="text-sm">{state?.message ?? 'Changes stay here while you search. Save before leaving.'}</p>
        </form>
    </>;
}
