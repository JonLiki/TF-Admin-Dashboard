
import { Team, TeamWeekMetric } from "@prisma/client";
import { ScoreboardMetric, TeamPoints } from "@/types/scoreboard";

export function getLeaderboardStandings(
    teams: Team[],
    pointLedgers: TeamPoints[]
): ScoreboardMetric[] {
    const pointsMap = new Map<string, number>();
    pointLedgers.forEach(p => pointsMap.set(p.teamId, p.points));

    return teams
        .map(t => ({
            id: t.id,
            name: t.name,
            points: pointsMap.get(t.id) || 0,
            rank: 0 // Calculated after sort
        }))
        .sort((a, b) => b.points - a.points)
        .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function sortMetrics(metrics: (TeamWeekMetric & { team: Team })[]) {
    return {
        km: [...metrics].sort((a, b) => (b.kmAverage || 0) - (a.kmAverage || 0)),
        weight: [...metrics].sort((a, b) => (b.weightLossTotal || 0) - (a.weightLossTotal || 0)),
        lifestyle: [...metrics].sort((a, b) => (b.lifestyleAverage || 0) - (a.lifestyleAverage || 0)),
        attendance: [...metrics].sort((a, b) => (b.attendanceAverage || 0) - (a.attendanceAverage || 0)),
    };
}
