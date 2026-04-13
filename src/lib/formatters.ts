/**
 * Number formatting utilities using Intl.NumberFormat
 * Provides locale-aware formatting for different metric types
 */

const decimalFormatter = new Intl.NumberFormat('en-NZ', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

const twoDecimalFormatter = new Intl.NumberFormat('en-NZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat('en-NZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-NZ', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

/**
 * Format a number with 1 decimal place (e.g., "82.5")
 */
export function formatDecimal(value: number): string {
    return decimalFormatter.format(value);
}

/**
 * Format a number with 2 decimal places (e.g., "12.50")
 */
export function formatTwoDecimals(value: number): string {
    return twoDecimalFormatter.format(value);
}

/**
 * Format an integer (e.g., "1,234")
 */
export function formatInteger(value: number): string {
    return integerFormatter.format(value);
}

/**
 * Format a percentage from a decimal (0.85 → "85%")
 */
export function formatPercent(value: number): string {
    return percentFormatter.format(value / 100);
}

/**
 * Format a weight delta with sign (e.g., "-2.3" or "+1.5")
 */
export function formatDelta(value: number): string {
    const sign = value > 0 ? '+' : '';
    return `${sign}${decimalFormatter.format(value)}`;
}

/**
 * Format a number with appropriate unit suffix
 */
export function formatWithUnit(value: number, unit: string, decimals = 1): string {
    const formatter = new Intl.NumberFormat('en-NZ', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    return `${formatter.format(value)} ${unit}`;
}
