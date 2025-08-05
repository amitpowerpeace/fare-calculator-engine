export interface Journey {
    id: string;
    timestamp: string;
    fromZone: number;
    toZone: number;
}

export interface CalculatedJourney extends Journey {
    initialFare: number;
    chargedFare: number;
    isPeakHours: boolean;
}
