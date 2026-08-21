'use server';

import prisma from '@/lib/prisma';

import { revalidatePath, revalidateTag } from 'next/cache';
import { WeighInSchema, KmLogSchema, LifestyleLogSchema, BenchmarkLogSchema } from '@/lib/schemas';
import { requireAdmin } from '@/lib/auth-guard';
import { writeAuditLog } from '@/lib/audit';
import { toUtcDateOnly } from '@/lib/dates';

// --- WEIGH-INS ---
export async function submitWeighIn(prevState: unknown, formData: FormData) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    const weightStr = formData.get('weight') as string;
    const weightVal = weightStr ? parseFloat(weightStr) : undefined;

    // If weight is not a number (empty or invalid), we can either return error or ignore.
    // If it's NaN, Zod might fail or we handle it here.
    if (weightVal === undefined || isNaN(weightVal)) {
        console.error("Invalid weight input:", weightStr);
        return { success: false, message: "Invalid weight" };
    }

    const rawData = {
        memberId: formData.get('memberId'),
        weight: weightVal,
        date: formData.get('date'),
    };

    const validated = WeighInSchema.safeParse(rawData);

    if (!validated.success) {
        console.error("WeighIn validation failed:", validated.error);
        return { success: false, message: validated.error.issues[0].message };
    }

    // Normalize to UTC midnight — seed and CSV import store UTC-midnight dates,
    // and WeighIn has a @@unique([memberId, date]) key that must match them.
    const dateObj = toUtcDateOnly(validated.data.date);

    try {
        const weighIn = await prisma.weighIn.upsert({
            where: {
                memberId_date: {
                    memberId: validated.data.memberId,
                    date: dateObj
                }
            },
            update: { weight: validated.data.weight },
            create: {
                memberId: validated.data.memberId,
                date: dateObj,
                weight: validated.data.weight
            }
        });
        await writeAuditLog({
            action: "LOG_WEIGH_IN",
            details: `Logged weigh-in of ${validated.data.weight}kg for member ${validated.data.memberId} on ${validated.data.date}.`,
            entityType: "WeighIn",
            entityId: weighIn.id
        });
        revalidatePath('/weigh-in');
        revalidateTag('dashboard-stats', 'max');
        return { success: true, message: "Weigh-in saved" };
    } catch (error) {
        console.error("Database error saving weigh-in:", error);
        return { success: false, message: "Failed to save weigh-in" };
    }
}

// Bulk save: one transaction for every `weight_<memberId>` field with a value.
// Blank inputs are skipped (not deleted); invalid ones are counted and reported.
export async function submitWeighInsBulk(prevState: unknown, formData: FormData) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    const dateRaw = formData.get('date');
    if (typeof dateRaw !== 'string' || !dateRaw) {
        return { success: false, message: "Missing weigh-in date" };
    }
    const dateObj = toUtcDateOnly(dateRaw);

    const ops: { memberId: string; weight: number }[] = [];
    let invalid = 0;

    for (const [key, value] of formData.entries()) {
        if (!key.startsWith('weight_')) continue;
        const raw = typeof value === 'string' ? value.trim() : '';
        if (raw === '') continue; // blank = leave untouched
        const weight = parseFloat(raw);
        const memberId = key.slice('weight_'.length);
        const validated = WeighInSchema.safeParse({ memberId, weight, date: dateRaw });
        if (!validated.success || Number.isNaN(weight)) { invalid++; continue; }
        ops.push({ memberId: validated.data.memberId, weight: validated.data.weight });
    }

    if (ops.length === 0) {
        return { success: false, message: invalid > 0 ? "No valid weights to save" : "No weights entered" };
    }

    try {
        await prisma.$transaction(
            ops.map((o) =>
                prisma.weighIn.upsert({
                    where: { memberId_date: { memberId: o.memberId, date: dateObj } },
                    update: { weight: o.weight },
                    create: { memberId: o.memberId, date: dateObj, weight: o.weight },
                }),
            ),
        );
        const suffix = invalid > 0 ? ` (${invalid} skipped)` : '';
        await writeAuditLog({
            action: "LOG_WEIGH_INS_BULK",
            details: `Bulk-saved ${ops.length} weigh-in${ops.length === 1 ? '' : 's'} for ${dateRaw}${suffix}.`,
            entityType: "WeighIn"
        });
        revalidatePath('/weigh-in');
        revalidateTag('dashboard-stats', 'max');
        return { success: true, message: `Saved ${ops.length} weigh-in${ops.length === 1 ? '' : 's'}${suffix}` };
    } catch (error) {
        console.error("Database error saving weigh-ins (bulk):", error);
        return { success: false, message: "Failed to save weigh-ins" };
    }
}

// --- KM LOGS ---
export async function submitKmLog(prevState: unknown, formData: FormData) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    const kmStr = formData.get('totalKm') as string;
    const kmVal = kmStr ? parseFloat(kmStr) : undefined;

    if (kmVal === undefined || isNaN(kmVal)) {
        return { success: false, message: "Invalid KM value" };
    }

    const rawData = {
        memberId: formData.get('memberId'),
        blockWeekId: formData.get('blockWeekId'),
        totalKm: kmVal,
    };

    const validated = KmLogSchema.safeParse(rawData);

    if (!validated.success) {
        return { success: false, message: validated.error.issues[0].message };
    }

    try {
        // Guard: check if week is finalized
        const blockWeek = await prisma.blockWeek.findUnique({ where: { id: validated.data.blockWeekId } });
        if (blockWeek?.isFinalized) {
            return { success: false, message: "This week has been finalized. Unfinalize to edit." };
        }

        const kmLog = await prisma.kmLog.upsert({
            where: {
                memberId_blockWeekId: {
                    memberId: validated.data.memberId,
                    blockWeekId: validated.data.blockWeekId
                }
            },
            update: { totalKm: validated.data.totalKm },
            create: {
                memberId: validated.data.memberId,
                blockWeekId: validated.data.blockWeekId,
                totalKm: validated.data.totalKm
            }
        });
        await writeAuditLog({
            action: "LOG_KM",
            details: `Logged ${validated.data.totalKm}km for member ${validated.data.memberId} (week ${validated.data.blockWeekId}).`,
            entityType: "KmLog",
            entityId: kmLog.id
        });
        revalidatePath('/km');
        revalidateTag('dashboard-stats', 'max');
        return { success: true };
    } catch (error) {
        console.error("Error saving KM Log:", error);
        return { success: false, message: "Failed to save" };
    }
}

// Bulk save for KM logs: one transaction for every `km_<memberId>` field with a value.
export async function submitKmLogsBulk(prevState: unknown, formData: FormData) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    const blockWeekId = formData.get('blockWeekId');
    if (typeof blockWeekId !== 'string' || !blockWeekId) {
        return { success: false, message: "Missing week ID" };
    }

    const blockWeek = await prisma.blockWeek.findUnique({ where: { id: blockWeekId } });
    if (blockWeek?.isFinalized) {
        return { success: false, message: "This week has been finalized. Unfinalize to edit." };
    }

    const ops: { memberId: string; totalKm: number }[] = [];
    let invalid = 0;

    for (const [key, value] of formData.entries()) {
        if (!key.startsWith('km_')) continue;
        const raw = typeof value === 'string' ? value.trim() : '';
        if (raw === '') continue;
        const totalKm = parseFloat(raw);
        const memberId = key.slice('km_'.length);
        const validated = KmLogSchema.safeParse({ memberId, blockWeekId, totalKm });
        if (!validated.success || Number.isNaN(totalKm)) { invalid++; continue; }
        ops.push({ memberId: validated.data.memberId, totalKm: validated.data.totalKm });
    }

    if (ops.length === 0) {
        return { success: false, message: invalid > 0 ? "No valid KM values to save" : "No KM values entered" };
    }

    try {
        await prisma.$transaction(
            ops.map((o) =>
                prisma.kmLog.upsert({
                    where: { memberId_blockWeekId: { memberId: o.memberId, blockWeekId } },
                    update: { totalKm: o.totalKm },
                    create: { memberId: o.memberId, blockWeekId, totalKm: o.totalKm },
                }),
            ),
        );
        const suffix = invalid > 0 ? ` (${invalid} skipped)` : '';
        await writeAuditLog({
            action: "LOG_KM_BULK",
            details: `Bulk-saved ${ops.length} KM log${ops.length === 1 ? '' : 's'} for week ${blockWeekId}${suffix}.`,
            entityType: "KmLog"
        });
        revalidatePath('/km');
        revalidateTag('dashboard-stats', 'max');
        return { success: true, message: `Saved ${ops.length} KM log${ops.length === 1 ? '' : 's'}${suffix}` };
    } catch (error) {
        console.error("Database error saving KM logs (bulk):", error);
        return { success: false, message: "Failed to save KM logs" };
    }
}

// --- LIFESTYLE LOGS ---
export async function submitLifestyleLog(prevState: unknown, formData: FormData) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    const postCountStr = formData.get('postCount') as string;
    const postCountVal = postCountStr ? parseInt(postCountStr) : undefined;

    if (postCountVal === undefined || isNaN(postCountVal)) {
        return { success: false, message: "Invalid post count" };
    }

    const rawData = {
        memberId: formData.get('memberId'),
        blockWeekId: formData.get('blockWeekId'),
        postCount: postCountVal,
    };

    const validated = LifestyleLogSchema.safeParse(rawData);

    if (!validated.success) {
        return { success: false, message: validated.error.issues[0].message };
    }

    try {
        // Guard: check if week is finalized
        const blockWeek = await prisma.blockWeek.findUnique({ where: { id: validated.data.blockWeekId } });
        if (blockWeek?.isFinalized) {
            return { success: false, message: "This week has been finalized. Unfinalize to edit." };
        }

        const lifestyleLog = await prisma.lifestyleLog.upsert({
            where: {
                memberId_blockWeekId: {
                    memberId: validated.data.memberId,
                    blockWeekId: validated.data.blockWeekId
                }
            },
            update: { postCount: validated.data.postCount },
            create: {
                memberId: validated.data.memberId,
                blockWeekId: validated.data.blockWeekId,
                postCount: validated.data.postCount
            }
        });
        await writeAuditLog({
            action: "LOG_LIFESTYLE",
            details: `Logged ${validated.data.postCount} lifestyle post${validated.data.postCount === 1 ? '' : 's'} for member ${validated.data.memberId} (week ${validated.data.blockWeekId}).`,
            entityType: "LifestyleLog",
            entityId: lifestyleLog.id
        });
        revalidatePath('/lifestyle');
        revalidateTag('dashboard-stats', 'max');
        return { success: true };
    } catch (error) {
        console.error("Error saving Lifestyle Log:", error);
        return { success: false, message: "Failed to save" };
    }
}

// Bulk save for lifestyle logs: one transaction for every `post_<memberId>` field with a value.
export async function submitLifestyleLogsBulk(prevState: unknown, formData: FormData) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    const blockWeekId = formData.get('blockWeekId');
    if (typeof blockWeekId !== 'string' || !blockWeekId) {
        return { success: false, message: "Missing week ID" };
    }

    const blockWeek = await prisma.blockWeek.findUnique({ where: { id: blockWeekId } });
    if (blockWeek?.isFinalized) {
        return { success: false, message: "This week has been finalized. Unfinalize to edit." };
    }

    const ops: { memberId: string; postCount: number }[] = [];
    let invalid = 0;

    for (const [key, value] of formData.entries()) {
        if (!key.startsWith('post_')) continue;
        const raw = typeof value === 'string' ? value.trim() : '';
        if (raw === '') continue;
        const postCount = parseInt(raw, 10);
        const memberId = key.slice('post_'.length);
        const validated = LifestyleLogSchema.safeParse({ memberId, blockWeekId, postCount });
        if (!validated.success || Number.isNaN(postCount)) { invalid++; continue; }
        ops.push({ memberId: validated.data.memberId, postCount: validated.data.postCount });
    }

    if (ops.length === 0) {
        return { success: false, message: invalid > 0 ? "No valid post counts to save" : "No post counts entered" };
    }

    try {
        await prisma.$transaction(
            ops.map((o) =>
                prisma.lifestyleLog.upsert({
                    where: { memberId_blockWeekId: { memberId: o.memberId, blockWeekId } },
                    update: { postCount: o.postCount },
                    create: { memberId: o.memberId, blockWeekId, postCount: o.postCount },
                }),
            ),
        );
        const suffix = invalid > 0 ? ` (${invalid} skipped)` : '';
        await writeAuditLog({
            action: "LOG_LIFESTYLE_BULK",
            details: `Bulk-saved ${ops.length} lifestyle log${ops.length === 1 ? '' : 's'} for week ${blockWeekId}${suffix}.`,
            entityType: "LifestyleLog"
        });
        revalidatePath('/lifestyle');
        revalidateTag('dashboard-stats', 'max');
        return { success: true, message: `Saved ${ops.length} lifestyle log${ops.length === 1 ? '' : 's'}${suffix}` };
    } catch (error) {
        console.error("Database error saving lifestyle logs (bulk):", error);
        return { success: false, message: "Failed to save lifestyle logs" };
    }
}

// --- BENCHMARK LOGS ---
export async function submitBenchmarkLog(prevState: unknown, formData: FormData) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    const squats = formData.get('squats') ? parseInt(formData.get('squats') as string) : undefined;
    const pushups = formData.get('pushups') ? parseInt(formData.get('pushups') as string) : undefined;
    const burpees = formData.get('burpees') ? parseInt(formData.get('burpees') as string) : undefined;

    const rawData = {
        memberId: formData.get('memberId'),
        blockWeekId: formData.get('blockWeekId'),
        date: formData.get('date'),
        squats: squats || 0,
        pushups: pushups || 0,
        burpees: burpees || 0,
    };

    const validated = BenchmarkLogSchema.safeParse(rawData);

    if (!validated.success) {
        return { success: false, message: validated.error.issues[0].message };
    }

    const dateObj = toUtcDateOnly(validated.data.date);

    try {
        const blockWeek = await prisma.blockWeek.findUnique({ where: { id: validated.data.blockWeekId } });
        
        if (!blockWeek) {
            return { success: false, message: "Invalid week" };
        }

        if (blockWeek.weekNumber !== 1 && blockWeek.weekNumber !== 8) {
            return { success: false, message: "Benchmarks can only be logged for Week 1 and Week 8." };
        }

        if (blockWeek.isFinalized) {
            return { success: false, message: "This week has been finalized. Unfinalize to edit." };
        }

        const benchmarkLog = await prisma.benchmarkLog.upsert({
            where: {
                memberId_blockWeekId: {
                    memberId: validated.data.memberId,
                    blockWeekId: validated.data.blockWeekId
                }
            },
            update: {
                squats: validated.data.squats,
                pushups: validated.data.pushups,
                burpees: validated.data.burpees,
            },
            create: {
                memberId: validated.data.memberId,
                blockWeekId: validated.data.blockWeekId,
                date: dateObj,
                squats: validated.data.squats,
                pushups: validated.data.pushups,
                burpees: validated.data.burpees,
            }
        });
        await writeAuditLog({
            action: "LOG_BENCHMARK",
            details: `Logged benchmark for member ${validated.data.memberId} (week ${validated.data.blockWeekId}): squats ${validated.data.squats}, pushups ${validated.data.pushups}, burpees ${validated.data.burpees}.`,
            entityType: "BenchmarkLog",
            entityId: benchmarkLog.id
        });
        revalidatePath('/benchmarks');
        return { success: true };
    } catch (error) {
        console.error("Error saving Benchmark Log:", error);
        return { success: false, message: "Failed to save" };
    }
}

// Bulk save for benchmark logs: one transaction for every squats_/pushups_/burpees_<memberId> row touched.
export async function submitBenchmarkLogsBulk(prevState: unknown, formData: FormData) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    const blockWeekId = formData.get('blockWeekId');
    const dateRaw = formData.get('date');
    if (typeof blockWeekId !== 'string' || !blockWeekId) {
        return { success: false, message: "Missing week ID" };
    }
    if (typeof dateRaw !== 'string' || !dateRaw) {
        return { success: false, message: "Missing benchmark date" };
    }

    const blockWeek = await prisma.blockWeek.findUnique({ where: { id: blockWeekId } });
    if (!blockWeek) {
        return { success: false, message: "Invalid week" };
    }
    if (blockWeek.weekNumber !== 1 && blockWeek.weekNumber !== 8) {
        return { success: false, message: "Benchmarks can only be logged for Week 1 and Week 8." };
    }
    if (blockWeek.isFinalized) {
        return { success: false, message: "This week has been finalized. Unfinalize to edit." };
    }

    const dateObj = toUtcDateOnly(dateRaw);

    const touched = new Map<string, { squats: string; pushups: string; burpees: string }>();
    for (const [key, value] of formData.entries()) {
        const raw = typeof value === 'string' ? value.trim() : '';
        for (const field of ['squats', 'pushups', 'burpees'] as const) {
            const prefix = `${field}_`;
            if (!key.startsWith(prefix)) continue;
            const memberId = key.slice(prefix.length);
            const entry = touched.get(memberId) ?? { squats: '', pushups: '', burpees: '' };
            entry[field] = raw;
            touched.set(memberId, entry);
        }
    }

    const ops: { memberId: string; squats: number; pushups: number; burpees: number }[] = [];
    let invalid = 0;

    for (const [memberId, fields] of touched) {
        if (fields.squats === '' && fields.pushups === '' && fields.burpees === '') continue; // untouched row

        const squats = fields.squats === '' ? 0 : parseInt(fields.squats, 10);
        const pushups = fields.pushups === '' ? 0 : parseInt(fields.pushups, 10);
        const burpees = fields.burpees === '' ? 0 : parseInt(fields.burpees, 10);

        const validated = BenchmarkLogSchema.safeParse({ memberId, blockWeekId, date: dateRaw, squats, pushups, burpees });
        if (!validated.success) { invalid++; continue; }
        ops.push(validated.data);
    }

    if (ops.length === 0) {
        return { success: false, message: invalid > 0 ? "No valid benchmark entries to save" : "No benchmarks entered" };
    }

    try {
        await prisma.$transaction(
            ops.map((o) =>
                prisma.benchmarkLog.upsert({
                    where: { memberId_blockWeekId: { memberId: o.memberId, blockWeekId } },
                    update: { squats: o.squats, pushups: o.pushups, burpees: o.burpees },
                    create: { memberId: o.memberId, blockWeekId, date: dateObj, squats: o.squats, pushups: o.pushups, burpees: o.burpees },
                }),
            ),
        );
        const suffix = invalid > 0 ? ` (${invalid} skipped)` : '';
        await writeAuditLog({
            action: "LOG_BENCHMARK_BULK",
            details: `Bulk-saved ${ops.length} benchmark log${ops.length === 1 ? '' : 's'} for week ${blockWeekId}${suffix}.`,
            entityType: "BenchmarkLog"
        });
        revalidatePath('/benchmarks');
        return { success: true, message: `Saved ${ops.length} benchmark log${ops.length === 1 ? '' : 's'}${suffix}` };
    } catch (error) {
        console.error("Database error saving benchmark logs (bulk):", error);
        return { success: false, message: "Failed to save benchmark logs" };
    }
}

// --- ATTENDANCE ---
export async function toggleAttendance(sessionId: string, memberId: string, isPresent: boolean) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    // Guard: check if the session's week is finalized
    const sessionRecord = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { block: { include: { weeks: true } } }
    });
    if (sessionRecord) {
        const sessionDate = new Date(sessionRecord.date);
        const parentWeek = sessionRecord.block.weeks.find(
            w => sessionDate >= w.startDate && sessionDate <= w.endDate
        );
        if (parentWeek?.isFinalized) {
            return { success: false, message: "This week has been finalized. Unfinalize to edit." };
        }
    }

    try {
        const attendance = await prisma.attendance.upsert({
            where: {
                sessionId_memberId: {
                    sessionId,
                    memberId
                }
            },
            update: { isPresent },
            create: {
                sessionId,
                memberId,
                isPresent
            }
        });
        await writeAuditLog({
            action: "TOGGLE_ATTENDANCE",
            details: `Marked member ${memberId} ${isPresent ? 'present' : 'absent'} for session ${sessionId}.`,
            entityType: "Attendance",
            entityId: attendance.id
        });
        revalidatePath('/attendance');
        revalidateTag('dashboard-stats', 'max');
        return { success: true, message: `Marked ${isPresent ? 'present' : 'absent'}` };
    } catch {
        return { success: false, message: 'Failed to update attendance' };
    }
}
