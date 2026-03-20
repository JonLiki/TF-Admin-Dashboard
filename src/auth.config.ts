import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const role = (auth?.user as any)?.role || 'participant';
            
            const isOnAdminDashboard = nextUrl.pathname === '/' || (!nextUrl.pathname.startsWith('/login') && !nextUrl.pathname.startsWith('/user') && !nextUrl.pathname.startsWith('/api') && !nextUrl.pathname.startsWith('/_next'));
            const isOnUserDashboard = nextUrl.pathname.startsWith('/user');
            const isOnLogin = nextUrl.pathname.startsWith('/login');

            if (isOnAdminDashboard) {
                if (isLoggedIn) {
                    if (role === 'admin') return true;
                    // Participants accessing admin routes get redirected to their dashboard
                    return Response.redirect(new URL('/user/dashboard', nextUrl));
                }
                return false; // Redirect unauthenticated users to login page
            } else if (isOnUserDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            } else if (isOnLogin) {
                if (isLoggedIn) {
                    if (role === 'admin') return Response.redirect(new URL('/', nextUrl));
                    return Response.redirect(new URL('/user/dashboard', nextUrl));
                }
                return true;
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role || 'participant';
                token.memberId = (user as any).memberId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).memberId = token.memberId;
            }
            return session;
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
