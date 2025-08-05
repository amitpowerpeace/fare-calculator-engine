import { PEAK_HOURS } from '../config'; 
import { ZoneCombination } from '../models';

export function parseTimestamp(timestamp: string): Date {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid timestamp format: ${timestamp}`);
    }
    return date;
}

export function isPeakHours(date: Date): boolean {
    const day = date.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    let periods = [];
    if (day >= 1 && day <= 5) { // Weekday (Monday to Friday)
        periods = PEAK_HOURS.weekday;
    } else { // Weekend (Saturday and Sunday)
        periods = PEAK_HOURS.weekend;
    }

    for (const period of periods) {
        const [startHour, startMinute] = period.start.split(':').map(Number);
        const [endHour, endMinute] = period.end.split(':').map(Number);
        const startInMinutes = startHour * 60 + startMinute;
        const endInMinutes = endHour * 60 + endMinute;

        // Peak hours are inclusive of start time, exclusive of end time (common convention)
        if (timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes) {
            return true;
        }
    }
    return false;
}

export function getZoneCombination(fromZone: number, toZone: number): ZoneCombination {
    if (fromZone === toZone) {
        if (fromZone === 1) return '1-1';
        if (fromZone === 2) return '2-2';
    }
    if ((fromZone === 1 && toZone === 2) || (fromZone === 2 && toZone === 1)) {
        return '1-2_2-1';
    }
    throw new Error(`Invalid zone combination: ${fromZone}-${toZone}`);
}

export function getFormattedDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Calculates the ISO week number (YYYY-Wxx) for a given date.
 * Assumes week starts on Monday.
 * https://en.wikipedia.org/wiki/ISO_8601#Week_dates
 * @param date The date to get the week number for.
 * @returns A string in 'YYYY-Wxx' format.
 */
export function getWeekNumber(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // (Monday is 1, Sunday is 0. If Sunday, it's 0, so 0+4-0=4. Adjust to 0+4-7 = -3 for previous Monday)
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));

    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

/**
 * Gets the start of the ISO week (Monday, 00:00:00.000) for a given date.
 * @param date The date to find the start of its week for.
 * @returns A Date object representing the Monday at 00:00:00.000 for that week.
 */
export function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
}