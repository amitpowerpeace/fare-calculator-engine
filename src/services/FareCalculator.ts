import { Journey, CalculatedJourney } from '../models';
import { FARE_RULES } from '../config';
import { isPeakHours, parseTimestamp, getZoneCombination } from '../utils';

export class FareCalculator {
    /**
     * Calculates the initial fare for a single journey based on time and zones, before any capping.
     * @param journey The Journey object.
     * @returns The CalculatedJourney object including the initial fare.
     */
    calculateFare(journey: Journey): CalculatedJourney {
        const timestamp = parseTimestamp(journey.timestamp);
        const peakHours = isPeakHours(timestamp);
        const zoneCombination = getZoneCombination(journey.fromZone, journey.toZone);

        const rule = FARE_RULES.find(r => r.zoneCombination === zoneCombination);

        if (!rule) {
            // This should ideally not happen with valid zone inputs (1 or 2)
            throw new Error(`Fare rule not found for zones: ${journey.fromZone}-${journey.toZone}. Combination: ${zoneCombination}`);
        }

        const initialFare = peakHours ? rule.peakFare : rule.offPeakFare;

        return {
            ...journey,
            initialFare,
            chargedFare: initialFare,
            isPeakHours: peakHours,
        };
    }
}