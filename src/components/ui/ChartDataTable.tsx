import { cn } from '@/lib/utils';

export function ChartDataTable({ rows, columns, caption, className }: {
    rows: readonly object[]; columns: { key: string; label: string }[]; caption: string; className?: string;
}) {
    return <details className={cn('mt-4 rounded-xl border border-border bg-surface-ocean', className)}>
        <summary className="min-h-11 cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-lagoon">View chart data</summary>
        <div className="max-h-80 overflow-auto px-4 pb-4" tabIndex={0} aria-label={caption}>
            <table className="w-full text-left text-sm">
                <caption className="pb-3 text-left text-foreground/80">{caption}</caption>
                <thead><tr>{columns.map(column => <th key={column.key} scope="col" className="whitespace-nowrap border-b border-border p-2">{column.label}</th>)}</tr></thead>
                <tbody>{rows.map((row, index) => <tr key={index}>{columns.map(column => {
                    const value = (row as Record<string, unknown>)[column.key];
                    return <td key={column.key} className="whitespace-nowrap border-b border-border p-2 tabular-nums">{value === null || value === undefined ? 'Not recorded' : typeof value === 'number' ? value.toLocaleString('en-NZ', { maximumFractionDigits: 2 }) : String(value)}</td>;
                })}</tr>)}</tbody>
            </table>
            {!rows.length && <p className="py-3 text-sm">No measurements recorded for this period.</p>}
        </div>
    </details>;
}
