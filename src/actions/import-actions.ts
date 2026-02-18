'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { parseCSV } from '@/lib/csvParser';
import { format } from 'date-fns';
import { ImportAttendanceRowSchema, ImportKmRowSchema, ImportLifestyleRowSchema, ImportWeighInRowSchema } from '@/lib/schemas';

// Helper to get active block and members map
async function getImportContext() {
    const block = await prisma.block.findFirst({
        where: { isActive: true },
        include: {
            weeks: { orderBy: { weekNumber: 'asc' } },
            sessions: { orderBy: { date: 'asc' } }
        }
    });

    if (!block) throw new Error('No active block found');

    const members = await prisma.member.findMany({
        where: { isActive: true }
    });

    const memberMap = new Map<string, string>(); // "First Last" -> id
    members.forEach(m => {
        const key = `${m.firstName.trim().toLowerCase()} ${m.lastName.trim().toLowerCase()}`;
        memberMap.set(key, m.id);
    });

    return { block, memberMap };
}

export async function importAttendance(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) return { success: false, message: 'No file provided' };

    try {
        const text = await file.text();
        const rows = parseCSV(text);
        if (rows.length < 2) return { success: false, message: 'Invalid CSV format: insufficient rows' };

        const header = rows[0];
        const { block, memberMap } = await getImportContext();

        // 1. Map Columns to Sessions
        const sessionColMap = new Map<number, string>();
        for (let i = 5; i < header.length; i++) {
            const colHeader = header[i];
            const matchedSession = block.sessions.find(s => {
                const formatted = `${format(s.date, 'MMM d')} (${s.type})`;
                return formatted === colHeader;
            });
            if (matchedSession) sessionColMap.set(i, matchedSession.id);
        }

        let successCount = 0;
        const errors: string[] = [];

        // 2. Process Rows
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 2) continue;

            const firstName = row[0].trim();
            const lastName = row[1].trim();
            const key = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`;
            const memberId = memberMap.get(key);

            if (!memberId) {
                // errors.push(`Row ${i + 1}: Member "${firstName} ${lastName}" not found`);
                // errorCount++;
                continue; // Skip unknown members without erroring loudly
            }

            for (const [colIndex, sessionId] of sessionColMap.entries()) {
                if (colIndex >= row.length) continue;

                const cellValue = row[colIndex];

                // validate
                const result = ImportAttendanceRowSchema.safeParse(cellValue);

                if (!result.success) {
                    // Invalid format (e.g. "Maybe")
                    // errors.push(`Row ${i + 1}: Invalid attendance value "${cellValue}"`);
                    // errorCount++;
                    continue;
                }

                const isPresent = result.data;

                if (isPresent !== null) { // true or false
                    await prisma.attendance.upsert({
                        where: { sessionId_memberId: { sessionId, memberId } },
                        update: { isPresent },
                        create: { sessionId, memberId, isPresent }
                    });
                    successCount++;
                }
            }
        }

        revalidatePath('/attendance');
        return {
            success: true,
            message: `Imported ${successCount} records. ${errors.length > 0 ? `(${errors.length} errors)` : ''}`
        };

    } catch (e) {
        console.error(e);
        return { success: false, message: 'Import failed: ' + (e as Error).message };
    }
}

export async function importKm(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) return { success: false, message: 'No file provided' };

    try {
        const text = await file.text();
        const rows = parseCSV(text);
        if (rows.length < 2) return { success: false, message: 'Invalid CSV format' };

        const header = rows[0];
        const { block, memberMap } = await getImportContext();

        const weekColMap = new Map<number, string>();
        for (let i = 4; i < header.length; i++) {
            const colHeader = header[i];
            const match = colHeader.match(/Week (\d+)/);
            if (match) {
                const weekNum = parseInt(match[1]);
                const matchedWeek = block.weeks.find(w => w.weekNumber === weekNum);
                if (matchedWeek) weekColMap.set(i, matchedWeek.id);
            }
        }

        let successCount = 0;
        let errors = 0;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 2) continue;

            const firstName = row[0].trim();
            const lastName = row[1].trim();
            const key = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`;
            const memberId = memberMap.get(key);
            if (!memberId) continue;

            for (const [colIndex, blockWeekId] of weekColMap.entries()) {
                if (colIndex >= row.length) continue;
                const cellValue = row[colIndex];
                if (!cellValue || cellValue.trim() === '' || cellValue.trim() === '-') continue;

                // Validate
                const result = ImportKmRowSchema.safeParse(cellValue);
                if (!result.success) {
                    errors++;
                    continue;
                }

                await prisma.kmLog.upsert({
                    where: { memberId_blockWeekId: { memberId, blockWeekId } },
                    update: { totalKm: result.data },
                    create: { memberId, blockWeekId, totalKm: result.data }
                });
                successCount++;
            }
        }

        revalidatePath('/km');
        return { success: true, message: `Imported ${successCount} entries. ${errors > 0 ? `${errors} skipped (invalid)` : ''}` };

    } catch (e) {
        return { success: false, message: 'Import failed: ' + (e as Error).message };
    }
}

export async function importLifestyle(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) return { success: false, message: 'No file provided' };

    try {
        const text = await file.text();
        const rows = parseCSV(text);
        if (rows.length < 2) return { success: false, message: 'Invalid CSV' };

        const header = rows[0];
        const { block, memberMap } = await getImportContext();

        const weekColMap = new Map<number, string>();
        for (let i = 4; i < header.length; i++) {
            const colHeader = header[i];
            const match = colHeader.match(/Week (\d+)/);
            if (match) {
                const weekNum = parseInt(match[1]);
                const matchedWeek = block.weeks.find(w => w.weekNumber === weekNum);
                if (matchedWeek) weekColMap.set(i, matchedWeek.id);
            }
        }

        let successCount = 0;
        let errors = 0;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 2) continue;

            const firstName = row[0].trim();
            const lastName = row[1].trim();
            const key = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`;
            const memberId = memberMap.get(key);

            if (!memberId) continue;

            for (const [colIndex, blockWeekId] of weekColMap.entries()) {
                if (colIndex >= row.length) continue;
                const cellValue = row[colIndex];
                if (!cellValue || cellValue.trim() === '' || cellValue.trim() === '-') continue;

                // Validate
                const result = ImportLifestyleRowSchema.safeParse(cellValue);
                if (!result.success) {
                    errors++;
                    continue;
                }

                await prisma.lifestyleLog.upsert({
                    where: { memberId_blockWeekId: { memberId, blockWeekId } },
                    update: { postCount: result.data },
                    create: { memberId, blockWeekId, postCount: result.data }
                });
                successCount++;
            }
        }
        revalidatePath('/lifestyle');
        return { success: true, message: `Imported ${successCount} entries. ${errors > 0 ? `${errors} skipped (invalid)` : ''}` };

    } catch (e) {
        return { success: false, message: 'Import failed: ' + (e as Error).message };
    }
}

export async function importWeighIn(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) return { success: false, message: 'No file provided' };

    try {
        const text = await file.text();
        const rows = parseCSV(text);
        if (rows.length < 2) return { success: false, message: 'Invalid CSV' };

        const header = rows[0];
        const { block, memberMap } = await getImportContext();

        type Week = typeof block.weeks[0];
        const weekColMap = new Map<number, Week>();
        for (let i = 6; i < header.length; i++) {
            const colHeader = header[i];
            const match = colHeader.match(/Week (\d+)/);
            if (match) {
                const weekNum = parseInt(match[1]);
                const matchedWeek = block.weeks.find(w => w.weekNumber === weekNum);
                if (matchedWeek) weekColMap.set(i, matchedWeek);
            }
        }

        let successCount = 0;
        let errors = 0;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 2) continue;

            const firstName = row[0].trim();
            const lastName = row[1].trim();
            const key = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`;
            const memberId = memberMap.get(key);

            if (!memberId) continue;

            for (const [colIndex, week] of weekColMap.entries()) {
                if (colIndex >= row.length) continue;
                const cellValue = row[colIndex];
                if (!cellValue || cellValue.trim() === '' || cellValue.trim() === '-') continue;

                // Validate
                const result = ImportWeighInRowSchema.safeParse(cellValue);
                if (!result.success) {
                    errors++;
                    continue;
                }
                const weight = result.data;

                // Find existing weigh-in for this week (to preserve strict Monday rule if importing?)
                // Or just use week start date as per rule
                const weekStart = new Date(week.startDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);

                const existing = await prisma.weighIn.findFirst({
                    where: {
                        memberId,
                        date: { gte: weekStart, lte: weekEnd }
                    }
                });

                if (existing) {
                    await prisma.weighIn.update({
                        where: { memberId_date: { memberId: existing.memberId, date: existing.date } },
                        data: { weight }
                    });
                } else {
                    await prisma.weighIn.create({
                        data: { memberId, date: weekStart, weight }
                    });
                }
                successCount++;
            }
        }
        revalidatePath('/weigh-in');
        return { success: true, message: `Imported ${successCount} entries. ${errors > 0 ? `${errors} skipped (invalid)` : ''}` };

    } catch (e) {
        return { success: false, message: 'Import failed: ' + (e as Error).message };
    }
}
