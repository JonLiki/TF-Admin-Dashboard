/**
 * Application-wide constants
 *
 * UserRole values match the Prisma `UserRole` enum defined in schema.prisma.
 * Use these constants instead of string literals when checking roles outside
 * of Prisma-typed contexts (e.g., middleware, auth callbacks).
 */
export const UserRole = {
  ADMIN: 'ADMIN',
  PARTICIPANT: 'PARTICIPANT',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];
