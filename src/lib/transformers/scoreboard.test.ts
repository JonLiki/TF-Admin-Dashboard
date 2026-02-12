
import { describe, it, expect } from 'vitest';
import { getLeaderboardStandings, sortMetrics } from './scoreboard';
import { Team, TeamWeekMetric } from '@prisma/client';
import { TeamPoints } from '@/types/scoreboard';

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
