'use client';

import { Select } from './Select';
import { Button } from './Button';
export type EntryFilter = 'all' | 'missing' | 'recorded' | 'edited' | 'errors';
export function EntryFilters({ value, onChange, errorCount, onShowErrors }: {
    value: EntryFilter; onChange: (filter: EntryFilter) => void; errorCount: number; onShowErrors: () => void;
}) {
    return <>
        <Select label="Filter entry status" value={value} onChange={value => onChange(value as EntryFilter)}
            className="w-full sm:w-48" options={[
                { value: 'all', label: 'All members' }, { value: 'missing', label: 'Missing entries' },
                { value: 'recorded', label: 'Recorded entries' }, { value: 'edited', label: 'Unsaved changes' },
                { value: 'errors', label: 'Needs correction' },
            ]} />
        {errorCount > 0 && <Button type="button" variant="danger" onClick={onShowErrors}>Show {errorCount} errors</Button>}
    </>;
}
