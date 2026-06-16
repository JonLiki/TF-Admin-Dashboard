/**
 * Team series colors for multi-line and radar charts.
 *
 * Defined as CSS custom properties (not raw hex) so chart series adapt to the
 * active light/dark theme. The single source of truth for these colors lives in
 * the design tokens in `globals.css` (`:root` and `.dark`).
 */
export const CHART_SERIES = [
    'var(--color-lagoon)',
    'var(--color-tongan)',
    'var(--color-ocean-light)',
    'var(--color-steel)',
    'var(--color-cyan-dim)',
];
