
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

        // Extend end date by 7 days to safely include the entire next week for "End Weight" (Week N+1)
        const endDateObj = typeof config.endDate === 'string' ? new Date(config.endDate) : new Date(config.endDate);
        const lookaheadEndDate = new Date(endDateObj);
        lookaheadEndDate.setDate(lookaheadEndDate.getDate() + 7);
        const endDateKey = toDateKey(lookaheadEndDate);

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
            // Week N Weight Loss = (Weight logged during Week N) - (Weight logged during Week N+1)

            // 1. Find weigh-in for THIS week (matches UI getWeighInForWeek bound logic)
            const thisWeekStart = new Date(config.startDate);
            const thisWeekEndObj = new Date(config.endDate);
            thisWeekEndObj.setDate(thisWeekEndObj.getDate() + 1);
            // End of day
            const thisWeekEnd = new Date(thisWeekEndObj);
            thisWeekEnd.setHours(23, 59, 59, 999);

            const thisWeekWeighIn = member.weighIns.find(w => {
                const d = new Date(w.date);
                return d >= thisWeekStart && d <= thisWeekEnd;
            });

            // 2. Find weigh-in for NEXT week
            // Next week starts where this week technically "ends" conceptually, but we match the UI bounds
            // Next week start = config.endDate + 1 day? No, `block.weeks` has consecutive dates.
            // If week 1 is Jan 19 - Jan 25. Then Week 2 is Jan 26 - Feb 1.
            // config.endDate is exactly the start of the next week conceptually if it's Jan 26 00:00:00.
            // But let's construct standard bounds: next week is 7 days after the first one.
            const nextWeekStart = new Date(thisWeekStart);
            nextWeekStart.setDate(nextWeekStart.getDate() + 7);

            const nextWeekEndObj = new Date(nextWeekStart);
            nextWeekEndObj.setDate(nextWeekEndObj.getDate() + 6); // Add 6 days to get to end of next week
            nextWeekEndObj.setDate(nextWeekEndObj.getDate() + 1); // Extract +1 for UI overlap behavior
            const nextWeekEnd = new Date(nextWeekEndObj);
            nextWeekEnd.setHours(23, 59, 59, 999);

            const nextWeekWeighIn = member.weighIns.find(w => {
                const d = new Date(w.date);
                return d >= nextWeekStart && d <= nextWeekEnd;
            });

            if (thisWeekWeighIn && thisWeekWeighIn.weight > 0 && nextWeekWeighIn && nextWeekWeighIn.weight > 0) {
                const diff = thisWeekWeighIn.weight - nextWeekWeighIn.weight;
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
