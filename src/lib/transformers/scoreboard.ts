import { BlockWeek, Team, TeamWeekMetric } from "@prisma/client";
import { ScoreboardMetric, TeamPoints } from "@/types/scoreboard";

export interface TrendDataPoint {
    name: string;
    [teamName: string]: string | number;
}

export function getTrendData(allMetrics: (TeamWeekMetric & { team: Team, blockWeek: BlockWeek })[]) {
    const weeks = Array.from(new Set(allMetrics.map(m => m.blockWeek.weekNumber))).sort((a, b) => a - b);

    const result = {
        kmAverage: [] as TrendDataPoint[],
        weightLossTotal: [] as TrendDataPoint[],
        lifestyleAverage: [] as TrendDataPoint[],
        attendanceAverage: [] as TrendDataPoint[]
    };

    weeks.forEach(weekNumber => {
        const weekMetrics = allMetrics.filter(m => m.blockWeek.weekNumber === weekNumber);

        const kmPoint: TrendDataPoint = { name: `W${weekNumber}` };
        const weightPoint: TrendDataPoint = { name: `W${weekNumber}` };
        const lifePoint: TrendDataPoint = { name: `W${weekNumber}` };
        const attPoint: TrendDataPoint = { name: `W${weekNumber}` };

        weekMetrics.forEach(m => {
            kmPoint[m.team.name] = m.kmAverage || 0;
            weightPoint[m.team.name] = m.weightLossTotal || 0;
            lifePoint[m.team.name] = m.lifestyleAverage || 0;
            attPoint[m.team.name] = m.attendanceAverage || 0;
        });

        result.kmAverage.push(kmPoint);
        result.weightLossTotal.push(weightPoint);
        result.lifestyleAverage.push(lifePoint);
        result.attendanceAverage.push(attPoint);
    });

    return result;
}

const RANKED_CATEGORIES = ['kmAverage', 'weightLossTotal', 'lifestyleAverage', 'attendanceAverage'] as const;

/**
 * Average finishing rank per team across every week/category (standard
 * competition ranking: equal values share a rank). Lower is better.
 * Teams with no metric rows rank last (Infinity) so they never win a tie
 * against a team with an actual track record.
 */
function getAverageCategoryRanks(blockMetrics: TeamWeekMetric[]): Map<string, number> {
    const rankSums = new Map<string, number>();
    const rankCounts = new Map<string, number>();

    const weekIds = new Set(blockMetrics.map(m => m.blockWeekId));
    weekIds.forEach(weekId => {
        const weekMetrics = blockMetrics.filter(m => m.blockWeekId === weekId);

        RANKED_CATEGORIES.forEach(category => {
            weekMetrics.forEach(m => {
                const value = m[category] || 0;
                // Standard competition ranking: rank = 1 + count of strictly better values.
                const rank = 1 + weekMetrics.filter(o => (o[category] || 0) > value).length;

                rankSums.set(m.teamId, (rankSums.get(m.teamId) || 0) + rank);
                rankCounts.set(m.teamId, (rankCounts.get(m.teamId) || 0) + 1);
            });
        });
    });

    const averages = new Map<string, number>();
    rankSums.forEach((sum, teamId) => {
        averages.set(teamId, sum / (rankCounts.get(teamId) || 1));
    });
    return averages;
}

function getTotalWins(blockMetrics: TeamWeekMetric[]): Map<string, number> {
    const wins = new Map<string, number>();
    blockMetrics.forEach(m => {
        wins.set(m.teamId, (wins.get(m.teamId) || 0) + (m.pointsAwarded || 0));
    });
    return wins;
}

export function getLeaderboardStandings(
    teams: { id: string; name: string }[],
    pointLedgers: TeamPoints[],
    blockMetrics: TeamWeekMetric[] = []
): ScoreboardMetric[] {
    const pointsMap = new Map<string, number>();
    pointLedgers.forEach(p => pointsMap.set(p.teamId, p.points));

    const avgRankMap = getAverageCategoryRanks(blockMetrics);
    const totalWinsMap = getTotalWins(blockMetrics);

    return teams
        .map(t => ({
            id: t.id,
            name: t.name,
            points: pointsMap.get(t.id) || 0,
            avgRank: avgRankMap.get(t.id) ?? Infinity,
            totalWins: totalWinsMap.get(t.id) || 0,
            rank: 0 // Calculated after sort
        }))
        .sort((a, b) =>
            b.points - a.points ||
            a.avgRank - b.avgRank ||
            b.totalWins - a.totalWins ||
            a.name.localeCompare(b.name)
        )
        .map(({ id, name, points }, index) => ({ id, name, points, rank: index + 1 }));
}

export function sortMetrics(metrics: (TeamWeekMetric & { team: Team })[]) {
    return {
        km: [...metrics].sort((a, b) => (b.kmAverage || 0) - (a.kmAverage || 0)),
        weight: [...metrics].sort((a, b) => (b.weightLossTotal || 0) - (a.weightLossTotal || 0)),
        lifestyle: [...metrics].sort((a, b) => (b.lifestyleAverage || 0) - (a.lifestyleAverage || 0)),
        attendance: [...metrics].sort((a, b) => (b.attendanceAverage || 0) - (a.attendanceAverage || 0)),
    };
}
