'use server';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/auth-guard';
import { getCheckInSnapshot } from '@/lib/check-in-queries';
import { CheckInPayloadSchema, cellKey, checkInError, normalizeCheckInValue } from '@/lib/check-in';
import { revalidatePath, revalidateTag } from 'next/cache';

class CheckInSaveError extends Error {}

export async function saveWeeklyCheckIn(_previous: unknown, formData: FormData) {
    const guard = await requireAdmin();
    if (!guard.success) return guard;
    let raw: unknown;
    try {
        const json = formData.get('payload');
        if (typeof json !== 'string' || json.length > 2000000) throw new Error();
        raw = JSON.parse(json);
    } catch { return { success: false, message: 'Could not read the check-in changes. Nothing was saved.' }; }
    const parsed = CheckInPayloadSchema.safeParse(raw);
    if (!parsed.success) return { success: false, message: 'Select a valid week and provide 1–5000 valid cell changes. Nothing was saved.' };
    let count: number;
    try {
        count = await prisma.$transaction(async tx => {
            // Read locks, current values and active membership within the same transaction as the writes.
            const snapshot = await getCheckInSnapshot(parsed.data.weekId, tx);
            if (!snapshot || !snapshot.week.block.isActive) throw new CheckInSaveError('This week is not in the active block. Nothing was saved.');
            if (snapshot.week.isFinalized) throw new CheckInSaveError('This week has been finalized. Reopen it before editing. Nothing was saved.');
            const members = new Map(snapshot.members.map(member => [member.id, member]));
            const columns = new Map(snapshot.columns.map(column => [column.id, column]));
            const seen = new Set<string>();
            // Validate the entire batch before the first write.
            const changes = parsed.data.cells.map(cell => {
                const key = cellKey(cell.memberId, cell.columnId);
                if (seen.has(key)) throw new CheckInSaveError('A cell was submitted twice. Nothing was saved.');
                seen.add(key);
                const member = members.get(cell.memberId), column = columns.get(cell.columnId);
                if (!member || !column) throw new CheckInSaveError('A member or session is no longer available in this week. Refresh saved data and review your changes.');
                const error = checkInError(cell.value, column);
                if (error) throw new CheckInSaveError(`${member.name}, ${column.label}: ${error} Nothing was saved.`);
                const current = member.values[column.id] ?? null;
                const expected = cell.previous === null ? null : normalizeCheckInValue(cell.previous, column);
                if (current !== expected) throw new CheckInSaveError('A saved entry changed since this page loaded. Refresh saved data and review your draft before saving again. Nothing was saved.');
                return { memberId: cell.memberId, column, value: normalizeCheckInValue(cell.value, column) };
            });
            for (const { memberId, column, value } of changes) {
                const blockWeekId = snapshot.week.id;
                if (column.kind === 'weight') {
                    const date = new Date(column.date!);
                    await tx.weighIn.upsert({ where: { memberId_date: { memberId, date } }, update: { weight: Number(value) }, create: { memberId, date, weight: Number(value) } });
                } else if (column.kind === 'km') {
                    await tx.kmLog.upsert({ where: { memberId_blockWeekId: { memberId, blockWeekId } }, update: { totalKm: Number(value) }, create: { memberId, blockWeekId, totalKm: Number(value) } });
                } else if (column.kind === 'lifestyle') {
                    await tx.lifestyleLog.upsert({ where: { memberId_blockWeekId: { memberId, blockWeekId } }, update: { postCount: Number(value) }, create: { memberId, blockWeekId, postCount: Number(value) } });
                } else {
                    const sessionId = column.sessionId!;
                    await tx.attendance.upsert({ where: { sessionId_memberId: { sessionId, memberId } }, update: { isPresent: value === 'present' }, create: { sessionId, memberId, isPresent: value === 'present' } });
                }
            }
            await tx.auditLog.create({ data: { userId: guard.session.user?.id ?? null, action: 'SAVE_WEEKLY_CHECK_IN', entityType: 'BlockWeek', entityId: snapshot.week.id,
                details: `Saved ${changes.length} cells for ${new Set(changes.map(change => change.memberId)).size} members in Week ${snapshot.week.weekNumber}.` } });
            return changes.length;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
    } catch (error) {
        if (error instanceof CheckInSaveError) return { success: false, message: error.message };
        console.error('Weekly check-in save failed:', error);
        return { success: false, message: 'Could not save this batch. No changes were saved. Your draft is still here; refresh saved data if another update occurred, then try again.' };
    }
    // The transaction has committed. A cache-refresh failure must not claim the write failed.
    try {
        for (const path of ['/', '/check-in', '/weigh-in', '/km', '/lifestyle', '/attendance', '/summary', '/scoreboard', '/members', '/user/dashboard']) revalidatePath(path);
        revalidateTag('dashboard-stats', 'max');
    } catch (error) {
        console.error('Check-in saved, but page refresh failed:', error);
        return { success: true, message: `Saved ${count} check-in changes. Refresh this page to load the latest saved values.` };
    }
    return { success: true, message: `Saved ${count} check-in change${count === 1 ? '' : 's'}.` };
}
