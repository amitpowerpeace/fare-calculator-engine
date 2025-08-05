import { FareCalculator } from '../src/services';
import { Journey } from '../src/models';
import { getZoneCombination } from '../src/utils';

describe('FareCalculator', () => {
    let fareCalculator: FareCalculator;

    beforeEach(() => {
        fareCalculator = new FareCalculator();
    });

    describe('calculateFare for Peak Hours', () => {
        // Monday, 07:30 - Peak
        it('should return correct peak fare for 1-1 during weekday peak hours', () => {
            const journey: Journey = { id: 'test1', timestamp: '2025-08-04T07:30:00', fromZone: 1, toZone: 1 };
            const result = fareCalculator.calculateFare(journey);
            expect(result.initialFare).toBe(30);
            expect(result.isPeakHours).toBe(true);
        });

        // Friday, 17:00 - Peak
        it('should return correct peak fare for 1-2 during weekday peak hours', () => {
            const journey: Journey = { id: 'test2', timestamp: '2025-08-08T17:00:00', fromZone: 1, toZone: 2 };
            const result = fareCalculator.calculateFare(journey);
            expect(result.initialFare).toBe(35);
            expect(result.isPeakHours).toBe(true);
        });

        // Saturday, 09:00 - Peak
        it('should return correct peak fare for 2-2 during weekend peak hours', () => {
            const journey: Journey = { id: 'test3', timestamp: '2025-08-09T09:00:00', fromZone: 2, toZone: 2 };
            const result = fareCalculator.calculateFare(journey);
            expect(result.initialFare).toBe(25);
            expect(result.isPeakHours).toBe(true);
        });

        // Sunday, 18:00 - Peak
        it('should return correct peak fare for 2-1 during weekend peak hours', () => {
            const journey: Journey = { id: 'test4', timestamp: '2025-08-10T18:00:00', fromZone: 2, toZone: 1 };
            const result = fareCalculator.calculateFare(journey);
            expect(result.initialFare).toBe(35);
            expect(result.isPeakHours).toBe(true);
        });
    });

    describe('calculateFare for Off-Peak Hours', () => {
        // Tuesday, 11:00 - Off-Peak
        it('should return correct off-peak fare for 1-1 during weekday off-peak hours', () => {
            const journey: Journey = { id: 'test5', timestamp: '2025-08-05T11:00:00', fromZone: 1, toZone: 1 };
            const result = fareCalculator.calculateFare(journey);
            expect(result.initialFare).toBe(25);
            expect(result.isPeakHours).toBe(false);
        });

        // Thursday, 14:00 - Off-Peak
        it('should return correct off-peak fare for 1-2 during weekday off-peak hours', () => {
            const journey: Journey = { id: 'test6', timestamp: '2025-08-07T14:00:00', fromZone: 1, toZone: 2 };
            const result = fareCalculator.calculateFare(journey);
            expect(result.initialFare).toBe(30);
            expect(result.isPeakHours).toBe(false);
        });

        // Saturday, 12:00 - Off-Peak
        it('should return correct off-peak fare for 2-2 during weekend off-peak hours', () => {
            const journey: Journey = { id: 'test7', timestamp: '2025-08-09T12:00:00', fromZone: 2, toZone: 2 };
            const result = fareCalculator.calculateFare(journey);
            expect(result.initialFare).toBe(20);
            expect(result.isPeakHours).toBe(false);
        });

        // Sunday, 08:00 - Off-Peak (before 09:00 peak starts)
        it('should return correct off-peak fare for 2-1 during weekend off-peak hours', () => {
            const journey: Journey = { id: 'test8', timestamp: '2025-08-10T08:00:00', fromZone: 2, toZone: 1 };
            const result = fareCalculator.calculateFare(journey);
            expect(result.initialFare).toBe(30);
            expect(result.isPeakHours).toBe(false);
        });
    });

    describe('Edge cases for Peak/Off-Peak hours', () => {
        // Just before peak start
        it('should be off-peak just before weekday peak hours', () => {
            const journey: Journey = { id: 'test9', timestamp: '2025-08-04T06:59:59', fromZone: 1, toZone: 1 };
            const result = fareCalculator.calculateFare(journey);
            expect(result.initialFare).toBe(25);
            expect(result.isPeakHours).toBe(false);
        });

        // Exactly at peak start
        it('should be peak exactly at weekday peak hours start', () => {
            const journey: Journey = { id: 'test10', timestamp: '2025-08-04T07:00:00', fromZone: 1, toZone: 1 };
            const result = fareCalculator.calculateFare(journey);
            expect(result.initialFare).toBe(30);
            expect(result.isPeakHours).toBe(true);
        });

        // Exactly at peak end (should be off-peak as end is exclusive)
        it('should be off-peak exactly at weekday peak hours end', () => {
            const journey: Journey = { id: 'test11', timestamp: '2025-08-04T10:30:00', fromZone: 1, toZone: 1 };
            const result = fareCalculator.calculateFare(journey);
            expect(result.initialFare).toBe(25);
            expect(result.isPeakHours).toBe(false);
        });

        // Exactly at weekend peak start
        it('should be peak exactly at weekend peak hours start', () => {
            const journey: Journey = { id: 'test12', timestamp: '2025-08-09T09:00:00', fromZone: 1, toZone: 1 };
            const result = fareCalculator.calculateFare(journey);
            expect(result.initialFare).toBe(30);
            expect(result.isPeakHours).toBe(true);
        });

        // Exactly at weekend peak end
        it('should be off-peak exactly at weekend peak hours end', () => {
            const journey: Journey = { id: 'test13', timestamp: '2025-08-09T11:00:00', fromZone: 1, toZone: 1 };
            const result = fareCalculator.calculateFare(journey);
            expect(result.initialFare).toBe(25);
            expect(result.isPeakHours).toBe(false);
        });
    });

    describe('Invalid Inputs', () => {
        it('should throw an error for invalid timestamp format', () => {
            const journey: Journey = { id: 'test_invalid_ts', timestamp: 'invalid-date', fromZone: 1, toZone: 1 };
            expect(() => fareCalculator.calculateFare(journey)).toThrow('Invalid timestamp format: invalid-date');
        });

        it('should throw an error for invalid zone combination', () => {
            const journey: Journey = { id: 'test_invalid_zone', timestamp: '2025-08-04T08:00:00', fromZone: 0, toZone: 3 };
            expect(() => fareCalculator.calculateFare(journey)).toThrow('Invalid zone combination: 0-3');
        });
    });

    describe('Zone combination utility', () => {
        it('should correctly map 1-1', () => {
            expect(getZoneCombination(1, 1)).toBe('1-1');
        });

        it('should correctly map 2-2', () => {
            expect(getZoneCombination(2, 2)).toBe('2-2');
        });

        it('should correctly map 1-2', () => {
            expect(getZoneCombination(1, 2)).toBe('1-2_2-1');
        });

        it('should correctly map 2-1', () => {
            expect(getZoneCombination(2, 1)).toBe('1-2_2-1');
        });
    });
});