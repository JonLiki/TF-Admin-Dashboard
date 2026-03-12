import { describe, it, expect } from 'vitest';
import { calculateTeamMetrics, determineWinners, ScorableTeam } from './scoring-logic';

describe('Scoring Logic', () => {
    describe('calculateTeamMetrics', () => {
        it('calculates metrics correctly for a single eligible team', () => {
            const mockDate = new Date('2026-01-01T12:00:00Z');
            const nextWeekDate = new Date('2026-01-08T12:00:00Z');

            const team: ScorableTeam = {
                id: 't1',
                name: 'Team Alpha',
                members: [
                    { id: 'm1', kmLogs: [{ totalKm: 10 }], lifestyleLogs: [{ postCount: 2 }], attendance: [{ id: 'a1' }, { id: 'a2' }], weighIns: [{ date: mockDate, weight: 100 }, { date: nextWeekDate, weight: 98 }] },
                    { id: 'm2', kmLogs: [{ totalKm: 15 }], lifestyleLogs: [{ postCount: 3 }], attendance: [{ id: 'a3' }], weighIns: [{ date: mockDate, weight: 80 }, { date: nextWeekDate, weight: 79 }] },
                    { id: 'm3', kmLogs: [{ totalKm: 5 }], lifestyleLogs: [{ postCount: 1 }], attendance: [], weighIns: [{ date: mockDate, weight: 90 }, { date: nextWeekDate, weight: 90 }] },
                    { id: 'm4', kmLogs: [{ totalKm: 20 }], lifestyleLogs: [{ postCount: 4 }], attendance: [{ id: 'a4' }, { id: 'a5' }, { id: 'a6' }], weighIns: [{ date: mockDate, weight: 110 }, { date: nextWeekDate, weight: 105 }] },
                ]
            };

            const config = {
                startDate: new Date('2026-01-01T00:00:00Z'),
                endDate: new Date('2026-01-07T23:59:59Z')
            };

            const results = calculateTeamMetrics([team], config);

            expect(results).toHaveLength(1);
            const res = results[0];

            expect(res.eligible).toBe(true);
            expect(res.memberCount).toBe(4);
            expect(res.kmAvg).toBe((10 + 15 + 5 + 20) / 4); // 12.5
            expect(res.lifestyleAvg).toBe((2 + 3 + 1 + 4) / 4); // 2.5
            expect(res.attendanceAvg).toBe((2 + 1 + 0 + 3) / 4); // 1.5

            // Weights loss:
            // m1: 100 - 98 = 2
            // m2: 80 - 79 = 1
            // m3: 90 - 90 = 0
            // m4: 110 - 105 = 5
            expect(res.weightLossTotal).toBe(2 + 1 + 0 + 5); // 8
        });

        it('marks teams with less than 4 members as ineligible', () => {
             const team: ScorableTeam = {
                id: 't2',
                name: 'Team Beta',
                members: [
                     { id: 'm1', kmLogs: [], lifestyleLogs: [], attendance: [], weighIns: [] },
                     { id: 'm2', kmLogs: [], lifestyleLogs: [], attendance: [], weighIns: [] },
                ]
            };

            const config = {
                startDate: new Date('2026-01-01T00:00:00Z'),
                endDate: new Date('2026-01-07T23:59:59Z')
            };

            const results = calculateTeamMetrics([team], config);
            expect(results[0].eligible).toBe(false);
        });
    });

    describe('determineWinners', () => {
        it('assigns awards to the top teams in each category', () => {
            const results = [
                { teamId: 't1', teamName: 'A', memberCount: 4, eligible: true, kmAvg: 10, lifestyleAvg: 5, attendanceAvg: 2, weightLossTotal: 5 },
                { teamId: 't2', teamName: 'B', memberCount: 5, eligible: true, kmAvg: 15, lifestyleAvg: 4, attendanceAvg: 3, weightLossTotal: 2 },
                { teamId: 't3', teamName: 'C', memberCount: 4, eligible: true, kmAvg: 8, lifestyleAvg: 6, attendanceAvg: 1, weightLossTotal: 8 },
            ];

            const awards = determineWinners(results);

            // KM Winner: t2 (15)
            // Lifestyle Winner: t3 (6)
            // Attendance Winner: t2 (3)
            // Weight Loss Winner: t3 (8)

            expect(awards).toEqual(expect.arrayContaining([
                { teamId: 't2', category: 'KM_AVG', score: 15 },
                { teamId: 't3', category: 'LIFESTYLE_AVG', score: 6 },
                { teamId: 't2', category: 'ATTENDANCE_AVG', score: 3 },
                { teamId: 't3', category: 'WEIGHT_LOSS', score: 8 }
            ]));
            expect(awards).toHaveLength(4);
        });

        it('handles ties by awarding multiple teams', () => {
             const results = [
                { teamId: 't1', teamName: 'A', memberCount: 4, eligible: true, kmAvg: 20, lifestyleAvg: 0, attendanceAvg: 0, weightLossTotal: 0 },
                { teamId: 't2', teamName: 'B', memberCount: 4, eligible: true, kmAvg: 20, lifestyleAvg: 0, attendanceAvg: 0, weightLossTotal: 0 },
            ];

            const awards = determineWinners(results);

            expect(awards).toEqual(expect.arrayContaining([
                { teamId: 't1', category: 'KM_AVG', score: 20 },
                { teamId: 't2', category: 'KM_AVG', score: 20 },
            ]));
            expect(awards).toHaveLength(2);
        });

        it('ignores ineligible teams when determining winners', () => {
             const results = [
                { teamId: 't1', teamName: 'A', memberCount: 3, eligible: false, kmAvg: 100, lifestyleAvg: 100, attendanceAvg: 100, weightLossTotal: 100 }, // Huge scores, but ineligible
                { teamId: 't2', teamName: 'B', memberCount: 4, eligible: true, kmAvg: 10, lifestyleAvg: 2, attendanceAvg: 1, weightLossTotal: 5 },
            ];

            const awards = determineWinners(results);

            // Should only award t2
            expect(awards.every(a => a.teamId === 't2')).toBe(true);
            expect(awards).toHaveLength(4); // Wins all 4 categories by default
        });
    });
});
