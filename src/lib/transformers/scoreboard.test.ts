
import { describe, it, expect } from 'vitest';
import { getLeaderboardStandings, sortMetrics } from './scoreboard';
import { Team, TeamWeekMetric } from '@prisma/client';
import { TeamPoints } from '@/types/scoreboard';

function metric(
    teamId: string,
    blockWeekId: string,
    values: { kmAverage: number; weightLossTotal: number; lifestyleAverage: number; attendanceAverage: number },
    pointsAwarded = 0
) {
    return { teamId, blockWeekId, pointsAwarded, ...values } as unknown as (TeamWeekMetric & { team: Team });
}

describe('Scoreboard Transformers', () => {
    describe('getLeaderboardStandings', () => {
        it('should correctly sort teams by points and assign ranks', () => {
            const teams: Team[] = [
                { id: '1', name: 'Team A' } as Team,
                { id: '2', name: 'Team B' } as Team,
                { id: '3', name: 'Team C' } as Team,
            ];

            const points: TeamPoints[] = [
                { teamId: '1', points: 100 },
                { teamId: '2', points: 200 },
                { teamId: '3', points: 50 },
            ];

            const standings = getLeaderboardStandings(teams, points);

            expect(standings).toHaveLength(3);
            expect(standings[0].id).toBe('2'); // Team B (200 pts)
            expect(standings[0].rank).toBe(1);
            expect(standings[1].id).toBe('1'); // Team A (100 pts)
            expect(standings[2].id).toBe('3'); // Team C (50 pts)
        });

        it('should handle missing point data gracefully (default to 0)', () => {
            const teams: Team[] = [{ id: '1', name: 'Team A' } as Team];
            const points: TeamPoints[] = [];

            const standings = getLeaderboardStandings(teams, points);

            expect(standings[0].points).toBe(0);
        });

        it('should break a points tie using average category rank (consistent performer wins)', () => {
            const teams: Team[] = [
                { id: '1', name: 'Team A' } as Team, // consistently 2nd everywhere
                { id: '2', name: 'Team B' } as Team, // wins one week big, poor otherwise
            ];
            const points: TeamPoints[] = [
                { teamId: '1', points: 2 },
                { teamId: '2', points: 2 },
            ];
            const metrics = [
                // Week 1: A slightly behind B in every category (A rank 2, B rank 1)
                metric('1', 'w1', { kmAverage: 10, weightLossTotal: 1, lifestyleAverage: 5, attendanceAverage: 2 }),
                metric('2', 'w1', { kmAverage: 12, weightLossTotal: 2, lifestyleAverage: 6, attendanceAverage: 3 }),
                // Week 2: A still consistently ahead of B (A rank 1, B rank 2)
                metric('1', 'w2', { kmAverage: 15, weightLossTotal: 2, lifestyleAverage: 7, attendanceAverage: 3 }),
                metric('2', 'w2', { kmAverage: 1, weightLossTotal: 0, lifestyleAverage: 1, attendanceAverage: 0 }),
            ] as (TeamWeekMetric & { team: Team })[];

            const standings = getLeaderboardStandings(teams, points, metrics);

            // Team A has the better (lower) average rank across both weeks despite equal points
            expect(standings[0].id).toBe('1');
            expect(standings[0].rank).toBe(1);
            expect(standings[1].id).toBe('2');
            expect(standings[1].rank).toBe(2);
        });

        it('should fall back to total category wins when points and average rank tie', () => {
            const teams: Team[] = [
                { id: '1', name: 'Team A' } as Team,
                { id: '2', name: 'Team B' } as Team,
            ];
            const points: TeamPoints[] = [
                { teamId: '1', points: 4 },
                { teamId: '2', points: 4 },
            ];
            const metrics = [
                metric('1', 'w1', { kmAverage: 10, weightLossTotal: 1, lifestyleAverage: 5, attendanceAverage: 2 }, 2),
                metric('2', 'w1', { kmAverage: 10, weightLossTotal: 1, lifestyleAverage: 5, attendanceAverage: 2 }, 4),
            ] as (TeamWeekMetric & { team: Team })[];

            const standings = getLeaderboardStandings(teams, points, metrics);

            expect(standings[0].id).toBe('2'); // more total category wins
            expect(standings[1].id).toBe('1');
        });

        it('should fall back to team name when everything else ties', () => {
            const teams: Team[] = [
                { id: '2', name: 'Zebra' } as Team,
                { id: '1', name: 'Alpha' } as Team,
            ];
            const points: TeamPoints[] = [
                { teamId: '2', points: 1 },
                { teamId: '1', points: 1 },
            ];

            const standings = getLeaderboardStandings(teams, points, []);

            expect(standings[0].name).toBe('Alpha');
            expect(standings[1].name).toBe('Zebra');
        });
    });

    describe('sortMetrics', () => {
        it('should sort all metrics in descending order', () => {
            const metrics = [
                { id: '1', kmAverage: 10, weightLossTotal: 2, lifestyleAverage: 5, attendanceAverage: 80, team: { id: '1' } } as unknown as (TeamWeekMetric & { team: Team }),
                { id: '2', kmAverage: 20, weightLossTotal: 5, lifestyleAverage: 4, attendanceAverage: 90, team: { id: '2' } } as unknown as (TeamWeekMetric & { team: Team }),
            ];

            const sorted = sortMetrics(metrics);

            expect(sorted.km[0].id).toBe('2'); // Higher KM first
            expect(sorted.weight[0].id).toBe('2'); // Higher weight loss first
            expect(sorted.lifestyle[0].id).toBe('1'); // Higher lifestyle first
            expect(sorted.attendance[0].id).toBe('2'); // Higher attendance first
        });
    });
});
