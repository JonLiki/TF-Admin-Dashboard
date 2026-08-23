import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

const { auth } = NextAuth(authConfig);

export async function middleware(request: NextRequest) {
  console.log('[MW] middleware() hit for:', request.nextUrl.pathname);

  // Use NextAuth's auth() as a wrapper — it calls the authorized callback
  // @ts-expect-error - auth() works as middleware in NextAuth v5
  return auth(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.(?:png|ico|svg|webmanifest)$).*)'],
};
