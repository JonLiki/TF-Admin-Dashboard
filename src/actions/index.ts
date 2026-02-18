'use server';

import prisma from '@/lib/prisma';

import { revalidatePath } from 'next/cache';
import { CreateTeamSchema, CreateMemberSchema } from '@/lib/schemas';
import { auth } from '@/auth';

// --- TEAMS ---
export async function getTeams() {
    return await prisma.team.findMany({
        include: {
            _count: {
                select: { members: true }
            }
        },
        orderBy: { name: 'asc' }
    });
}

export async function createTeam(formData: FormData) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const rawData = {
        name: formData.get('name'),
    };

    const validated = CreateTeamSchema.parse(rawData);

    await prisma.team.create({
        data: { name: validated.name }
    });
    revalidatePath('/teams');
}

export async function deleteTeam(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    // 1. Clean up dependencies
    // PointLedger
    await prisma.pointLedger.deleteMany({ where: { teamId: id } });

    // TeamWeekAward
    await prisma.teamWeekAward.deleteMany({ where: { teamId: id } });

    // TeamWeekMetric
    await prisma.teamWeekMetric.deleteMany({ where: { teamId: id } });

    // 2. Unassign members
    await prisma.member.updateMany({
        where: { teamId: id },
        data: { teamId: null }
    });

    // 3. Delete Team
    await prisma.team.delete({ where: { id } });
    revalidatePath('/teams');
}

// --- MEMBERS ---
export async function getMembers() {
    return await prisma.member.findMany({
        include: { team: true },
        orderBy: { lastName: 'asc' }
    });
}

export async function createMember(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    try {
        const rawData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            teamId: formData.get('teamId'),
        };

        const validated = CreateMemberSchema.parse(rawData);

        await prisma.member.create({
            data: {
                firstName: validated.firstName,
                lastName: validated.lastName,
                teamId: validated.teamId || null,
                isActive: true
            }
        });
        revalidatePath('/members');
        return { success: true, message: 'Member created successfully' };
    } catch (error) {
        return { success: false, message: 'Failed to create member' };
    }
}

export async function updateMemberTeam(memberId: string, teamId: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    await prisma.member.update({
        where: { id: memberId },
        data: { teamId }
    });
    revalidatePath('/members');
}

export async function toggleMemberActive(memberId: string, currentState: boolean) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    try {
        await prisma.member.update({
            where: { id: memberId },
            data: { isActive: !currentState }
        });
        revalidatePath('/members');
        return { success: true, message: `Member ${!currentState ? 'activated' : 'deactivated'} successfully` };
    } catch (error) {
        return { success: false, message: 'Failed to update member status' };
    }
}

export async function deleteMember(id: string) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    try {
        // 1. Clean up dependencies
        await prisma.kmLog.deleteMany({ where: { memberId: id } });
        await prisma.lifestyleLog.deleteMany({ where: { memberId: id } });
        await prisma.attendance.deleteMany({ where: { memberId: id } });
        await prisma.weighIn.deleteMany({ where: { memberId: id } });

        // 2. Delete Member
        await prisma.member.delete({ where: { id } });
        revalidatePath('/members');
        return { success: true, message: 'Member deleted successfully' };
    } catch (error) {
        return { success: false, message: 'Failed to delete member' };
    }
}
