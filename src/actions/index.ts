'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CreateTeamSchema, CreateMemberSchema, UpdateMemberSchema } from '@/lib/schemas';
import { requireAdmin } from '@/lib/auth-guard';
import { writeAuditLog } from '@/lib/audit';

// --- TEAMS ---

export async function createTeam(formData: FormData) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    const rawData = {
        name: formData.get('name'),
    };

    const validated = CreateTeamSchema.safeParse(rawData);
    if (!validated.success) {
        return { success: false, message: validated.error.issues[0].message };
    }

    try {
        const team = await prisma.team.create({
            data: { name: validated.data.name }
        });
        await writeAuditLog({
            action: "CREATE_TEAM",
            details: `Created team "${team.name}".`,
            entityType: "Team",
            entityId: team.id
        });
        revalidatePath('/teams');
        return { success: true, message: 'Team created successfully' };
    } catch {
        return { success: false, message: 'Failed to create team' };
    }
}
    
export async function updateTeam(id: string, formData: FormData) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    const rawData = {
        name: formData.get('name'),
    };

    const validated = CreateTeamSchema.safeParse(rawData);
    if (!validated.success) {
        return { success: false, message: validated.error.issues[0].message };
    }

    try {
        const team = await prisma.team.update({
            where: { id },
            data: { name: validated.data.name }
        });
        await writeAuditLog({
            action: "UPDATE_TEAM",
            details: `Updated team to "${team.name}" (ID: ${id}).`,
            entityType: "Team",
            entityId: id
        });
        revalidatePath('/teams');
        return { success: true, message: 'Team updated successfully' };
    } catch {
        return { success: false, message: 'Failed to update team' };
    }
}

export async function deleteTeam(id: string) {
    const guard = await requireAdmin();
    if (!guard.success) throw new Error(guard.message);

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) throw new Error("Team not found");

    await prisma.$transaction(async (tx) => {
        // 1. Clean up dependencies
        // PointLedger
        await tx.pointLedger.deleteMany({ where: { teamId: id } });

        // TeamWeekAward
        await tx.teamWeekAward.deleteMany({ where: { teamId: id } });

        // TeamWeekMetric
        await tx.teamWeekMetric.deleteMany({ where: { teamId: id } });

        // 2. Unassign members
        await tx.member.updateMany({
            where: { teamId: id },
            data: { teamId: null }
        });

        // 3. Delete Team
        await tx.team.delete({ where: { id } });
    });

    await writeAuditLog({
        action: "DELETE_TEAM",
        details: `Deleted team "${team.name}" (ID: ${id}).`,
        entityType: "Team",
        entityId: id
    });

    revalidatePath('/teams');
}

// --- MEMBERS ---

export async function createMember(formData: FormData) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    try {
        const rawData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            teamId: formData.get('teamId'),
        };

        const validated = CreateMemberSchema.parse(rawData);

        const member = await prisma.member.create({
            data: {
                firstName: validated.firstName,
                lastName: validated.lastName,
                teamId: validated.teamId || null,
                isActive: true
            }
        });
        await writeAuditLog({
            action: "CREATE_MEMBER",
            details: `Created member "${member.firstName} ${member.lastName}".`,
            entityType: "Member",
            entityId: member.id
        });
        revalidatePath('/members');
        return { success: true, message: 'Member created successfully' };
    } catch {
        return { success: false, message: 'Failed to create member' };
    }
}

export async function updateMember(memberId: string, formData: FormData) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    try {
        const rawData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            teamId: formData.get('teamId'),
        };

        const validated = UpdateMemberSchema.parse(rawData);

        const member = await prisma.member.update({
            where: { id: memberId },
            data: {
                firstName: validated.firstName,
                lastName: validated.lastName,
                teamId: validated.teamId || null,
            }
        });
        await writeAuditLog({
            action: "UPDATE_MEMBER",
            details: `Updated member "${member.firstName} ${member.lastName}".`,
            entityType: "Member",
            entityId: memberId
        });
        revalidatePath('/members');
        return { success: true, message: 'Member updated successfully' };
    } catch {
        return { success: false, message: 'Failed to update member' };
    }
}

export async function toggleMemberActive(memberId: string, currentState: boolean) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    try {
        const member = await prisma.member.update({
            where: { id: memberId },
            data: { isActive: !currentState }
        });
        await writeAuditLog({
            action: "TOGGLE_MEMBER_ACTIVE",
            details: `Set member "${member.firstName} ${member.lastName}" active state to ${!currentState}.`,
            entityType: "Member",
            entityId: memberId
        });
        revalidatePath('/members');
        return { success: true, message: `Member ${!currentState ? 'activated' : 'deactivated'} successfully` };
    } catch {
        return { success: false, message: 'Failed to update member status' };
    }
}

export async function deleteMember(id: string) {
    const guard = await requireAdmin();
    if (!guard.success) return { success: false, message: guard.message };

    try {
        const member = await prisma.member.findUnique({ where: { id } });
        if (!member) return { success: false, message: 'Member not found.' };

        await prisma.$transaction(async (tx) => {
            // 1. Clean up dependencies
            await tx.benchmarkLog.deleteMany({ where: { memberId: id } });
            await tx.kmLog.deleteMany({ where: { memberId: id } });
            await tx.lifestyleLog.deleteMany({ where: { memberId: id } });
            await tx.attendance.deleteMany({ where: { memberId: id } });
            await tx.weighIn.deleteMany({ where: { memberId: id } });

            // 2. Delete Member
            await tx.member.delete({ where: { id } });
        });

        await writeAuditLog({
            action: "DELETE_MEMBER",
            details: `Deleted member "${member.firstName} ${member.lastName}" (ID: ${id}).`,
            entityType: "Member",
            entityId: id
        });

        revalidatePath('/members');
        return { success: true, message: 'Member deleted successfully' };
    } catch {
        return { success: false, message: 'Failed to delete member' };
    }
}
