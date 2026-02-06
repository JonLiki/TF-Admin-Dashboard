'use server';

import prisma from '@/lib/prisma';

import { revalidatePath } from 'next/cache';
import { WeighInSchema, KmLogSchema, LifestyleLogSchema } from '@/lib/schemas';

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
    const rawData = {
        memberId: formData.get('memberId'),
        weight: parseFloat(formData.get('weight') as string),
        date: formData.get('date'),
    };

    const validated = WeighInSchema.parse(rawData);
    // Parse date correctly as it might be string from form
    const dateObj = new Date(validated.date);

    await prisma.weighIn.upsert({
        where: {
            memberId_date: {
                memberId: validated.memberId,
                date: dateObj
            }
        },
        update: { weight: validated.weight },
        create: {
            memberId: validated.memberId,
            date: dateObj,
            weight: validated.weight
        }
    });

    revalidatePath('/weigh-in');
}

// --- KM LOGS ---
// --- KM LOGS ---
export async function submitKmLog(formData: FormData) {
    const rawData = {
        memberId: formData.get('memberId'),
        blockWeekId: formData.get('blockWeekId'),
        totalKm: parseFloat(formData.get('totalKm') as string),
    };

    const validated = KmLogSchema.parse(rawData);

    await prisma.kmLog.upsert({
        where: {
            memberId_blockWeekId: {
                memberId: validated.memberId,
                blockWeekId: validated.blockWeekId
            }
        },
        update: { totalKm: validated.totalKm },
        create: {
            memberId: validated.memberId,
            blockWeekId: validated.blockWeekId,
            totalKm: validated.totalKm
        }
    });
    revalidatePath('/km');
}

// --- LIFESTYLE LOGS ---
// --- LIFESTYLE LOGS ---
export async function submitLifestyleLog(formData: FormData) {
    const rawData = {
        memberId: formData.get('memberId'),
        blockWeekId: formData.get('blockWeekId'),
        postCount: parseInt(formData.get('postCount') as string),
    };

    const validated = LifestyleLogSchema.parse(rawData);

    await prisma.lifestyleLog.upsert({
        where: {
            memberId_blockWeekId: {
                memberId: validated.memberId,
                blockWeekId: validated.blockWeekId
            }
        },
        update: { postCount: validated.postCount },
        create: {
            memberId: validated.memberId,
            blockWeekId: validated.blockWeekId,
            postCount: validated.postCount
        }
    });
    revalidatePath('/lifestyle');
}

// --- ATTENDANCE ---
export async function getSession(sessionId: string) {
    return await prisma.session.findUnique({
        where: { id: sessionId },
        include: { attendance: true }
    });
}

export async function toggleAttendance(sessionId: string, memberId: string, isPresent: boolean) {
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
