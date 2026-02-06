'use client';

import { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateScoreboardPDF, generateScoreboardCSV, ScoreboardExportData } from '@/lib/exportUtils';

interface ExportButtonProps {
    data: ScoreboardExportData;
    className?: string;
}

export function ExportButton({ data, className }: ExportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (format: 'pdf' | 'csv') => {
        setIsExporting(true);
        setIsOpen(false);

        try {
            if (format === 'pdf') {
                generateScoreboardPDF(data);
            } else {
                generateScoreboardCSV(data);
            }
        } catch (error) {
            console.error('Export failed:', error);
            // Could add toast notification here
        } finally {
            setTimeout(() => setIsExporting(false), 1000);
        }
    };

    return (
        <div className={cn("relative", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExporting}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200",
                    "bg-[#0B3C5D] text-white hover:bg-[#0E4D75]",
                    "border border-white/10 shadow-sm",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "focus:outline-none focus:ring-2 focus:ring-lagoon/50"
                )}
            >
                <Download className={cn(
                    "w-4 h-4",
                    isExporting && "animate-bounce"
                )} />
                <span className="text-sm font-medium">
                    {isExporting ? 'Exporting...' : 'Export'}
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className={cn(
                        "absolute right-0 mt-2 w-48 z-50",
                        "bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl",
                        "py-1",
                        "animate-in fade-in-0 zoom-in-95 duration-200"
                    )}>
                        <button
                            onClick={() => handleExport('pdf')}
                            className={cn(
                                "w-full px-4 py-2.5 text-left flex items-center gap-3",
                                "text-white hover:bg-[#12394D] transition-colors duration-150"
                            )}
                        >
                            <FileText className="w-4 h-4 text-lagoon-100" />
                            <div>
                                <div className="text-sm font-medium">Download PDF</div>
                                <div className="text-xs text-slate-400">Formatted report</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleExport('csv')}
                            className={cn(
                                "w-full px-4 py-2.5 text-left flex items-center gap-3",
                                "text-white hover:bg-[#12394D] transition-colors duration-150"
                            )}
                        >
                            <Table className="w-4 h-4 text-lagoon-100" />
                            <div>
                                <div className="text-sm font-medium">Download CSV</div>
                                <div className="text-xs text-slate-400">Raw data</div>
                            </div>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
