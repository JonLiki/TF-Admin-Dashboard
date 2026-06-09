'use server';

import prisma from '@/lib/prisma';

import { revalidatePath, revalidateTag } from 'next/cache';
import { WeighInSchema, KmLogSchema, LifestyleLogSchema, BenchmarkLogSchema } from '@/lib/schemas';
import { requireAdmin } from '@/lib/auth-guard';

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

    // Parse date correctly and normalize to start of day to avoid timezone/time mismatches
    const dateObj = new Date(validated.data.date);
    dateObj.setHours(0, 0, 0, 0);

    try {
        await prisma.weighIn.upsert({
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
        revalidatePath('/weigh-in');
        revalidateTag('dashboard-stats', 'max');
        return { success: true, message: "Weigh-in saved" };
    } catch (error) {
        console.error("Database error saving weigh-in:", error);
        return { success: false, message: "Failed to save weigh-in" };
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

        await prisma.kmLog.upsert({
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
        revalidatePath('/km');
        revalidateTag('dashboard-stats', 'max');
        return { success: true };
    } catch (error) {
        console.error("Error saving KM Log:", error);
        return { success: false, message: "Failed to save" };
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

        await prisma.lifestyleLog.upsert({
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
        revalidatePath('/lifestyle');
        revalidateTag('dashboard-stats', 'max');
        return { success: true };
    } catch (error) {
        console.error("Error saving Lifestyle Log:", error);
        return { success: false, message: "Failed to save" };
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

    const dateObj = new Date(validated.data.date);

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

        await prisma.benchmarkLog.upsert({
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
        revalidatePath('/benchmarks');
        return { success: true };
    } catch (error) {
        console.error("Error saving Benchmark Log:", error);
        return { success: false, message: "Failed to save" };
    }
}

// --- ATTENDANCE ---
export async function toggleAttendance(sessionId: string, memberId: string, isPresent: boolean) {
    const guard = await requireAdmin();
    if (!guard.success) throw new Error(guard.message);

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
            throw new Error("This week has been finalized. Unfinalize to edit.");
        }
    }

    await prisma.attendance.upsert({
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
    revalidatePath('/attendance');
    revalidateTag('dashboard-stats', 'max');
}
