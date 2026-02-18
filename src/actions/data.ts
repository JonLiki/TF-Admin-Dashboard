'use server';

import prisma from '@/lib/prisma';

import { revalidatePath } from 'next/cache';
import { WeighInSchema, KmLogSchema, LifestyleLogSchema } from '@/lib/schemas';
import { auth } from '@/auth';

// --- HELPERS ---
export async function getActiveBlock() {
    return await prisma.block.findFirst({
        where: { isActive: true },
        include: {
            weeks: { orderBy: { weekNumber: 'asc' } },
            sessions: { orderBy: { date: 'asc' } }
        }
    });
}

// --- WEIGH-INS ---
export async function getWeighIns(date: Date) {
    // Normalize to start of day UTC or just use the date string match if careful
    // Using a range for the specific date is safer
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.weighIn.findMany({
        where: {
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: { member: true }
    });
}

export async function submitWeighIn(formData: FormData) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

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

    // Parse date correctly as it might be string from form
    // validated.data.date is Date or string from schema, but we need Date object
    const dateObj = new Date(validated.data.date);

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
        return { success: true, message: "Weigh-in saved" };
    } catch (error) {
        console.error("Database error saving weigh-in:", error);
        return { success: false, message: "Failed to save weigh-in" };
    }
}

// --- KM LOGS ---
export async function submitKmLog(formData: FormData) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

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
        return { success: true };
    } catch (error) {
        console.error("Error saving KM Log:", error);
        return { success: false, message: "Failed to save" };
    }
}

// --- LIFESTYLE LOGS ---
export async function submitLifestyleLog(formData: FormData) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

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
        return { success: true };
    } catch (error) {
        console.error("Error saving Lifestyle Log:", error);
        return { success: false, message: "Failed to save" };
    }
}

// --- ATTENDANCE ---
export async function getSession(sessionId: string) {
    return await prisma.session.findUnique({
        where: { id: sessionId },
        include: { attendance: true }
    });
}

export async function toggleAttendance(sessionId: string, memberId: string, isPresent: boolean) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

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
}

// --- FETCHERS FOR TABLES ---
// Get all members with their data for a specific week/context
export async function getMembersWithLogs(blockWeekId: string) {
    return await prisma.member.findMany({
        where: { isActive: true },
        include: {
            team: true,
            kmLogs: { where: { blockWeekId } },
            lifestyleLogs: { where: { blockWeekId } }
        },
        orderBy: { lastName: 'asc' }
    });
}

export async function getMembersWithWeighIn(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.member.findMany({
        where: { isActive: true },
        include: {
            team: true,
            weighIns: {
                where: {
                    date: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }
        },
        orderBy: { lastName: 'asc' }
    });
}

// --- SUMMARY REPORT ---
export async function getFullBlockSummary(blockWeekId?: string) {
    const block = await prisma.block.findFirst({
        where: { isActive: true },
        include: {
            weeks: { orderBy: { weekNumber: 'asc' } },
        }
    });

    if (!block) return null;

    const members = await prisma.member.findMany({
        where: { isActive: true },
        include: {
            team: true,
            weighIns: {
                where: {
                    date: {
                        gte: block.startDate,
                        lte: block.endDate
                    }
                },
                orderBy: { date: 'asc' }
            },
            kmLogs: true,
            lifestyleLogs: true,
            attendance: {
                where: {
                    session: {
                        blockId: block.id
                    }
                }
            }
        },
        orderBy: { lastName: 'asc' }
    });

    // Also fetch all sessions for the block to calculate attendance totals/percentages if needed
    const sessions = await prisma.session.findMany({
        where: { blockId: block.id },
        orderBy: { date: 'asc' }
    });

    return { block, members, sessions };
}
