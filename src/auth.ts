import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { isLockedOut, recordFailedAttempt, clearAttempts } from '@/lib/login-throttle';

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const throttleKey = email.toLowerCase();

                    if (isLockedOut(throttleKey)) {
                        console.warn(`Login locked out after repeated failures: ${throttleKey}`);
                        return null;
                    }

                    const user = await getUser(email);
                    if (user?.password) {
                        const passwordsMatch = await bcrypt.compare(password, user.password);
                        if (passwordsMatch) {
                            clearAttempts(throttleKey);
                            return user;
                        }
                    }

                    recordFailedAttempt(throttleKey);
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
});
