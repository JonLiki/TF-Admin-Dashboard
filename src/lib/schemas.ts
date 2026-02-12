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
    weight: z.number().min(0, "Weight cannot be negative").max(300, "Weight seems too high"),
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

// --- CSV Import Schemas ---
export const ImportAttendanceRowSchema = z.string().transform(val => val.trim().toLowerCase()).pipe(
    z.enum(['present', 'absent', '-', '']).transform(val => {
        if (val === 'present') return true;
        if (val === 'absent') return false;
        return null; // Ignore '-' or empty
    })
);

export const ImportKmRowSchema = z.string().transform(val => parseFloat(val)).pipe(
    z.number().nonnegative("KM must be positive").finite()
);


export const ImportLifestyleRowSchema = z.string().trim().regex(/^\d+$/, "Must be a whole number").transform(val => parseInt(val, 10)).pipe(
    z.number().int().min(0).max(7, "Posts must be between 0 and 7")
);

export const ImportWeighInRowSchema = z.string().transform(val => parseFloat(val)).pipe(
    z.number().min(0, "Weight cannot be negative").max(300, "Weight seems too high")
);
