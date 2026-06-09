
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
            // Logic: Find the earliest and latest weigh-ins in a window around this week.
            // Window: [startDate - 1 day, startDate + 9 days]
            // This covers the previous Sunday through to the Tuesday of the following week,
            // so a week's loss = (weigh-in at the start of this week) - (weigh-in at the
            // start of the next week), tolerating entries logged a day or two late.
            //
            // Two intentional consequences of this rule:
            //  1. Adjacent weeks' windows OVERLAP — a single weigh-in pair can contribute
            //     to two consecutive weeks if entries are sparse.
            //  2. Gains are clamped to 0 (Math.max below), so the sum of weekly losses
            //     does NOT equal a member's start-to-end weight change. Weekly numbers
            //     reward losing weeks; use first-vs-last weigh-in for true block totals.
            const windowStart = new Date(config.startDate);
            windowStart.setDate(windowStart.getDate() - 1);
            windowStart.setHours(0, 0, 0, 0);

            const windowEnd = new Date(config.startDate);
            windowEnd.setDate(windowEnd.getDate() + 9);
            windowEnd.setHours(23, 59, 59, 999);

            const relevantWeighIns = member.weighIns
                .filter(w => {
                    const d = new Date(w.date);
                    return d >= windowStart && d <= windowEnd;
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (relevantWeighIns.length >= 2) {
                const startWeight = relevantWeighIns[0].weight;
                const endWeight = relevantWeighIns[relevantWeighIns.length - 1].weight;
                
                if (startWeight > 0 && endWeight > 0) {
                    const diff = startWeight - endWeight;
                    const loss = Math.max(0, diff);
                    teamWeightLoss += loss;
                }
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
