import { auth } from '@/auth';
import { UserRole } from '@/lib/constants';
import type { Session } from 'next-auth';

/**
 * Discriminated-union result so server actions can guard without throwing:
 *
 *   const guard = await requireAdmin();
 *   if (!guard.success) return guard; // { success: false, message }
 */
export type GuardResult =
    | { success: true; session: Session }
    | { success: false; message: string };

export async function requireUser(): Promise<GuardResult> {
    const session = await auth();
    if (!session?.user) {
        return { success: false, message: 'Unauthorized. Please log in again.' };
    }
    return { success: true, session };
}

export async function requireAdmin(): Promise<GuardResult> {
    const result = await requireUser();
    if (!result.success) return result;

    if (result.session.user.role !== UserRole.ADMIN) {
        return { success: false, message: 'Unauthorized. Admin access required.' };
    }
    return result;
}
