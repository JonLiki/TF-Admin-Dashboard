
import { Team, TeamWeekMetric } from "@prisma/client";

export interface ScoreboardMetric {
    id: string;
    points: number;
    name: string;
    rank: number;
}

export interface ScoreboardData {
    weekNumber: number;
    leaderboard: ScoreboardMetric[];
    winners: {
        weightLoss?: Winner;
        km?: Winner;
        lifestyle?: Winner;
        attendance?: Winner;
    };
    metrics: {
        km: (TeamWeekMetric & { team: Team })[];
        weight: (TeamWeekMetric & { team: Team })[];
        lifestyle: (TeamWeekMetric & { team: Team })[];
        attendance: (TeamWeekMetric & { team: Team })[];
    };
}

export interface Winner {
    teamName: string;
    category: 'WEIGHT_LOSS' | 'KM_AVG' | 'LIFESTYLE_AVG' | 'ATTENDANCE_AVG';
}

export interface TeamPoints {
    teamId: string;
    points: number;
}
