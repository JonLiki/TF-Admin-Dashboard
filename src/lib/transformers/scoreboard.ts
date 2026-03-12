import { BlockWeek, Team, TeamWeekMetric } from "@prisma/client";
import { ScoreboardMetric, TeamPoints } from "@/types/scoreboard";

export function getTrendData(allMetrics: (TeamWeekMetric & { team: Team, blockWeek: BlockWeek })[]) {
    const weeks = Array.from(new Set(allMetrics.map(m => m.blockWeek.weekNumber))).sort((a, b) => a - b);

    const result = {
        kmAverage: [] as any[],
        weightLossTotal: [] as any[],
        lifestyleAverage: [] as any[],
        attendanceAverage: [] as any[]
    };

    weeks.forEach(weekNumber => {
        const weekMetrics = allMetrics.filter(m => m.blockWeek.weekNumber === weekNumber);

        const kmPoint: any = { name: `W${weekNumber}` };
        const weightPoint: any = { name: `W${weekNumber}` };
        const lifePoint: any = { name: `W${weekNumber}` };
        const attPoint: any = { name: `W${weekNumber}` };

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
