import { Journey } from '../models';
import type { CommuterSummary, WeeklySummary, ZoneCombination } from '../models';
import { CAP_RULES } from '../config';
import { FareCalculator } from './FareCalculator';
import { getFormattedDate, getWeekNumber, parseTimestamp, getZoneCombination } from '../utils';


function getHigherPriorityZone(zone1: ZoneCombination | null, zone2: ZoneCombination | null): ZoneCombination | null {
    const priorityOrder: Record<ZoneCombination, number> = {
        '1-2_2-1': 3, // Highest priority
        '1-1': 2,
        '2-2': 1     // Lowest priority
    };

    if (zone1 === null) {
        return zone2;
    }
    if (zone2 === null) {
        return zone1;
    }

    if (priorityOrder[zone1] > priorityOrder[zone2]) {
        return zone1;
    } else {
        return zone2;
    }
}


export class FareCapper {
    private fareCalculator: FareCalculator;
    private dailySummaries: Map<string, CommuterSummary>; // Key: 'YYYY-MM-DD'
    private weeklySummaries: Map<string, WeeklySummary>; // Key: 'YYYY-Wxx'

    constructor() {
        this.fareCalculator = new FareCalculator();
        this.dailySummaries = new Map();
        this.weeklySummaries = new Map();
    }

    /**
     * Processes a list of journeys, applying daily and weekly fare caps.
     * Journeys must be provided in chronological order for correct capping.
     * @param journeys A sorted array of Journey objects.
     * @returns An object containing the final calculated daily and weekly totals.
     */
    processJourneys(journeys: Journey[]): { dailySummaries: Map<string, CommuterSummary>, weeklySummaries: Map<string, WeeklySummary> } {
        // Ensure journeys are sorted by timestamp for correct cumulative calculations
        journeys.sort((a, b) => parseTimestamp(a.timestamp).getTime() - parseTimestamp(b.timestamp).getTime());

        for (const journey of journeys) {
            this.processSingleJourney(journey);
        }

        return {
            dailySummaries: this.dailySummaries,
            weeklySummaries: this.weeklySummaries,
        };
    }

    private processSingleJourney(journey: Journey): void {
        const journeyDate = parseTimestamp(journey.timestamp);
        const formattedDate = getFormattedDate(journeyDate);
        const weekIdentifier = getWeekNumber(journeyDate);

        // --- 1. Get/Initialize Daily Summary ---
        if (!this.dailySummaries.has(formattedDate)) {
            this.dailySummaries.set(formattedDate, {
                date: formattedDate,
                totalChargedDaily: 0,
                effectiveDailyCap: 0,
                dailyJourneys: [],
                farthestZoneDaily: null,
            });
        }
        const dailySummary = this.dailySummaries.get(formattedDate)!;

        // --- 2. Determine/Update Daily Cap for the Day ---
        const currentJourneyZone = getZoneCombination(journey.fromZone, journey.toZone);
        let updatedFarthestZoneDaily = dailySummary.farthestZoneDaily;

        // Use the helper function here too for consistency and clarity
        updatedFarthestZoneDaily = getHigherPriorityZone(updatedFarthestZoneDaily, currentJourneyZone);

        dailySummary.farthestZoneDaily = updatedFarthestZoneDaily;

        const applicableDailyCapRule = CAP_RULES.find(r => r.zoneCombination === dailySummary.farthestZoneDaily);
        // Fallback to 0 if no rule found (should not happen with valid zone combinations)
        dailySummary.effectiveDailyCap = applicableDailyCapRule ? applicableDailyCapRule.dailyCap : 0;

        // --- 3. Calculate Fare for the Current Journey and Apply Daily Cap ---
        const initialCalculatedJourney = this.fareCalculator.calculateFare(journey);
        let chargedFareForJourney = initialCalculatedJourney.initialFare;

        // Check if adding this fare would exceed the daily cap
        const currentDailyTotalBeforeThisJourney = dailySummary.totalChargedDaily;
        if (currentDailyTotalBeforeThisJourney + chargedFareForJourney > dailySummary.effectiveDailyCap) {
            chargedFareForJourney = Math.max(0, dailySummary.effectiveDailyCap - currentDailyTotalBeforeThisJourney);
        }

        dailySummary.totalChargedDaily += chargedFareForJourney;
        // Store the journey with the *charged* fare after daily capping
        dailySummary.dailyJourneys.push({ ...initialCalculatedJourney, chargedFare: chargedFareForJourney });


        // --- 4. Update Weekly Summary ---
        // Get/Initialize Weekly Summary
        if (!this.weeklySummaries.has(weekIdentifier)) {
            this.weeklySummaries.set(weekIdentifier, {
                weekIdentifier: weekIdentifier,
                totalChargedWeekly: 0,
                effectiveWeeklyCap: 0,
                dailySummaries: [],
                farthestZoneWeekly: null,
            });
        }
        const weeklySummary = this.weeklySummaries.get(weekIdentifier)!;

        // Add or update the daily summary in the weekly summary's array (ensure unique daily entries by date)
        const existingDailyIndex = weeklySummary.dailySummaries.findIndex(s => s.date === formattedDate);
        if (existingDailyIndex !== -1) {
            weeklySummary.dailySummaries[existingDailyIndex] = dailySummary;
        } else {
            weeklySummary.dailySummaries.push(dailySummary);
        }

        // --- 5. Determine/Update Weekly Cap for the Week (based on farthest journey in the week) ---
        // Initialize with the current farthest zone for the week (if any)
        let currentFarthestZoneWeekly: ZoneCombination | null = weeklySummary.farthestZoneWeekly;

        for (const dailySum of weeklySummary.dailySummaries) {
            // Use the helper function to determine the highest priority zone encountered so far.
            currentFarthestZoneWeekly = getHigherPriorityZone(currentFarthestZoneWeekly, dailySum.farthestZoneDaily);
        }

        weeklySummary.farthestZoneWeekly = currentFarthestZoneWeekly;

        const applicableWeeklyCapRule = CAP_RULES.find(r => r.zoneCombination === weeklySummary.farthestZoneWeekly);
        weeklySummary.effectiveWeeklyCap = applicableWeeklyCapRule ? applicableWeeklyCapRule.weeklyCap : 0;

        // --- 6. Apply Weekly Cap (sum of *daily capped amounts*) ---
        // Sum all daily_capped_fares for the current week
        let sumOfDailyCappedFaresInWeek = 0;
        for (const dailySum of weeklySummary.dailySummaries) {
            sumOfDailyCappedFaresInWeek += dailySum.totalChargedDaily;
        }

        // Apply the weekly cap to this sum
        weeklySummary.totalChargedWeekly = Math.min(sumOfDailyCappedFaresInWeek, weeklySummary.effectiveWeeklyCap);
    }
}