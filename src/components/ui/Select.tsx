'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps {
    options: SelectOption[];
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    name?: string;
}

export function Select({
    options,
    value: controlledValue,
    defaultValue,
    onChange,
    placeholder = 'Select an option',
    disabled = false,
    className,
    name
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(controlledValue || defaultValue || '');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Use controlled value if provided
    const currentValue = controlledValue !== undefined ? controlledValue : selectedValue;
    const selectedOption = options.find(opt => opt.value === currentValue);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setFocusedIndex(-1);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                    setFocusedIndex(options.findIndex(opt => opt.value === currentValue));
                } else if (focusedIndex >= 0) {
                    handleSelect(options[focusedIndex].value);
                }
                break;

            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setFocusedIndex(-1);
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                    setFocusedIndex(0);
                } else {
                    setFocusedIndex(prev =>
                        prev < options.length - 1 ? prev + 1 : prev
                    );
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (isOpen) {
                    setFocusedIndex(prev => prev > 0 ? prev - 1 : 0);
                }
                break;

            case 'Home':
                e.preventDefault();
                if (isOpen) {
                    setFocusedIndex(0);
                }
                break;

            case 'End':
                e.preventDefault();
                if (isOpen) {
                    setFocusedIndex(options.length - 1);
                }
                break;
        }
    };

    const handleSelect = (value: string) => {
        if (controlledValue === undefined) {
            setSelectedValue(value);
        }
        onChange?.(value);
        setIsOpen(false);
        setFocusedIndex(-1);
    };

    // Scroll focused option into view
    useEffect(() => {
        if (isOpen && focusedIndex >= 0 && dropdownRef.current) {
            const focusedElement = dropdownRef.current.children[focusedIndex] as HTMLElement;
            if (focusedElement) {
                focusedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [focusedIndex, isOpen]);

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            {/* Hidden input for form submission */}
            {name && <input type="hidden" name={name} value={currentValue} />}

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={cn(
                    "flex items-center justify-between w-full px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200",
                    "bg-ocean-deep border border-white/10 text-white",
                    "hover:bg-white/5 hover:border-white/20",
                    "focus:outline-none focus:ring-2 focus:ring-lagoon/50 focus:border-lagoon/50",
                    disabled && "opacity-50 cursor-not-allowed",
                    isOpen && "border-lagoon/50 ring-2 ring-lagoon/50"
                )}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby="select-label"
            >
                <span className={cn(
                    "truncate",
                    !selectedOption && "text-slate-400"
                )}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 ml-2 transition-transform duration-200 text-slate-400",
                        isOpen && "transform rotate-180"
                    )}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className={cn(
                        "absolute z-50 w-full mt-2 py-1 rounded-xl",
                        "bg-ocean-deep border border-white/10 shadow-2xl",
                        "max-h-[300px] overflow-auto",
                        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20",
                        "animate-in fade-in-0 zoom-in-95 duration-200"
                    )}
                    role="listbox"
                    aria-labelledby="select-label"
                >
                    {options.map((option, index) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => !option.disabled && handleSelect(option.value)}
                            disabled={option.disabled}
                            className={cn(
                                "w-full px-4 py-2.5 text-sm text-left flex items-center justify-between transition-colors duration-150",
                                "text-white hover:bg-ocean",
                                option.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
                                focusedIndex === index && "bg-ocean",
                                currentValue === option.value && "bg-ocean/50"
                            )}
                            role="option"
                            aria-selected={currentValue === option.value}
                            aria-disabled={option.disabled}
                        >
                            <span className="truncate">{option.label}</span>
                            {currentValue === option.value && (
                                <Check className="w-4 h-4 ml-2 text-lagoon-100 flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
