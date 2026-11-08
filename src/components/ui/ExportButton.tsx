'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { generateScoreboardPDF, generateScoreboardCSV, type ScoreboardExportData } from '@/lib/exportUtils';

export function ExportButton({ data, className }: { data: ScoreboardExportData; className?: string }) {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const download = async (format: 'pdf' | 'csv') => {
        setPending(true); setError(null);
        try {
            if (format === 'pdf') await generateScoreboardPDF(data); else await generateScoreboardCSV(data);
            toast.success('Report download started.'); setOpen(false);
        } catch { setError('Could not create the report. Please try again.'); }
        finally { setPending(false); }
    };
    return <div className={className}>
        <Button type="button" variant="secondary" aria-haspopup="dialog" aria-expanded={open} onClick={() => { setOpen(true); setError(null); }}>
            <Download className="mr-2 h-4 w-4" /> Export
        </Button>
        <Sheet isOpen={open} onClose={() => { if (!pending) setOpen(false); }} title="Export scoreboard">
            <div className="space-y-4">
                <p>Overall block standings for {data.standings.length} teams, plus saved Week {data.weekNumber} awards in the PDF.</p>
                <p className="text-sm text-foreground/80">Report date: {data.date}. CSV contains overall standings.</p>
                <div className="flex flex-wrap gap-2"><Button type="button" isLoading={pending} onClick={() => download('pdf')}>Download PDF</Button><Button type="button" variant="secondary" disabled={pending} onClick={() => download('csv')}>Download CSV</Button></div>
                {error && <p role="alert">{error}</p>}
            </div>
        </Sheet>
    </div>;
}
