
import { describe, it, expect } from 'vitest';
import { calculateTeamMetrics, determineWinners, ScorableTeam, TeamResult } from './scoring-logic';

describe('Scoring Logic', () => {
    // Mock Config
    const config = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07')
    };

    // Helper to create a dummy member
    const createMember = (id: string, km = 0, lifestyle = 0, attendance = 0, startW = 100, endW = 100) => ({
        id,
        kmLogs: km > 0 ? [{ totalKm: km }] : [],
        lifestyleLogs: lifestyle > 0 ? [{ postCount: lifestyle }] : [],
        attendance: Array(attendance).fill({ isPresent: true }),
        weighIns: [
            { date: '2024-01-01', weight: startW },
            { date: '2024-01-07', weight: endW }
        ]
    });

    it('should mark teams with fewer than 4 members as ineligible', () => {
        const teams: ScorableTeam[] = [{
            id: 't1', name: 'Small Team',
            members: [
                createMember('m1'),
                createMember('m2'),
                createMember('m3')
            ]
        }];

        const results = calculateTeamMetrics(teams, config);
        expect(results[0].eligible).toBe(false);
        expect(results[0].memberCount).toBe(3);
    });

    it('should mark teams with 4 or more members as eligible', () => {
        const teams: ScorableTeam[] = [{
            id: 't2', name: 'Big Team',
            members: [
                createMember('m1'), createMember('m2'),
                createMember('m3'), createMember('m4')
            ]
        }];
        const results = calculateTeamMetrics(teams, config);
        expect(results[0].eligible).toBe(true);
    });

    it('should calculate averages correctly', () => {
        const team: ScorableTeam = {
            id: 't1', name: 'Stats Team',
            members: [
                createMember('m1', 10, 5, 2, 100, 95),  // 5kg loss, 10km, 5 posts
                createMember('m2', 20, 3, 4, 80, 78),   // 2kg loss, 20km, 3 posts
                createMember('m3', 0, 0, 0, 60, 60),    // 0 everything
                createMember('m4', 30, 2, 2, 90, 89)    // 1kg loss, 30km, 2 posts
            ]
        };

        const [res] = calculateTeamMetrics([team], config);

        // Members: 4
        // Total KM: 10+20+0+30 = 60. Avg = 15
        expect(res.kmAvg).toBe(15);

        // Total Lifestyle: 5+3+0+2 = 10. Avg = 2.5
        expect(res.lifestyleAvg).toBe(2.5);

        // Total Attendance: 2+4+0+2 = 8. Avg = 2
        expect(res.attendanceAvg).toBe(2);

        // Total Weight Loss: 5+2+0+1 = 8 (Sum, not Avg)
        expect(res.weightLossTotal).toBe(8);
    });

    it('should determine winners correctly', () => {
        // Mock results
        const results: TeamResult[] = [
            { teamId: 't1', teamName: 'A', weightLossTotal: 10, kmAvg: 5, lifestyleAvg: 1, attendanceAvg: 1, eligible: true, memberCount: 4 },
            { teamId: 't2', teamName: 'B', weightLossTotal: 20, kmAvg: 2, lifestyleAvg: 2, attendanceAvg: 2, eligible: true, memberCount: 4 },
            { teamId: 't3', teamName: 'C', weightLossTotal: 5, kmAvg: 10, lifestyleAvg: 1, attendanceAvg: 1, eligible: true, memberCount: 4 }
        ];

        const awards = determineWinners(results);

        // Expect T2 to win Weight (20)
        expect(awards.find(a => a.category === 'WEIGHT_LOSS')?.teamId).toBe('t2');

        // Expect T3 to win KM (10)
        expect(awards.find(a => a.category === 'KM_AVG')?.teamId).toBe('t3');

        // Expect T2 to win Lifestyle (2) and Attendance (2)
        expect(awards.find(a => a.category === 'LIFESTYLE_AVG')?.teamId).toBe('t2');
        expect(awards.find(a => a.category === 'ATTENDANCE_AVG')?.teamId).toBe('t2');
    });

    it('should handle ties by awarding multiple winners', () => {
        const results: TeamResult[] = [
            { teamId: 't1', teamName: 'A', weightLossTotal: 10, kmAvg: 0, lifestyleAvg: 0, attendanceAvg: 0, eligible: true, memberCount: 4 },
            { teamId: 't2', teamName: 'B', weightLossTotal: 10, kmAvg: 0, lifestyleAvg: 0, attendanceAvg: 0, eligible: true, memberCount: 4 }
        ];

        const awards = determineWinners(results);
        const weightWinners = awards.filter(a => a.category === 'WEIGHT_LOSS');

        expect(weightWinners.length).toBe(2);
        expect(weightWinners.map(w => w.teamId)).toContain('t1');
        expect(weightWinners.map(w => w.teamId)).toContain('t2');
    });
});
