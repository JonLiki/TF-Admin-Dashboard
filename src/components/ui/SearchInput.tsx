'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    debounceMs?: number;
}

export function SearchInput({
    value,
    onChange,
    placeholder = 'Search...',
    className,
    debounceMs = 300
}: SearchInputProps) {
    const [internalValue, setInternalValue] = useState(value);

    // Sync internal value with external value
    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    // Debounce the onChange callback
    useEffect(() => {
        const timer = setTimeout(() => {
            onChange(internalValue);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [internalValue, onChange, debounceMs]);

    const handleClear = () => {
        setInternalValue('');
        onChange('');
    };

    return (
        <div className={cn("relative", className)}>
            {/* Search Icon */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
            </div>

            {/* Input */}
            <input
                type="text"
                value={internalValue}
                onChange={(e) => setInternalValue(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "w-full h-11 pl-10 pr-10 rounded-xl transition-all duration-200",
                    "bg-ocean-deep/50 border border-lagoon/20",
                    "text-white placeholder:text-lagoon-100/50",
                    "hover:border-lagoon/40",
                    "focus:outline-none focus:ring-2 focus:ring-lagoon/50 focus:border-lagoon/50",
                    "text-sm"
                )}
                aria-label={placeholder}
            />

            {/* Clear Button */}
            {internalValue && (
                <button
                    onClick={handleClear}
                    className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2",
                        "p-1 rounded-lg transition-colors duration-150",
                        "text-slate-400 hover:text-white hover:bg-white/10",
                        "focus:outline-none focus:ring-2 focus:ring-lagoon/50"
                    )}
                    aria-label="Clear search"
                    type="button"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
