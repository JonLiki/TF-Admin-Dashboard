import { z } from 'zod';
import { addUtcDays } from '@/lib/dates';
import { weightLossWindow } from '@/lib/scoring-logic';

export interface CheckInColumn {
    id: string;
    label: string;
    kind: 'weight' | 'km' | 'lifestyle' | 'attendance';
    date?: string;
    sessionId?: string;
    locked: boolean;
}
export interface CheckInMember {
    id: string;
    name: string;
    teamId: string | null;
    teamName: string;
    values: Record<string, string | null>;
}
export type CheckInDrafts = Record<string, string>;
export const cellKey = (memberId: string, columnId: string) => `${memberId}|${columnId}`;

export function checkInColumns(week: { startDate: Date; isFinalized: boolean },
    sessions: { id: string; type: string; date: Date }[], finalizedWeeks: { startDate: Date }[]): CheckInColumn[] {
    const dateLabel = (date: Date) => date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', timeZone: 'UTC' });
    const weight = (id: string, date: Date, label: string): CheckInColumn => ({
        id, label: `${label} ${dateLabel(date)} (kg)`, kind: 'weight', date: date.toISOString(),
        locked: week.isFinalized || finalizedWeeks.some(locked => {
            const window = weightLossWindow(locked.startDate);
            return date >= window.start && date < window.end;
        }),
    });
    return [
        weight('weight-start', week.startDate, 'Start'),
        weight('weight-end', addUtcDays(week.startDate, 7), 'End'),
        { id: 'km', label: 'Distance (km)', kind: 'km', locked: week.isFinalized },
        { id: 'lifestyle', label: 'Lifestyle (posts)', kind: 'lifestyle', locked: week.isFinalized },
        ...sessions.map(session => ({ id: `attendance:${session.id}`, label: `${session.type} ${dateLabel(session.date)}`,
            kind: 'attendance' as const, sessionId: session.id, locked: week.isFinalized })),
    ];
}

export function normalizeCheckInValue(value: string, column: CheckInColumn): string {
    const trimmed = value.trim();
    if (column.kind === 'attendance') {
        if (['present', 'p', 'true', '1'].includes(trimmed.toLowerCase())) return 'present';
        if (['absent', 'a', 'false', '0'].includes(trimmed.toLowerCase())) return 'absent';
        return trimmed;
    }
    // Keep invalid values visible for correction; never silently coerce blank to zero.
    if (trimmed && Number.isFinite(Number(trimmed))) return String(Number(trimmed));
    return trimmed;
}

export function checkInError(value: string, column: CheckInColumn): string | undefined {
    if (column.locked) return 'This entry is locked by a finalized week.';
    if (!value.trim()) return 'Enter a value. Clearing does not delete a saved record.';
    const normalized = normalizeCheckInValue(value, column);
    if (column.kind === 'attendance') return ['present', 'absent'].includes(normalized) ? undefined : 'Use Present or Absent (P/A or 1/0).';
    const number = Number(normalized);
    if (!Number.isFinite(number) || number < 0) return 'Enter a number of zero or more.';
    if (column.kind === 'weight' && number > 500) return 'Weight must be 500 kg or less.';
    if (column.kind === 'km' && number > 200) return 'Distance must be 200 km or less.';
    if (column.kind === 'lifestyle' && (!Number.isSafeInteger(number) || number > 2147483647)) return 'Enter a whole number of posts (0–2147483647).';
}

// Excel and Sheets quote cells containing delimiters or newlines.
export function parseClipboard(text: string): string[][] {
    const delimiter = text.includes('\t') ? '\t' : ',';
    const rows: string[][] = [];
    let row: string[] = [], cell = '', quoted = false;
    for (let index = 0; index < text.length; index++) {
        const char = text[index];
        if (char === '"') {
            if (quoted && text[index + 1] === '"') { cell += '"'; index++; }
            else quoted = !quoted;
        } else if (!quoted && char === delimiter) { row.push(cell); cell = ''; }
        else if (!quoted && (char === '\n' || char === '\r')) {
            if (char === '\r' && text[index + 1] === '\n') index++;
            row.push(cell); rows.push(row); row = []; cell = '';
        } else cell += char;
    }
    if (quoted) throw new Error('The pasted text contains an unfinished quoted cell.');
    if (cell || row.length) { row.push(cell); rows.push(row); }
    while (rows.length && rows[rows.length - 1].every(value => !value.trim())) rows.pop();
    return rows;
}

export interface PasteCell { key: string; memberName: string; column: string; value: string; error?: string }
export function previewCheckInPaste(text: string, members: CheckInMember[], columns: CheckInColumn[], rowIndex: number, columnIndex: number): PasteCell[] {
    if (text.length > 2000000) throw new Error('Paste a smaller range (up to 5000 cells).');
    if (rowIndex < 0 || columnIndex < 0 || rowIndex >= members.length || columnIndex >= columns.length) throw new Error('Choose a visible destination cell first.');
    const rows = parseClipboard(text);
    if (!rows.length) throw new Error('The clipboard has no values to paste.');
    if (rows.length > members.length - rowIndex || rows.some(row => row.length > columns.length - columnIndex)) {
        throw new Error('The pasted range extends beyond the visible rows or columns. Filter the team and paste values without headers or member names.');
    }
    const result: PasteCell[] = [];
    rows.forEach((row, y) => row.forEach((raw, x) => {
        if (!raw.trim() || raw.trim() === '-') return; // blanks leave existing data untouched
        const member = members[rowIndex + y], column = columns[columnIndex + x];
        const value = normalizeCheckInValue(raw, column);
        result.push({ key: cellKey(member.id, column.id), memberName: member.name, column: column.label, value, error: checkInError(value, column) });
    }));
    if (!result.length) throw new Error('There are no nonblank values to paste. Blank cells leave saved entries unchanged.');
    if (result.length > 5000) throw new Error('Paste a smaller range (up to 5000 cells).');
    return result;
}

export const CheckInPayloadSchema = z.object({
    weekId: z.string().uuid(),
    cells: z.array(z.object({ memberId: z.string().uuid(), columnId: z.string().min(1).max(80), value: z.string().max(100), previous: z.string().max(100).nullable() }).strict()).min(1).max(5000),
}).strict();

export function checkInFormData(drafts: CheckInDrafts, members: CheckInMember[], columns: CheckInColumn[], weekId: string): FormData {
    const memberMap = new Map(members.map(member => [member.id, member]));
    const columnMap = new Map(columns.map(column => [column.id, column]));
    const cells = Object.entries(drafts).map(([key, draft]) => {
        const [memberId, columnId] = key.split('|');
        const member = memberMap.get(memberId), column = columnMap.get(columnId);
        // Keep stale/removed rows in the request so the server rejects them instead of dropping edits.
        return { memberId, columnId, value: column ? normalizeCheckInValue(draft, column) : draft, previous: member?.values[columnId] ?? null };
    });
    const data = new FormData();
    data.set('payload', JSON.stringify({ weekId, cells }));
    return data;
}
