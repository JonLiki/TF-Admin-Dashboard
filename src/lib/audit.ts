import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function writeAuditLog({
    action,
    details,
    entityType,
    entityId
}: {
    action: string;
    details?: string;
    entityType?: string;
    entityId?: string;
}) {
    try {
        const session = await auth();
        const userId = session?.user?.id || null;

        await prisma.auditLog.create({
            data: {
                userId,
                action,
                details,
                entityType,
                entityId
            }
        });
    } catch (err) {
        console.error("Failed to write audit log:", err);
    }
}
