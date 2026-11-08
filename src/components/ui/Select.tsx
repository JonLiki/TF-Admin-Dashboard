'use client';

import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption { value: string; label: string; disabled?: boolean }
export interface SelectProps {
    options: SelectOption[];
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    name?: string;
    label?: string;
    id?: string;
}

// Native selection provides keyboard navigation, typeahead and mobile pickers.
export function Select({ options, value, defaultValue, onChange, placeholder = 'Select an option',
    disabled, className, name, label, id }: SelectProps) {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    return (
        <div className={cn('relative', className)}>
            <label htmlFor={selectId} className="sr-only">{label ?? placeholder}</label>
            <select id={selectId} name={name} value={value} defaultValue={value === undefined ? defaultValue ?? '' : undefined}
                disabled={disabled} onChange={event => onChange?.(event.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-border bg-surface-ocean px-4 pr-10 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagoon disabled:cursor-not-allowed disabled:opacity-50">
                {!options.some(option => option.value === '') && <option value="" disabled>{placeholder}</option>}
                {options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/70" />
        </div>
    );
}
