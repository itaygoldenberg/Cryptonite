export const REPORT_POLL_INTERVAL_MS = 1000;

const REPORT_CACHE_PREFIX = "reportsData:";
const LAST_REPORT_CACHE_KEY = "lastReportData";

export type ReportPoint = {
    time: string;
    [symbol: string]: string | number;
};

export function getChangeKey(symbol: string): string {
    return `__change_${symbol}`;
}

function getReportCacheKey(symbols: string[]): string {
    return REPORT_CACHE_PREFIX + [...symbols].sort().join(",");
}

function sanitizeReportData(data: ReportPoint[], symbols: string[]): ReportPoint[] {
    const cleanData: ReportPoint[] = [];

    data.forEach(point => {
        const cleanPoint: ReportPoint = { time: String(point.time ?? "") };

        symbols.forEach(symbol => {
            const value = point[symbol];
            if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return;

            cleanPoint[symbol] = value;

            const savedChange = point[getChangeKey(symbol)];
            if (typeof savedChange === "number" && Number.isFinite(savedChange)) {
                cleanPoint[getChangeKey(symbol)] = savedChange;
                return;
            }

            const previousPoint = [...cleanData].reverse()
                .find(previous => Number(previous[symbol]) > 0);
            const previousValue = previousPoint ? Number(previousPoint[symbol]) : 0;

            if (previousValue > 0) {
                cleanPoint[getChangeKey(symbol)] = ((value - previousValue) / previousValue) * 100;
            }
        });

        if (Object.keys(cleanPoint).length > 1) cleanData.push(cleanPoint);
    });

    return cleanData;
}

// Loads the exact report cache first, then falls back to the last saved report.
export function loadCachedReportData(symbols: string[]): ReportPoint[] {
    try {
        const exactRaw = localStorage.getItem(getReportCacheKey(symbols));

        if (exactRaw) {
            const exactData = JSON.parse(exactRaw);
            if (Array.isArray(exactData)) return sanitizeReportData(exactData, symbols);
        }

        const lastRaw = localStorage.getItem(LAST_REPORT_CACHE_KEY);
        if (!lastRaw) return [];

        const snapshot = JSON.parse(lastRaw);
        return Array.isArray(snapshot.data) ? sanitizeReportData(snapshot.data, symbols) : [];
    }
    catch {
        return [];
    }
}

// Saves the latest report so the chart remains useful after an API failure.
export function saveReportData(symbols: string[], data: ReportPoint[]): void {
    try {
        localStorage.setItem(getReportCacheKey(symbols), JSON.stringify(data));
        localStorage.setItem(LAST_REPORT_CACHE_KEY, JSON.stringify({
            savedAt: Date.now(),
            symbols,
            data
        }));
    }
    catch {
        return;
    }
}
