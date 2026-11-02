import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Edge-safe config only (no Prisma) — the `authorized` callback in auth.config
// does the route gating. Server actions and the (dashboard) layout re-check.
const { auth } = NextAuth(authConfig);
export default auth;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\.(?:png|ico|svg|webmanifest)$).*)'],
};
