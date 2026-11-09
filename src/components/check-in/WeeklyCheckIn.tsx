'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarCheck, Lock, Save } from 'lucide-react';
import { saveWeeklyCheckIn } from '@/actions/check-in';
import { useEntryDrafts } from '@/hooks/useEntryDrafts';
import { cellKey, checkInError, checkInFormData, previewCheckInPaste, type CheckInColumn, type CheckInMember, type PasteCell } from '@/lib/check-in';
import { Button } from '@/components/ui/Button';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Sheet } from '@/components/ui/Sheet';
import { SearchInput } from '@/components/ui/SearchInput';
import { WeekSelector } from '@/components/ui/WeekSelector';
import { UnsavedChangesGuard } from '@/components/ui/UnsavedChangesGuard';
import { cn } from '@/lib/utils';

interface Props { weekId: string; weekNumber: number; isFinalized: boolean; weeks: SelectOption[]; members: CheckInMember[]; columns: CheckInColumn[] }
type View = 'all' | 'missing' | 'edited' | 'errors';

export function WeeklyCheckIn({ weekId, weekNumber, isFinalized, weeks, members, columns }: Props) {
    const router = useRouter();
    const [team, setTeam] = useState('all');
    const [search, setSearch] = useState('');
    const [view, setView] = useState<View>('all');
    const [mobileMemberId, setMobileMemberId] = useState('');
    const [paste, setPaste] = useState<PasteCell[] | null>(null);
    const [notice, setNotice] = useState('');
    const [review, setReview] = useState(false);
    const reviewed = useRef(false);
    const tableRef = useRef<HTMLTableElement>(null);
    const columnMap = new Map(columns.map(column => [column.id, column]));
    const memberMap = new Map(members.map(member => [member.id, member]));
    const { drafts, errors, count, state, formAction, isPending, formRef, change, discard, saveBeforeLeaving, cancelSaveNavigation, applyChanges } = useEntryDrafts(
        saveWeeklyCheckIn, 'check-in', 'week', weekId, undefined, false,
        drafts => checkInFormData(drafts, members, columns, weekId),
        (value, id) => { const [memberId, columnId] = id.split('|'); if (!memberMap.has(memberId)) return 'This member is no longer active. Undo this draft entry.'; const column = columnMap.get(columnId); return column ? checkInError(value, column) : 'This column is no longer available.'; },
    );
    const errorKeys = Object.keys(errors);
    const editableColumns = columns.filter(column => !column.locked);
    const teamOptions = Array.from(new Map(members.filter(member => member.teamId).map(member => [member.teamId!, member.teamName])).entries())
        .sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true })).map(([value, label]) => ({ value, label }));
    const hasMissing = (member: CheckInMember) => editableColumns.some(column => (member.values[column.id] ?? null) === null);
    const visible = members.filter(member => {
        const inTeam = team === 'all' || (team === 'unassigned' ? !member.teamId : member.teamId === team);
        const matches = `${member.name} ${member.teamName}`.toLowerCase().includes(search.toLowerCase());
        return inTeam && matches && (view === 'all' || (view === 'missing' && hasMissing(member)) ||
            (view === 'edited' && columns.some(column => cellKey(member.id, column.id) in drafts)) ||
            (view === 'errors' && columns.some(column => cellKey(member.id, column.id) in errors)));
    });
    const mobileMember = visible.find(member => member.id === mobileMemberId) ?? visible[0];
    const mobileIndex = visible.findIndex(member => member.id === mobileMember?.id);
    const selectedMembers = members.filter(member => team === 'all' || (team === 'unassigned' ? !member.teamId : member.teamId === team));
    const missingCount = selectedMembers.reduce((sum, member) => sum + editableColumns.filter(column => (member.values[column.id] ?? null) === null).length, 0);
    const savedCount = selectedMembers.length * editableColumns.length - missingCount;
    const changes = Object.entries(drafts).map(([key, value]) => {
        const [memberId, columnId] = key.split('|');
        return { key, member: memberMap.get(memberId) ?? { name: 'Unavailable member', values: {} as Record<string, string | null> }, column: columnMap.get(columnId) ?? { id: columnId, label: 'Unavailable column' }, value };
    });
    const showErrors = () => {
        setSearch(''); setTeam('all'); setView('errors');
        setMobileMemberId(errorKeys[0]?.split('|')[0] ?? '');
        requestAnimationFrame(() => document.getElementById(errorKeys[0])?.focus());
    };
    const pasteValues = (event: React.ClipboardEvent, row: number, column: number) => {
        event.preventDefault();
        if (isPending) return;
        try { setPaste(previewCheckInPaste(event.clipboardData.getData('text/plain'), visible, columns, row, column)); setNotice(''); }
        catch (error) { setNotice(error instanceof Error ? error.message : 'Could not read the pasted values.'); }
    };
    const moveFocus = (event: React.KeyboardEvent, row: number, column: number) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            const member = visible[row], field = columns[column];
            change(cellKey(member.id, field.id), member.values[field.id] ?? '', member.values[field.id] ?? '');
            return;
        }
        let dy = 0, dx = 0;
        if (event.key === 'Enter' && event.target instanceof HTMLInputElement) dy = event.shiftKey ? -1 : 1;
        else if (event.altKey && event.key === 'ArrowDown') dy = 1;
        else if (event.altKey && event.key === 'ArrowUp') dy = -1;
        else if (event.altKey && event.key === 'ArrowLeft') dx = -1;
        else if (event.altKey && event.key === 'ArrowRight') dx = 1;
        else return;
        event.preventDefault();
        for (let r = row + dy, c = column + dx; r >= 0 && r < visible.length && c >= 0 && c < columns.length; r += dy, c += dx) {
            const target = tableRef.current?.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-row="${r}"][data-column="${c}"]`);
            if (target && !target.disabled) {
                // On mobile, only the selected member row is displayed.
                // Reveal the destination before attempting to focus its field.
                if (window.matchMedia('(max-width: 767px)').matches) setMobileMemberId(visible[r].id);
                requestAnimationFrame(() => {
                    target.focus();
                    if (target instanceof HTMLInputElement) target.select();
                });
                return;
            }
        }
    };
    const closeReview = () => { if (!isPending) { setReview(false); cancelSaveNavigation(); } };
    const reset = () => { discard(); setNotice(''); cancelSaveNavigation(); };

    return <div className="space-y-5">
        <UnsavedChangesGuard dirty={count > 0} isPending={isPending} onSave={saveBeforeLeaving} onDiscard={reset} message={state?.success === false ? state.message : undefined} />
        <section aria-label="Choose week and team" className="rounded-2xl border border-border bg-surface-ocean p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <WeekSelector weeks={weeks} selectedWeekId={weekId} basePath="/check-in" />
                <Select label="Team" value={team} onChange={setTeam} className="w-full sm:w-56" options={[{ value: 'all', label: 'All teams' }, ...teamOptions, { value: 'unassigned', label: 'Unassigned members' }]} />
            </div>
            <p className="text-sm text-foreground/80">Start and end weights are the Monday measurements bounding this week. They are shared with adjacent weeks; finalized results can lock either weight column.</p>
            {isFinalized && <p role="status" className="flex items-center gap-2 text-sm font-semibold"><Lock className="h-4 w-4" /> Week {weekNumber} is finalized. You can review entries here; reopen it from the scoreboard to edit. <Link href={`/scoreboard?weekId=${weekId}`} className="underline">Open scoreboard</Link></p>}
            {!isFinalized && columns.some(column => column.locked) && <p className="text-sm font-semibold">Some weight cells are locked by another finalized week. Activity and attendance remain editable.</p>}
        </section>
        <section aria-label="Check-in progress" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[[`${savedCount}`, 'Recorded editable entries'], [`${missingCount}`, 'Missing editable entries'], [`${count}`, 'Unsaved changes across all teams']].map(([value, label]) => <div key={label} className="rounded-xl border border-border bg-surface-ocean p-4"><p className="text-2xl font-bold tabular-nums">{value}</p><p className="text-sm text-foreground/80">{label}</p></div>)}
        </section>
        <details className="rounded-xl border border-border bg-surface-ocean p-4">
            <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-lagoon">How to enter and paste values</summary>
            <ul className="mt-3 list-disc pl-5 space-y-2 text-sm text-foreground/80">
                <li>Choose a team, then paste a rectangular range from Excel into its first destination cell. Match the visible member order and column headings; paste values without headers or names.</li>
                <li>Review the paste preview before applying. Blank cells and dashes leave entries unchanged. Use zero for a recorded zero; use Present/Absent, P/A, or 1/0 for attendance.</li>
                <li>Tab moves across cells. Enter moves down numeric cells; Shift+Enter moves up. Alt+arrow keys move between editable cells. Escape restores the saved value for one cell.</li>
                <li>Search and team filters keep all drafts. Review changes before saving, or use Ctrl/Cmd+S to open the review. A batch saves together.</li>
            </ul>
        </details>
        <form ref={formRef} action={formAction} noValidate className="space-y-4" onSubmit={event => {
            if (!count || isPending) { event.preventDefault(); return; }
            if (errorKeys.length) { showErrors(); return; }
            if (!reviewed.current) { event.preventDefault(); setReview(true); }
            else reviewed.current = false;
        }}>
            <div className="flex flex-wrap items-center gap-3">
                <SearchInput value={search} onChange={setSearch} placeholder="Search members or teams" className="w-full sm:w-64" />
                <Select label="Filter check-in rows" value={view} onChange={value => setView(value as View)} className="w-full sm:w-52" options={[{ value: 'all', label: 'All members' }, { value: 'missing', label: 'Missing entries' }, { value: 'edited', label: 'Unsaved changes' }, { value: 'errors', label: 'Needs correction' }]} />
                {!!errorKeys.length && <Button type="button" variant="danger" onClick={showErrors}>Show {errorKeys.length} errors</Button>}
                <p role="status" className="text-sm text-foreground/80">{visible.length} of {members.length} members shown</p>
            </div>
            {errorKeys.filter(key => !memberMap.has(key.split('|')[0]) || !columnMap.has(key.split('|')[1])).map(key => <div key={key} role="alert" className="rounded-lg border border-border p-3 text-sm">{errors[key]} <Button type="button" variant="ghost" onClick={() => change(key, '', '')}>Undo unavailable entry</Button></div>)}
            {notice && <p role="alert" className="rounded-lg border border-border p-3 text-sm">{notice}</p>}
            <div className="space-y-3 md:hidden">
                <label htmlFor="mobile-check-in-member" className="block text-sm font-semibold">Member check-in</label>
                <Select id="mobile-check-in-member" label="Member check-in" value={mobileMember?.id ?? ''} onChange={setMobileMemberId} options={visible.map(member => ({ value: member.id, label: `${member.name} - ${member.teamName}` }))} disabled={!visible.length} />
                <div className="flex items-center justify-between gap-3">
                    <Button type="button" variant="outline" disabled={mobileIndex <= 0} onClick={() => setMobileMemberId(visible[mobileIndex - 1].id)}>Previous</Button>
                    <p role="status" className="text-sm text-foreground/70">{visible.length ? `${mobileIndex + 1} of ${visible.length}` : 'No members'}</p>
                    <Button type="button" variant="outline" disabled={mobileIndex < 0 || mobileIndex >= visible.length - 1} onClick={() => setMobileMemberId(visible[mobileIndex + 1].id)}>Next</Button>
                </div>
            </div>
            <p id="check-in-table-help" className="text-sm text-foreground/80"><span className="hidden md:inline">Scroll across to see every metric. </span>Highlighted cells are edited and have not been saved. Empty attendance means not recorded.</p>
            <div className="md:max-h-[65dvh] md:overflow-auto rounded-xl border border-border bg-surface-ocean" tabIndex={0} aria-label="Weekly check-in entries">
                <table ref={tableRef} className="block md:table w-full border-separate border-spacing-0 text-sm" aria-describedby="check-in-table-help">
                    <caption className="sr-only">Week {weekNumber} check-in. Member order matches the filtered list.</caption>
                    <thead className="hidden md:table-header-group sticky top-0 z-20 bg-surface-deep"><tr>
                        <th scope="col" className="sticky left-0 z-30 min-w-44 max-w-60 border-b border-border bg-surface-deep p-3 text-left">Member</th>
                        {columns.map(column => <th key={column.id} scope="col" className="min-w-40 border-b border-border p-3 text-left font-semibold">{column.label}{column.locked && <span className="mt-1 flex items-center gap-1 text-xs font-normal"><Lock className="h-3 w-3" /> Locked</span>}</th>)}
                    </tr></thead>
                    <tbody className="block md:table-row-group">{visible.map((member, rowIndex) => <tr key={member.id} className={cn("md:table-row", member.id === mobileMember?.id ? "block" : "hidden")}>
                        <th scope="row" className="block md:table-cell md:sticky left-0 z-10 md:max-w-60 border-b border-border bg-surface-deep p-4 md:p-3 text-left font-semibold"><span className="block">{member.name}</span><span className="mt-1 block text-xs font-normal text-foreground/80">{member.teamName}</span></th>
                        {columns.map((column, columnIndex) => {
                            const key = cellKey(member.id, column.id), edited = key in drafts;
                            const value = drafts[key] ?? member.values[column.id] ?? '';
                            const props = { id: key, 'data-row': rowIndex, 'data-column': columnIndex,
                                'aria-label': `${column.label} for ${member.name}`, 'aria-invalid': !!errors[key],
                                'aria-describedby': errors[key] ? `${key}-error` : undefined,
                                disabled: isPending || column.locked,
                                onPaste: (event: React.ClipboardEvent) => pasteValues(event, rowIndex, columnIndex),
                                onKeyDown: (event: React.KeyboardEvent) => moveFocus(event, rowIndex, columnIndex),
                                className: cn('h-11 w-full min-w-28 rounded-lg border bg-surface-ocean px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagoon disabled:cursor-not-allowed disabled:opacity-60', errors[key] ? 'border-red-500' : edited ? 'border-amber-500 bg-amber-500/10' : 'border-border'),
                            };
                            return <td key={column.id} className="block md:table-cell border-b border-border p-4 md:p-2 align-top">
                                {(columnIndex === 0 || (columns[columnIndex - 1].kind !== column.kind && !(columns[columnIndex - 1].kind === 'km' && column.kind === 'lifestyle'))) && <p className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground/70 md:hidden">{column.kind === 'weight' ? 'Weight' : column.kind === 'attendance' ? 'Attendance' : 'Activity'}</p>}
                                <label htmlFor={key} className="mb-2 block text-sm font-medium md:hidden">{column.label}{column.locked && <span className="ml-2 text-xs text-foreground/70">Locked</span>}</label>
                                {column.kind === 'attendance' ? <select {...props} value={value} onChange={event => change(key, event.target.value, member.values[column.id] ?? '')}>
                                    <option value="">Not recorded</option><option value="present">Present</option><option value="absent">Absent</option>
                                </select> : <input {...props} type="text" inputMode={column.kind === 'lifestyle' ? 'numeric' : 'decimal'} autoComplete="off" placeholder="Not recorded" value={value} onChange={event => change(key, event.target.value, member.values[column.id] ?? '')} />}
                                {errors[key] ? <p id={`${key}-error`} className="mt-1 max-w-48 text-xs text-red-600 dark:text-red-300">{errors[key]}</p> : edited && <p className="mt-1 text-xs text-foreground/80">Edited · not saved</p>}
                                {edited && <button type="button" disabled={isPending} className="min-h-11 text-xs underline focus-visible:outline-2 focus-visible:outline-lagoon" onClick={() => change(key, member.values[column.id] ?? '', member.values[column.id] ?? '')}>Undo cell change</button>}
                            </td>;
                        })}
                    </tr>)}</tbody>
                </table>
                {!visible.length && <div className="p-8 text-center"><p>{members.length ? 'No members match these filters.' : 'Add active members to begin checking in.'}</p>{!members.length && <Link href="/members" className="inline-flex min-h-11 items-center underline">Manage members</Link>}<Button type="button" variant="ghost" onClick={() => { setTeam('all'); setSearch(''); setView('all'); }}>Clear filters</Button></div>}
            </div>
            <div className={cn("sticky bottom-3 z-30 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-deep p-4 shadow-lg", count ? "flex" : "hidden md:flex")}>
                <p role="status" className="text-sm font-semibold">{count ? `${count} unsaved cell change${count === 1 ? '' : 's'} across all teams` : 'All changes saved'}{!!errorKeys.length && ` · ${errorKeys.length} need correction`}</p>
                <div className="flex flex-wrap gap-2"><Button type="button" variant="ghost" disabled={!count || isPending} onClick={reset}>Discard changes</Button><Button type="submit" disabled={!count || isPending} isLoading={isPending}><Save className="mr-2 h-4 w-4" /> Review changes</Button></div>
            </div>
            <p role={state?.success === false ? 'alert' : 'status'} className="text-sm">{state?.message ?? 'Changes stay in this browser session until you save or discard them.'}</p>
            {state?.success === false && <Button type="button" variant="secondary" disabled={isPending} onClick={() => router.refresh()}>Refresh saved data · keep draft</Button>}
        </form>
        <Sheet isOpen={!!paste} onClose={() => setPaste(null)} title="Review pasted values">
            {paste && <div className="space-y-4">
                <p className="text-sm">{paste.length} nonblank cells will be added to your unsaved draft. No data is saved yet.</p>
                {paste.some(cell => cell.error) && <p role="alert" className="text-sm text-red-600 dark:text-red-300">Correct the source range and paste again. Invalid or locked cells prevent this paste from being applied.</p>}
                <div className="max-h-[50dvh] overflow-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Pasted cells</caption><thead><tr><th scope="col" className="p-2">Member / metric</th><th scope="col" className="p-2">New value</th></tr></thead><tbody>{paste.map(cell => <tr key={cell.key} className="border-t border-border"><td className="p-2">{cell.memberName}<span className="block text-xs">{cell.column}</span>{cell.error && <span className="block text-xs text-red-600 dark:text-red-300">{cell.error}</span>}</td><td className="p-2">{cell.value}</td></tr>)}</tbody></table></div>
                <div className="flex flex-wrap gap-2"><Button type="button" disabled={paste.some(cell => cell.error) || isPending} onClick={() => {
                    applyChanges(paste.map(cell => { const [memberId, columnId] = cell.key.split('|'); return { id: cell.key, value: cell.value, saved: memberMap.get(memberId)?.values[columnId] ?? '' }; }));
                    setNotice(`${paste.length} pasted cells applied to the draft. Review changes to save.`); setPaste(null);
                }}>Apply to draft</Button><Button type="button" variant="ghost" onClick={() => setPaste(null)}>Cancel paste</Button></div>
            </div>}
        </Sheet>
        <Sheet isOpen={review} onClose={closeReview} title={`Save Week ${weekNumber} check-in?`}>
            <div className="space-y-4">
                <p className="text-sm">Review all {count} changed cells, including edits hidden by team or search filters. These save together.</p>
                <div className="max-h-[50dvh] overflow-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Changes awaiting save</caption><thead><tr><th scope="col" className="p-2">Member / metric</th><th scope="col" className="p-2">Saved</th><th scope="col" className="p-2">New</th></tr></thead><tbody>{changes.map(({ key, member, column, value }) => <tr key={key} className="border-t border-border"><td className="p-2">{member.name}<span className="block text-xs">{column.label}</span></td><td className="p-2">{member.values[column.id] ?? 'Not recorded'}</td><td className="p-2 font-semibold">{value}</td></tr>)}</tbody></table></div>
                <div className="flex flex-wrap gap-2"><Button type="button" isLoading={isPending} disabled={!count || !!errorKeys.length} onClick={() => { reviewed.current = true; setReview(false); formRef.current?.requestSubmit(); }}><CalendarCheck className="mr-2 h-4 w-4" /> Save {count} {count === 1 ? 'change' : 'changes'}</Button><Button type="button" variant="ghost" disabled={isPending} onClick={closeReview}>Keep editing</Button></div>
            </div>
        </Sheet>
    </div>;
}
