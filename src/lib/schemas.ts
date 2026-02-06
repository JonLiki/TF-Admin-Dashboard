import { z } from 'zod';

// --- Shared Schemas ---
export const UuidSchema = z.string().uuid();

// --- Team Schemas ---
export const CreateTeamSchema = z.object({
    name: z.string().min(2, "Team name must be at least 2 characters").max(50, "Team name is too long"),
});

// --- Member Schemas ---
export const CreateMemberSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    teamId: z.string().uuid().optional().or(z.literal("")),
});

// --- Metric Schemas ---
export const WeighInSchema = z.object({
    memberId: z.string().uuid(),
    weight: z.number().min(30, "Weight seems too low").max(300, "Weight seems too high"),
    date: z.string().datetime().or(z.date()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")),
});

export const KmLogSchema = z.object({
    memberId: z.string().uuid(),
    blockWeekId: z.string().uuid(),
    totalKm: z.number().min(0, "Distance cannot be negative").max(200, "Distance seems excessive for one week"),
});

export const LifestyleLogSchema = z.object({
    memberId: z.string().uuid(),
    blockWeekId: z.string().uuid(),
    postCount: z.number().int().min(0).max(7, "Cannot exceed 7 posts per week"),
});
