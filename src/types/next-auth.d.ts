/* eslint-disable @typescript-eslint/no-unused-vars */
import type NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      memberId?: string | null;
    }
  }

  interface User {
    role?: string;
    memberId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    memberId?: string | null;
  }
}
