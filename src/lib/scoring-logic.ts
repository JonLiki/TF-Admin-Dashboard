
export interface ScorableMember {
    id: string;
    kmLogs: { totalKm: number }[];
    lifestyleLogs: { postCount: number }[];
    attendance: { id: string }[]; // Just need count usually, but let's be flexible
    // For weight, we need the raw weigh-ins to match dates
    weighIns: { date: Date | string; weight: number }[];
}

export interface ScorableTeam {
    id: string;
    name: string;
    members: ScorableMember[];
}

export interface TeamResult {
    teamId: string;
    teamName: string;
    memberCount: number;
    kmAvg: number;
    lifestyleAvg: number;
    attendanceAvg: number;
    weightLossTotal: number;
    eligible: boolean; // >= 4 members
}

export interface BlockWeekConfig {
    startDate: Date | string;
    endDate: Date | string;
}

/**
 * Pure function to calculate metrics for a list of teams
 */
export function calculateTeamMetrics(teams: ScorableTeam[], config: BlockWeekConfig): TeamResult[] {
    return teams.map(team => {
        const memberCount = team.members.length;
        const eligible = memberCount >= 4;

        let totalKm = 0;
        let totalLifestyle = 0;
        let totalAttendance = 0;
        let teamWeightLoss = 0;

        // Date helpers
        const toDateKey = (d: Date | string) => {
            const dateObj = typeof d === 'string' ? new Date(d) : d;
            return dateObj.toISOString().split('T')[0];
        };
        const startDateKey = toDateKey(config.startDate);
        const endDateKey = toDateKey(config.endDate); // This might need adjustment if logic uses inclusive strings

        for (const member of team.members) {
            // KM
            const kmEntry = member.kmLogs[0];
            if (kmEntry) totalKm += kmEntry.totalKm;

            // Lifestyle
            const lifeEntry = member.lifestyleLogs[0];
            if (lifeEntry) totalLifestyle += lifeEntry.postCount;

            // Attendance
            totalAttendance += member.attendance.length;

            // Weight Loss
            // New Logic: 
            // 1. Find the "End Weight" (Last weigh-in strictly WITHIN the week)
            // 2. Find the "Start Weight" (Last weigh-in strictly BEFORE the week, OR first weigh-in WITHIN the week if no prior exists)

            // Filter weigh-ins strictly strictly within the configured week for the "End Weight"
            const weekWeighIns = member.weighIns.filter(w => {
                const d = toDateKey(w.date);
                return d >= startDateKey && d <= endDateKey; // Inclusive of end date to capture next-week start as boundary
                // Ideally use date objects comparisons if possible, but let's stick to the keys for consistency or original logic
                // Use raw date object comparison for safety vs helper string
                const dateObj = new Date(w.date);
                const start = new Date(config.startDate);
                const end = new Date(config.endDate);
                // Inclusive of end date
                return dateObj >= start && dateObj <= end;
            }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // If no weigh-in IN this week, they can't contribute to "This Week's Loss"
            if (weekWeighIns.length > 0) {
                const lastInWeek = weekWeighIns[weekWeighIns.length - 1];
                const firstInWeek = weekWeighIns[0];

                // Find baseline: Last weigh-in BEFORE this week
                const priorWeighIns = member.weighIns.filter(w => new Date(w.date) < new Date(config.startDate))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                let baselineWeight = firstInWeek.weight; // Default to first in week
                if (priorWeighIns.length > 0) {
                    baselineWeight = priorWeighIns[priorWeighIns.length - 1].weight;
                }

                // If using firstInWeek as baseline, and it's the SAME record as lastInWeek, loss is 0.
                // This handles the "Week 1 Single Record" case correctly (0 loss).
                // If there is a prior record, we get valid loss.

                const diff = baselineWeight - lastInWeek.weight;
                const loss = Math.max(0, diff);
                teamWeightLoss += loss;
            }
        }

        const kmAvg = memberCount > 0 ? totalKm / memberCount : 0;
        const lifestyleAvg = memberCount > 0 ? totalLifestyle / memberCount : 0;
        const attendanceAvg = memberCount > 0 ? totalAttendance / memberCount : 0;

        return {
            teamId: team.id,
            teamName: team.name,
            memberCount,
            kmAvg,
            lifestyleAvg,
            attendanceAvg,
            weightLossTotal: teamWeightLoss,
            eligible
        };
    });
}

export type AwardCategory = 'KM_AVG' | 'WEIGHT_LOSS' | 'LIFESTYLE_AVG' | 'ATTENDANCE_AVG';

export interface AwardResult {
    teamId: string;
    category: AwardCategory;
    score: number;
}

/**
 * Determine winners for each category
 */
export function determineWinners(results: TeamResult[]): AwardResult[] {
    const awards: AwardResult[] = [];
    const competitors = results.filter(r => r.eligible);

    if (competitors.length === 0) return [];

    const categories: { key: AwardCategory; getter: (r: TeamResult) => number }[] = [
        { key: 'KM_AVG', getter: r => r.kmAvg },
        { key: 'WEIGHT_LOSS', getter: r => r.weightLossTotal },
        { key: 'LIFESTYLE_AVG', getter: r => r.lifestyleAvg },
        { key: 'ATTENDANCE_AVG', getter: r => r.attendanceAvg }
    ];

    for (const cat of categories) {
        let maxVal = -1;

        // Find Max
        competitors.forEach(r => {
            const val = cat.getter(r);
            if (val > maxVal) maxVal = val;
        });

        // Must be positive to win
        if (maxVal > 0) {
            // Find all ties
            const winners = competitors.filter(r => cat.getter(r) === maxVal);
            winners.forEach(w => {
                awards.push({
                    teamId: w.teamId,
                    category: cat.key,
                    score: maxVal
                });
            });
        }
    }

    return awards;
}
