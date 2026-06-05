'use server';

import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CreateBlockSchema } from '@/lib/schemas';
import { auth } from '@/auth';
import { addWeeks, addDays, startOfWeek } from 'date-fns';
import { calculateWeekResults } from '@/actions/scoring';
import { writeAuditLog } from '@/lib/audit';

// --- BLOCKS ---


export async function createBlock(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    try {
        const rawData = {
            name: formData.get('name') as string,
            startDate: formData.get('startDate') as string,
            numberOfWeeks: parseInt(formData.get('numberOfWeeks') as string, 10),
        };

        const validated = CreateBlockSchema.parse(rawData);

        // Calculate end date from start + weeks
        const start = startOfWeek(new Date(validated.startDate + 'T00:00:00'), { weekStartsOn: 1 }); // Monday
        const end = addWeeks(start, validated.numberOfWeeks);

        const block = await prisma.$transaction(async (tx) => {
            // 1. Create the Block
            const newBlock = await tx.block.create({
                data: {
                    name: validated.name,
                    startDate: start,
                    endDate: addDays(end, -1), // End on last Sunday
                    isActive: false,
                }
            });

            // 2. Create BlockWeek rows
            for (let i = 0; i < validated.numberOfWeeks; i++) {
                const weekStart = addWeeks(start, i);
                const weekEnd = addDays(addWeeks(start, i + 1), -1);

                await tx.blockWeek.create({
                    data: {
                        blockId: newBlock.id,
                        weekNumber: i + 1,
                        startDate: weekStart,
                        endDate: weekEnd,
                    }
                });
            }

            // 3. Create Session rows (Mon/Wed/Fri per week)
            const sessionDays = [0, 2, 4]; // Monday=0, Wednesday=2, Friday=4 offset from week start (Monday)
            const sessionTypes = ['Monday', 'Wednesday', 'Friday'];

            for (let i = 0; i < validated.numberOfWeeks; i++) {
                const weekStart = addWeeks(start, i);

                for (let j = 0; j < sessionDays.length; j++) {
                    const sessionDate = addDays(weekStart, sessionDays[j]);

                    await tx.session.create({
                        data: {
                            blockId: newBlock.id,
                            date: sessionDate,
                            type: sessionTypes[j],
                        }
                    });
                }
            }

            return newBlock;
        });

        await writeAuditLog({
            action: "CREATE_BLOCK",
            details: `Created block "${block.name}" with ${validated.numberOfWeeks} weeks.`,
            entityType: "Block",
            entityId: block.id
        });

        revalidatePath('/blocks');
        revalidatePath('/');
        return { success: true, message: `Block "${block.name}" created with ${validated.numberOfWeeks} weeks.` };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to create block';
        return { success: false, message: msg };
    }
}

export async function activateBlock(blockId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    try {
        const block = await prisma.block.findUnique({ where: { id: blockId } });
        if (!block) return { success: false, message: 'Block not found.' };

        await prisma.$transaction(async (tx) => {
            // Deactivate all blocks
            await tx.block.updateMany({
                data: { isActive: false }
            });

            // Activate the selected block
            await tx.block.update({
                where: { id: blockId },
                data: { isActive: true }
            });
        });

        await writeAuditLog({
            action: "ACTIVATE_BLOCK",
            details: `Activated block "${block.name}".`,
            entityType: "Block",
            entityId: blockId
        });

        revalidatePath('/blocks');
        revalidatePath('/');
        return { success: true, message: 'Block activated successfully.' };
    } catch {
        return { success: false, message: 'Failed to activate block.' };
    }
}

export async function deactivateBlock(blockId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    try {
        const block = await prisma.block.findUnique({ where: { id: blockId } });
        if (!block) return { success: false, message: 'Block not found.' };

        await prisma.block.update({
            where: { id: blockId },
            data: { isActive: false }
        });

        await writeAuditLog({
            action: "DEACTIVATE_BLOCK",
            details: `Deactivated block "${block.name}".`,
            entityType: "Block",
            entityId: blockId
        });

        revalidatePath('/blocks');
        revalidatePath('/');
        return { success: true, message: 'Block deactivated.' };
    } catch {
        return { success: false, message: 'Failed to deactivate block.' };
    }
}

export async function deleteBlock(blockId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    try {
        // Prevent deleting the active block
        const block = await prisma.block.findUnique({ where: { id: blockId } });
        if (!block) return { success: false, message: 'Block not found.' };
        if (block.isActive) return { success: false, message: 'Cannot delete the active block. Deactivate it first.' };

        await prisma.$transaction(async (tx) => {
            // Get all week IDs and session IDs for this block
            const weeks = await tx.blockWeek.findMany({ where: { blockId }, select: { id: true } });
            const weekIds = weeks.map(w => w.id);
            const sessions = await tx.session.findMany({ where: { blockId }, select: { id: true } });
            const sessionIds = sessions.map(s => s.id);

            // Delete dependent data in order
            await tx.teamWeekAward.deleteMany({ where: { blockWeekId: { in: weekIds } } });
            await tx.teamWeekMetric.deleteMany({ where: { blockWeekId: { in: weekIds } } });
            await tx.benchmarkLog.deleteMany({ where: { blockWeekId: { in: weekIds } } });
            await tx.lifestyleLog.deleteMany({ where: { blockWeekId: { in: weekIds } } });
            await tx.kmLog.deleteMany({ where: { blockWeekId: { in: weekIds } } });
            await tx.attendance.deleteMany({ where: { sessionId: { in: sessionIds } } });
            await tx.pointLedger.deleteMany({ where: { blockId } });

            // Delete sessions, weeks, and block
            await tx.session.deleteMany({ where: { blockId } });
            await tx.blockWeek.deleteMany({ where: { blockId } });
            await tx.block.delete({ where: { id: blockId } });
        });

        await writeAuditLog({
            action: "DELETE_BLOCK",
            details: `Deleted block "${block.name}" (ID: ${blockId}).`,
            entityType: "Block",
            entityId: blockId
        });

        revalidatePath('/blocks');
        revalidatePath('/');
        return { success: true, message: `Block "${block.name}" deleted.` };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to delete block';
        return { success: false, message: msg };
    }
}

// --- FINALIZE WEEK ---

export async function finalizeWeek(blockWeekId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    try {
        const week = await prisma.blockWeek.findUnique({ where: { id: blockWeekId } });
        if (!week) return { success: false, message: 'Week not found.' };
        if (week.isFinalized) return { success: false, message: 'Week is already finalized.' };

        // 1. Calculate and persist all week results (metrics, awards, points)
        await calculateWeekResults(blockWeekId);

        // 2. Lock the week
        await prisma.blockWeek.update({
            where: { id: blockWeekId },
            data: { isFinalized: true }
        });

        await writeAuditLog({
            action: "FINALIZE_WEEK",
            details: `Finalized week ${week.weekNumber} of block ID ${week.blockId}.`,
            entityType: "BlockWeek",
            entityId: blockWeekId
        });

        revalidatePath('/scoreboard');
        revalidatePath('/');
        revalidateTag('dashboard-stats', 'max');
        return { success: true, message: `Week ${week.weekNumber} finalized and locked.` };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to finalize week';
        return { success: false, message: msg };
    }
}

export async function unfinalizeWeek(blockWeekId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    try {
        const week = await prisma.blockWeek.findUnique({ where: { id: blockWeekId } });
        if (!week) return { success: false, message: 'Week not found.' };
        if (!week.isFinalized) return { success: false, message: 'Week is not finalized.' };

        await prisma.blockWeek.update({
            where: { id: blockWeekId },
            data: { isFinalized: false }
        });

        await writeAuditLog({
            action: "UNFINALIZE_WEEK",
            details: `Unlocked week ${week.weekNumber} of block ID ${week.blockId} for editing.`,
            entityType: "BlockWeek",
            entityId: blockWeekId
        });

        revalidatePath('/scoreboard');
        revalidatePath('/');
        revalidateTag('dashboard-stats', 'max');
        return { success: true, message: `Week ${week.weekNumber} unlocked for editing.` };
    } catch {
        return { success: false, message: 'Failed to unfinalize week.' };
    }
}
