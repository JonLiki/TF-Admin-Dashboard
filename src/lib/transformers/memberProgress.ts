/**
 * Derives a member's personal progress from their weigh-ins and attendance.
 * Pure + deterministic so it can be unit-tested and reused on server or client.
 * No goal/target is computed — the schema has no goal field (see audit item #4).
 */

export interface WeighInLike {
    date: Date | string;
    weight: number;
}

export interface AttendanceLike {
    isPresent: boolean;
}

export interface MemberProgress {
    weighInCount: number;
    startWeight: number | null;
    latestWeight: number | null;
    /** Positive = weight lost since the first weigh-in. */
    kgLost: number | null;
    /** Signed percent change from start (negative = loss). */
    pctChange: number | null;
    /** Chronological points for the trend chart. */
    trend: { date: string; weight: number }[];
    sessionsAttended: number;
    /** Trailing run of consecutive weekly weigh-ins (gaps ≤ 10 days). */
    streak: number;
}

const DAY_MS = 86_400_000;

export function getMemberProgress(
    weighIns: WeighInLike[],
    attendance: AttendanceLike[],
): MemberProgress {
    const sorted = [...weighIns].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const weighInCount = sorted.length;
    const startWeight = weighInCount ? sorted[0].weight : null;
    const latestWeight = weighInCount ? sorted[weighInCount - 1].weight : null;

    const kgLost =
        startWeight !== null && latestWeight !== null
            ? Math.round((startWeight - latestWeight) * 10) / 10
            : null;

    const pctChange =
        startWeight && latestWeight
            ? Math.round(((latestWeight - startWeight) / startWeight) * 1000) / 10
            : null;

    const trend = sorted.map((w) => ({
        date: new Date(w.date).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' }),
        weight: w.weight,
    }));

    const sessionsAttended = attendance.filter((a) => a.isPresent).length;

    let streak = weighInCount > 0 ? 1 : 0;
    for (let i = weighInCount - 1; i > 0; i--) {
        const gapDays =
            (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / DAY_MS;
        if (gapDays <= 10) streak += 1;
        else break;
    }

    return {
        weighInCount,
        startWeight,
        latestWeight,
        kgLost,
        pctChange,
        trend,
        sessionsAttended,
        streak,
    };
}
