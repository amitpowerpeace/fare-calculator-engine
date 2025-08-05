import { CalculatedJourney } from './journey';
import { ZoneCombination } from './fare';

export type CapType = 'Daily' | 'Weekly';

export interface CapRule {
    zoneCombination: ZoneCombination;
    dailyCap: number;
    weeklyCap: number;
}

export interface CommuterSummary {
    date: string; // 'YYYY-MM-DD'
    totalChargedDaily: number;
    effectiveDailyCap: number;
    dailyJourneys: CalculatedJourney[];
    farthestZoneDaily: ZoneCombination | null;
}

export interface WeeklySummary {
    weekIdentifier: string; // 'YYYY-Wxx'
    totalChargedWeekly: number;
    effectiveWeeklyCap: number;
    dailySummaries: CommuterSummary[];
    farthestZoneWeekly: ZoneCombination | null;
}