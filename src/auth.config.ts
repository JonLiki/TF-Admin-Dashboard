import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/');
            const isOnLogin = nextUrl.pathname.startsWith('/login');

            if (isOnDashboard) {
                if (isOnLogin) return true; // Always allow access to login page
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/', nextUrl));
            }
            return true;
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
