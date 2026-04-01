'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = getPageNumbers(currentPage, totalPages);

    return (
        <div className={cn("flex items-center justify-center gap-1.5 py-4", className)}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-lagoon-100/60 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Previous page"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {pages.map((page, i) =>
                page === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-lagoon-100/40 text-sm select-none">
                        ...
                    </span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page as number)}
                        className={cn(
                            "min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-all duration-200",
                            currentPage === page
                                ? "bg-lagoon/20 text-white border border-lagoon/40 shadow-[0_0_10px_-4px_rgba(28,114,147,0.4)]"
                                : "text-lagoon-100/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-lagoon-100/60 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Next page"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 3) return [1, 2, 3, 4, '...', total];
    if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
}
