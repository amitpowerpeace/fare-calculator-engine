export type ZoneCombination = '1-1' | '1-2_2-1' | '2-2';
export type FareType = 'Peak' | 'OffPeak';

export interface FareRule {
    zoneCombination: ZoneCombination;
    peakFare: number;
    offPeakFare: number;
}