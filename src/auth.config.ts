import type { NextAuthConfig } from 'next-auth';
import { UserRole } from '@/lib/constants';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const role = auth?.user?.role || UserRole.PARTICIPANT;
            
            const isOnAdminDashboard = nextUrl.pathname === '/' || (!nextUrl.pathname.startsWith('/login') && !nextUrl.pathname.startsWith('/user') && !nextUrl.pathname.startsWith('/api') && !nextUrl.pathname.startsWith('/_next'));
            const isOnUserDashboard = nextUrl.pathname.startsWith('/user');
            const isOnLogin = nextUrl.pathname.startsWith('/login');

            if (isOnAdminDashboard) {
                if (isLoggedIn) {
                    if (role === UserRole.ADMIN) return true;
                    // Participants accessing admin routes get redirected to their dashboard
                    return Response.redirect(new URL('/user/dashboard', nextUrl));
                }
                return false; // Redirect unauthenticated users to login page
            } else if (isOnUserDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            } else if (isOnLogin) {
                if (isLoggedIn) {
                    if (role === UserRole.ADMIN) return Response.redirect(new URL('/', nextUrl));
                    return Response.redirect(new URL('/user/dashboard', nextUrl));
                }
                return true;
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role || UserRole.PARTICIPANT;
                token.memberId = user.memberId;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
                session.user.memberId = token.memberId;
                if (token.id) {
                    session.user.id = token.id;
                }
            }
            return session;
        }
    },
    providers: [], // Configured in auth.ts
    secret: (() => {
        if (!process.env.AUTH_SECRET) {
            throw new Error('AUTH_SECRET environment variable is required. Generate one with: npx auth secret');
        }
        return process.env.AUTH_SECRET;
    })(),
    trustHost: true,
    session: { strategy: 'jwt' },
    cookies: {
        sessionToken: {
            name: `tfdashboard.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === "production"
            }
        }
    }
} satisfies NextAuthConfig;
