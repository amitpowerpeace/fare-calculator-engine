import { FareRule } from '../models/fare';

export const FARE_RULES: FareRule[] = [
    { zoneCombination: '1-1', peakFare: 30, offPeakFare: 25 },
    { zoneCombination: '1-2_2-1', peakFare: 35, offPeakFare: 30 },
    { zoneCombination: '2-2', peakFare: 25, offPeakFare: 20 },
];

// Define peak hour timings
export const PEAK_HOURS = {
    weekday: [
        { start: '07:00', end: '10:30' },
        { start: '17:00', end: '20:00' },
    ],
    weekend: [
        { start: '09:00', end: '11:00' },
        { start: '18:00', end: '22:00' },
    ],
};