'use server';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { parseCSV } from '@/lib/csvParser';
import { format } from 'date-fns';
import { ImportAttendanceRowSchema, ImportKmRowSchema, ImportLifestyleRowSchema, ImportWeighInRowSchema } from '@/lib/schemas';
import { writeAuditLog } from '@/lib/audit';
import { z } from 'zod';

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

        // 2. Process Rows inside a transaction for atomicity
        await prisma.$transaction(async (tx) => {
            const sessionIds = Array.from(sessionColMap.values());
            const memberIds = Array.from(memberMap.values());

            // Fetch existing attendance records
            const existingAttendance = await tx.attendance.findMany({
                where: {
                    sessionId: { in: sessionIds },
                    memberId: { in: memberIds }
                }
            });

            // Set of "sessionId_memberId" to identify existing records
            const existingSet = new Set<string>();
            existingAttendance.forEach(a => {
                existingSet.add(`${a.sessionId}_${a.memberId}`);
            });

            const toCreate: { sessionId: string; memberId: string; isPresent: boolean }[] = [];
            const toUpdate: { sessionId: string; memberId: string; isPresent: boolean }[] = [];

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row.length < 2) continue;

                const firstName = row[0].trim();
                const lastName = row[1].trim();
                const key = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`;
                const memberId = memberMap.get(key);

                if (!memberId) {
                    continue; // Skip unknown members without erroring loudly
                }

                for (const [colIndex, sessionId] of sessionColMap.entries()) {
                    if (colIndex >= row.length) continue;

                    const cellValue = row[colIndex];

                    // validate
                    const result = ImportAttendanceRowSchema.safeParse(cellValue);

                    if (!result.success) {
                        continue;
                    }

                    const isPresent = result.data;

                    if (isPresent !== null) { // true or false
                        const matchKey = `${sessionId}_${memberId}`;
                        if (existingSet.has(matchKey)) {
                            toUpdate.push({ sessionId, memberId, isPresent });
                        } else {
                            toCreate.push({ sessionId, memberId, isPresent });
                        }
                        successCount++;
                    }
                }
            }

            // Perform bulk inserts
            if (toCreate.length > 0) {
                await tx.attendance.createMany({ data: toCreate });
            }

            // Perform parallel updates
            if (toUpdate.length > 0) {
                await Promise.all(
                    toUpdate.map(upd => 
                        tx.attendance.update({
                            where: { sessionId_memberId: { sessionId: upd.sessionId, memberId: upd.memberId } },
                            data: { isPresent: upd.isPresent }
                        })
                    )
                );
            }
        }, { timeout: 30000 });

        await writeAuditLog({
            action: "IMPORT_ATTENDANCE",
            details: `Imported ${successCount} attendance records from file "${file.name}".`,
            entityType: "Block",
            entityId: block.id
        });

        revalidatePath('/attendance');
        revalidateTag('dashboard-stats', 'max');
        return {
            success: true,
            message: `Imported ${successCount} records. ${errors.length > 0 ? `(${errors.length} errors)` : ''}`
        };

    } catch (e) {
        console.error(e);
        return { success: false, message: 'Import failed: ' + (e as Error).message };
    }
}

async function importWeeklyData({
    formData,
    rowSchema,
    modelName,
    valueField,
    revalidatePathName
}: {
    formData: FormData;
    rowSchema: z.ZodTypeAny;
    modelName: 'kmLog' | 'lifestyleLog';
    valueField: 'totalKm' | 'postCount';
    revalidatePathName: string;
}) {
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

        await prisma.$transaction(async (tx) => {
            const weekIds = Array.from(weekColMap.values());
            const memberIds = Array.from(memberMap.values());

            // 1. Fetch existing logs
            let existingLogs: { memberId: string; blockWeekId: string }[] = [];
            if (modelName === 'kmLog') {
                existingLogs = await tx.kmLog.findMany({
                    where: { memberId: { in: memberIds }, blockWeekId: { in: weekIds } }
                });
            } else {
                existingLogs = await tx.lifestyleLog.findMany({
                    where: { memberId: { in: memberIds }, blockWeekId: { in: weekIds } }
                });
            }

            const existingSet = new Set<string>();
            existingLogs.forEach(log => {
                existingSet.add(`${log.memberId}_${log.blockWeekId}`);
            });

            const toCreate: { memberId: string; blockWeekId: string; value: number }[] = [];
            const toUpdate: { memberId: string; blockWeekId: string; value: number }[] = [];

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
                    const result = rowSchema.safeParse(cellValue);
                    if (!result.success) {
                        errors++;
                        continue;
                    }
                    const value = result.data as number;

                    const matchKey = `${memberId}_${blockWeekId}`;
                    if (existingSet.has(matchKey)) {
                        toUpdate.push({ memberId, blockWeekId, value });
                    } else {
                        toCreate.push({ memberId, blockWeekId, value });
                    }
                    successCount++;
                }
            }

            // 2. Perform bulk insertions
            if (toCreate.length > 0) {
                if (modelName === 'kmLog') {
                    const createData = toCreate.map(item => ({
                        memberId: item.memberId,
                        blockWeekId: item.blockWeekId,
                        totalKm: item.value
                    }));
                    await tx.kmLog.createMany({ data: createData });
                } else {
                    const createData = toCreate.map(item => ({
                        memberId: item.memberId,
                        blockWeekId: item.blockWeekId,
                        postCount: item.value
                    }));
                    await tx.lifestyleLog.createMany({ data: createData });
                }
            }

            // 3. Perform parallel updates
            if (toUpdate.length > 0) {
                if (modelName === 'kmLog') {
                    await Promise.all(
                        toUpdate.map(upd =>
                            tx.kmLog.update({
                                where: { memberId_blockWeekId: { memberId: upd.memberId, blockWeekId: upd.blockWeekId } },
                                data: { totalKm: upd.value }
                            })
                        )
                    );
                } else {
                    await Promise.all(
                        toUpdate.map(upd =>
                            tx.lifestyleLog.update({
                                where: { memberId_blockWeekId: { memberId: upd.memberId, blockWeekId: upd.blockWeekId } },
                                data: { postCount: upd.value }
                            })
                        )
                    );
                }
            }
        }, { timeout: 30000 });

        await writeAuditLog({
            action: `IMPORT_${revalidatePathName.substring(1).toUpperCase()}`,
            details: `Imported ${successCount} entries from file "${file.name}".`,
            entityType: "Block",
            entityId: block.id
        });

        revalidatePath(revalidatePathName);
        revalidateTag('dashboard-stats', 'max');
        return { success: true, message: `Imported ${successCount} entries. ${errors > 0 ? `${errors} skipped (invalid)` : ''}` };

    } catch (e) {
        return { success: false, message: 'Import failed: ' + (e as Error).message };
    }
}

export async function importKm(formData: FormData) {
    return importWeeklyData({
        formData,
        rowSchema: ImportKmRowSchema,
        modelName: 'kmLog',
        valueField: 'totalKm',
        revalidatePathName: '/km'
    });
}

export async function importLifestyle(formData: FormData) {
    return importWeeklyData({
        formData,
        rowSchema: ImportLifestyleRowSchema,
        modelName: 'lifestyleLog',
        valueField: 'postCount',
        revalidatePathName: '/lifestyle'
    });
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

        await prisma.$transaction(async (tx) => {
            const memberIds = Array.from(memberMap.values());
            
            // 1. Fetch all existing weigh-ins for these members in this block
            const existingWeighIns = await tx.weighIn.findMany({
                where: {
                    memberId: { in: memberIds },
                    date: {
                        gte: block.startDate,
                        lte: block.endDate
                    }
                }
            });

            // Group existing records by memberId for O(1) retrieval
            const existingMap = new Map<string, typeof existingWeighIns>();
            existingWeighIns.forEach(w => {
                if (!existingMap.has(w.memberId)) {
                    existingMap.set(w.memberId, []);
                }
                existingMap.get(w.memberId)!.push(w);
            });

            const toCreate: { memberId: string; date: Date; weight: number }[] = [];
            const toUpdate: { memberId: string; date: Date; weight: number }[] = [];

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

                    const weekStart = new Date(week.startDate);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);

                    // Search in-memory
                    const memberWeighIns = existingMap.get(memberId) || [];
                    const existing = memberWeighIns.find(w => {
                        const d = new Date(w.date);
                        return d >= weekStart && d <= weekEnd;
                    });

                    if (existing) {
                        toUpdate.push({
                            memberId: existing.memberId,
                            date: existing.date,
                            weight
                        });
                    } else {
                        toCreate.push({
                            memberId,
                            date: weekStart,
                            weight
                        });
                    }
                    successCount++;
                }
            }

            // 2. Perform bulk insertions
            if (toCreate.length > 0) {
                await tx.weighIn.createMany({ data: toCreate });
            }

            // 3. Perform parallel updates
            if (toUpdate.length > 0) {
                await Promise.all(
                    toUpdate.map(upd =>
                        tx.weighIn.update({
                            where: { memberId_date: { memberId: upd.memberId, date: upd.date } },
                            data: { weight: upd.weight }
                        })
                    )
                );
            }
        }, { timeout: 30000 });
        await writeAuditLog({
            action: "IMPORT_WEIGH_IN",
            details: `Imported ${successCount} weigh-in entries from file "${file.name}".`,
            entityType: "Block",
            entityId: block.id
        });

        revalidatePath('/weigh-in');
        revalidateTag('dashboard-stats', 'max');
        return { success: true, message: `Imported ${successCount} entries. ${errors > 0 ? `${errors} skipped (invalid)` : ''}` };

    } catch (e) {
        return { success: false, message: 'Import failed: ' + (e as Error).message };
    }
}
