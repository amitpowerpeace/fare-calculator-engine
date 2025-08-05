import { FareCapper } from '../src/services';
import { Journey } from '../src/models'; 
import { CommuterSummary, WeeklySummary } from '../src/models';
import { getWeekNumber } from '../src/utils';

describe('FareCapper', () => {
    let fareCapper: FareCapper;

    beforeEach(() => {
        fareCapper = new FareCapper();
    });

    const getDailySummary = (dailySummaries: Map<string, CommuterSummary>, dateString: string): CommuterSummary | undefined => {
        return dailySummaries.get(dateString);
    };

    // Helper to extract a weekly summary by week identifier
    const getWeeklySummary = (weeklySummaries: Map<string, WeeklySummary>, weekId: string): WeeklySummary | undefined => {
        return weeklySummaries.get(weekId);
    };

    // Reference dates for testing
    const mondayDateStr = '2025-08-04'; // Monday
    const tuesdayDateStr = '2025-08-05';

    const week1Identifier = getWeekNumber(new Date(mondayDateStr + 'T00:00:00'));
    describe('Daily Capping - Base Scenarios', () => {
        it('should cap daily fare for 1-1 zone at 100', () => {
            const journeys: Journey[] = [
                { id: 'j1', timestamp: mondayDateStr + 'T07:00:00', fromZone: 1, toZone: 1 }, // Peak: 30
                { id: 'j2', timestamp: mondayDateStr + 'T08:00:00', fromZone: 1, toZone: 1 }, // Peak: 30 (Total: 60)
                { id: 'j3', timestamp: mondayDateStr + 'T09:00:00', fromZone: 1, toZone: 1 }, // Peak: 30 (Total: 90)
                { id: 'j4', timestamp: mondayDateStr + 'T10:00:00', fromZone: 1, toZone: 1 }, // Peak: 30 (Would make total 120, capped at 100. This ride is charged 10)
            ];

            const { dailySummaries } = fareCapper.processJourneys(journeys);
            const summary = getDailySummary(dailySummaries, mondayDateStr);

            expect(summary).toBeDefined();
            expect(summary?.totalChargedDaily).toBe(100);
            expect(summary?.effectiveDailyCap).toBe(100);
            expect(summary?.farthestZoneDaily).toBe('1-1');

            expect(summary?.dailyJourneys[0].chargedFare).toBe(30);
            expect(summary?.dailyJourneys[1].chargedFare).toBe(30);
            expect(summary?.dailyJourneys[2].chargedFare).toBe(30);
            expect(summary?.dailyJourneys[3].chargedFare).toBe(10); // 100 - 90 = 10
        });

        it('should cap daily fare for 1-2 zone at 120', () => {
            const journeys: Journey[] = [
                { id: 'j1', timestamp: mondayDateStr + 'T07:00:00', fromZone: 1, toZone: 2 }, // Peak: 35
                { id: 'j2', timestamp: mondayDateStr + 'T08:00:00', fromZone: 2, toZone: 1 }, // Peak: 35 (Total: 70)
                { id: 'j3', timestamp: mondayDateStr + 'T09:00:00', fromZone: 1, toZone: 2 }, // Peak: 35 (Total: 105)
                { id: 'j4', timestamp: mondayDateStr + 'T10:00:00', fromZone: 2, toZone: 1 }, // Peak: 35 (Would make total 140, capped at 120. This ride is charged 15)
            ];

            const { dailySummaries } = fareCapper.processJourneys(journeys);
            const summary = getDailySummary(dailySummaries, mondayDateStr);

            expect(summary).toBeDefined();
            expect(summary?.totalChargedDaily).toBe(120);
            expect(summary?.effectiveDailyCap).toBe(120);
            expect(summary?.farthestZoneDaily).toBe('1-2_2-1');

            expect(summary?.dailyJourneys[0].chargedFare).toBe(35);
            expect(summary?.dailyJourneys[1].chargedFare).toBe(35);
            expect(summary?.dailyJourneys[2].chargedFare).toBe(35);
            expect(summary?.dailyJourneys[3].chargedFare).toBe(15); // 120 - 105 = 15
        });

        it('should cap daily fare for 2-2 zone at 80', () => {
            const journeys: Journey[] = [
                { id: 'j1', timestamp: mondayDateStr + 'T07:00:00', fromZone: 2, toZone: 2 }, // Peak: 25
                { id: 'j2', timestamp: mondayDateStr + 'T08:00:00', fromZone: 2, toZone: 2 }, // Peak: 25 (Total: 50)
                { id: 'j3', timestamp: mondayDateStr + 'T09:00:00', fromZone: 2, toZone: 2 }, // Peak: 25 (Total: 75)
                { id: 'j4', timestamp: mondayDateStr + 'T10:00:00', fromZone: 2, toZone: 2 }, // Peak: 25 (Would make total 100, capped at 80. This ride is charged 5)
            ];

            const { dailySummaries } = fareCapper.processJourneys(journeys);
            const summary = getDailySummary(dailySummaries, mondayDateStr);

            expect(summary).toBeDefined();
            expect(summary?.totalChargedDaily).toBe(80);
            expect(summary?.effectiveDailyCap).toBe(80);
            expect(summary?.farthestZoneDaily).toBe('2-2');

            expect(summary?.dailyJourneys[0].chargedFare).toBe(25);
            expect(summary?.dailyJourneys[1].chargedFare).toBe(25);
            expect(summary?.dailyJourneys[2].chargedFare).toBe(25);
            expect(summary?.dailyJourneys[3].chargedFare).toBe(5); // 80 - 75 = 5
        });

        it('should handle multiple journeys and free rides after cap is hit', () => {
            const journeys: Journey[] = [
                { id: 'j1', timestamp: mondayDateStr + 'T07:00:00', fromZone: 1, toZone: 1 }, // 30
                { id: 'j2', timestamp: mondayDateStr + 'T08:00:00', fromZone: 1, toZone: 1 }, // 30 (Total: 60)
                { id: 'j3', timestamp: mondayDateStr + 'T09:00:00', fromZone: 1, toZone: 1 }, // 30 (Total: 90)
                { id: 'j4', timestamp: mondayDateStr + 'T10:00:00', fromZone: 1, toZone: 1 }, // 30 (Total would be 120, capped at 100 for 1-1. This ride becomes 10)
                { id: 'j5', timestamp: mondayDateStr + 'T11:00:00', fromZone: 1, toZone: 1 }, // 25 (Off-peak, free as cap reached)
                { id: 'j6', timestamp: mondayDateStr + 'T17:00:00', fromZone: 1, toZone: 1 }, // 30 (Peak, free as cap reached)
            ];

            const { dailySummaries } = fareCapper.processJourneys(journeys);
            const summary = getDailySummary(dailySummaries, mondayDateStr);

            expect(summary?.totalChargedDaily).toBe(100);
            expect(summary?.farthestZoneDaily).toBe('1-1');
            expect(summary?.effectiveDailyCap).toBe(100);

            expect(summary?.dailyJourneys.length).toBe(6);
            expect(summary?.dailyJourneys[0].chargedFare).toBe(30);
            expect(summary?.dailyJourneys[1].chargedFare).toBe(30);
            expect(summary?.dailyJourneys[2].chargedFare).toBe(30);
            expect(summary?.dailyJourneys[3].chargedFare).toBe(10); // 100 - 90 = 10
            expect(summary?.dailyJourneys[4].chargedFare).toBe(0);
            expect(summary?.dailyJourneys[5].chargedFare).toBe(0);
        });

        it('should calculate correctly if total fare does not reach daily cap', () => {
            const journeys: Journey[] = [
                { id: 'j1', timestamp: mondayDateStr + 'T07:00:00', fromZone: 1, toZone: 1 }, // 30
                { id: 'j2', timestamp: mondayDateStr + 'T12:00:00', fromZone: 1, toZone: 1 }, // 25 (Total: 55)
            ];

            const { dailySummaries } = fareCapper.processJourneys(journeys);
            const summary = getDailySummary(dailySummaries, mondayDateStr);

            expect(summary?.totalChargedDaily).toBe(55);
            expect(summary?.farthestZoneDaily).toBe('1-1');
            expect(summary?.effectiveDailyCap).toBe(100);

            expect(summary?.dailyJourneys[0].chargedFare).toBe(30);
            expect(summary?.dailyJourneys[1].chargedFare).toBe(25);
        });
    });

    describe('Daily Capping - Farthest Journey Logic', () => {
        it('should set daily cap based on the farthest journey (1-2) appearing first', () => {
            const journeys: Journey[] = [
                { id: 'j1', timestamp: mondayDateStr + 'T07:00:00', fromZone: 1, toZone: 2 }, // Peak: 35. Farthest is 1-2_2-1 (Cap 120)
                { id: 'j2', timestamp: mondayDateStr + 'T08:00:00', fromZone: 1, toZone: 1 }, // Peak: 30
                { id: 'j3', timestamp: mondayDateStr + 'T09:00:00', fromZone: 2, toZone: 2 }, // Peak: 25
            ];
            // Total would be 35+30+25 = 90. Cap is 120. So 90 should be charged.

            const { dailySummaries } = fareCapper.processJourneys(journeys);
            const summary = getDailySummary(dailySummaries, mondayDateStr);

            expect(summary).toBeDefined();
            expect(summary?.farthestZoneDaily).toBe('1-2_2-1');
            expect(summary?.effectiveDailyCap).toBe(120);
            expect(summary?.totalChargedDaily).toBe(90);

            expect(summary?.dailyJourneys[0].chargedFare).toBe(35);
            expect(summary?.dailyJourneys[1].chargedFare).toBe(30);
            expect(summary?.dailyJourneys[2].chargedFare).toBe(25);
        });

        it('should set daily cap based on the farthest journey (1-2) appearing later', () => {
            const journeys: Journey[] = [
                { id: 'j1', timestamp: mondayDateStr + 'T07:00:00', fromZone: 1, toZone: 1 }, // Peak: 30. Farthest is 1-1 (Cap 100)
                { id: 'j2', timestamp: mondayDateStr + 'T08:00:00', fromZone: 2, toZone: 2 }, // Peak: 25. Farthest is 1-1 (Cap still 100, 2-2 is less expansive)
                { id: 'j3', timestamp: mondayDateStr + 'T09:00:00', fromZone: 1, toZone: 2 }, // Peak: 35. Farthest becomes 1-2_2-1 (Cap 120)
            ];
            // Total would be 30+25+35 = 90. Cap becomes 120 after J3. So 90 should be charged.

            const { dailySummaries } = fareCapper.processJourneys(journeys);
            const summary = getDailySummary(dailySummaries, mondayDateStr);

            expect(summary).toBeDefined();
            expect(summary?.farthestZoneDaily).toBe('1-2_2-1');
            expect(summary?.effectiveDailyCap).toBe(120);
            expect(summary?.totalChargedDaily).toBe(90);

            expect(summary?.dailyJourneys[0].chargedFare).toBe(30);
            expect(summary?.dailyJourneys[1].chargedFare).toBe(25);
            expect(summary?.dailyJourneys[2].chargedFare).toBe(35);
        });

        it('should cap correctly when farthest journey appears later and causes current sum to exceed new cap', () => {
            const journeys: Journey[] = [
                { id: 'j1', timestamp: mondayDateStr + 'T07:00:00', fromZone: 1, toZone: 1 }, // Peak: 30
                { id: 'j2', timestamp: mondayDateStr + 'T07:30:00', fromZone: 1, toZone: 1 }, // Peak: 30 (Current total: 60. Current cap: 100 for 1-1)
                { id: 'j3', timestamp: mondayDateStr + 'T08:00:00', fromZone: 1, toZone: 2 }, // Peak: 35 (Total 95. Farthest changes to 1-2_2-1. New cap: 120)
                { id: 'j4', timestamp: mondayDateStr + 'T08:30:00', fromZone: 1, toZone: 1 }, // Peak: 30 (Total 95+30=125. Capped at 120. This ride is charged 25)
            ];

            const { dailySummaries } = fareCapper.processJourneys(journeys);
            const summary = getDailySummary(dailySummaries, mondayDateStr);

            expect(summary).toBeDefined();
            expect(summary?.farthestZoneDaily).toBe('1-2_2-1');
            expect(summary?.effectiveDailyCap).toBe(120);
            expect(summary?.totalChargedDaily).toBe(120);

            expect(summary?.dailyJourneys[0].chargedFare).toBe(30);
            expect(summary?.dailyJourneys[1].chargedFare).toBe(30);
            expect(summary?.dailyJourneys[2].chargedFare).toBe(35);
            expect(summary?.dailyJourneys[3].chargedFare).toBe(25); // 120 - 95 = 25
        });
    });

    describe('Weekly Capping - Base Scenarios', () => {

        it('should correctly calculate weekly fare when weekly cap is not reached', () => {
            const journeys: Journey[] = [
                // Monday: Farthest 1-1, Daily Cap 100. Total Charged: 55.
                { id: 'm1', timestamp: mondayDateStr + 'T07:00:00', fromZone: 1, toZone: 1 }, // 30
                { id: 'm2', timestamp: mondayDateStr + 'T12:00:00', fromZone: 1, toZone: 1 }, // 25
                // Tuesday: Farthest 2-2, Daily Cap 80. Total Charged: 45.
                { id: 't1', timestamp: tuesdayDateStr + 'T08:00:00', fromZone: 2, toZone: 2 }, // 25
                { id: 't2', timestamp: tuesdayDateStr + 'T13:00:00', fromZone: 2, toZone: 2 }, // 20
            ];
            // Farthest zone for the week will be '1-1' (from Monday, cap 500)
            // Total charged: 55 + 45 = 100. Should not hit 500 weekly cap.

            const { dailySummaries, weeklySummaries } = fareCapper.processJourneys(journeys);

            expect(getDailySummary(dailySummaries, mondayDateStr)?.totalChargedDaily).toBe(55);
            expect(getDailySummary(dailySummaries, tuesdayDateStr)?.totalChargedDaily).toBe(45);

            const weekSummary = getWeeklySummary(weeklySummaries, week1Identifier);
            expect(weekSummary).toBeDefined();
            expect(weekSummary?.farthestZoneWeekly).toBe('1-1'); // The "highest" of 1-1 and 2-2 if no 1-2
            expect(weekSummary?.effectiveWeeklyCap).toBe(500); // For 1-1
            expect(weekSummary?.totalChargedWeekly).toBe(100); // 55 + 45
        });
    });
});
