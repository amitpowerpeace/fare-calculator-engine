import { CapRule } from '../models/cap';
export const CAP_RULES: CapRule[] = [
    { zoneCombination: '1-1', dailyCap: 100, weeklyCap: 500 },
    { zoneCombination: '1-2_2-1', dailyCap: 120, weeklyCap: 600 },
    { zoneCombination: '2-2', dailyCap: 80, weeklyCap: 400 },
];