'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { parseCSV } from '@/lib/csvParser';
import { importAttendance, importKm, importLifestyle, importWeighIn, getImportTemplate } from '@/actions/import-actions';

interface ImportButtonProps { type: 'attendance' | 'km' | 'lifestyle' | 'weigh-in'; className?: string; disabled?: boolean }
export function ImportButton({ type, className, disabled }: ImportButtonProps) {
    const [isImporting, setIsImporting] = useState(false);
    const [templatePending, setTemplatePending] = useState(false);
    const [preview, setPreview] = useState<{ file: File; rows: string[][] } | null>(null);
    const [feedback, setFeedback] = useState<{ success: boolean; message: string; issues?: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        try {
            const rows = parseCSV(await file.text());
            if (rows.length < 2) throw new Error('Add at least one data row beneath the column headers.');
            setFeedback(null);
            setPreview({ file, rows });
        } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not read this CSV.'); }
    };
    const importFile = async () => {
        if (!preview || isImporting || disabled) return;
        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', preview.file);
        try {
            const actions = { attendance: importAttendance, km: importKm, lifestyle: importLifestyle, 'weigh-in': importWeighIn };
            const result = await actions[type](formData);
            setFeedback(result);
            if (result.success) { toast.success(result.message); setPreview(null); }
        } catch { setFeedback({ success: false, message: 'Import failed. Your file is still selected; please try again.' }); }
        finally { setIsImporting(false); }
    };
    const downloadTemplate = async () => {
        setTemplatePending(true);
        try {
            const result = await getImportTemplate(type);
            if (!result.success) { toast.error(result.message); return; }
            const url = URL.createObjectURL(new Blob([result.data], { type: 'text/csv;charset=utf-8' }));
            const link = document.createElement('a');
            link.href = url; link.download = `${type}-template.csv`; link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch { toast.error('Could not download the template. Please try again.'); }
        finally { setTemplatePending(false); }
    };
    return <div className={className}>
        <input type="file" ref={fileInputRef} onChange={previewFile} accept=".csv" hidden />
        <Button type="button" disabled={disabled} title={disabled ? 'Save or discard your changes before importing' : undefined}
            variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} isLoading={isImporting}>
            <Upload className="h-4 w-4 mr-2" /> Import CSV
        </Button>
        <Sheet isOpen={!!preview || !!feedback} onClose={() => { if (!isImporting) { setPreview(null); setFeedback(null); } }} title="Review CSV import">
            {preview && <div className="space-y-4">
                <p className="font-semibold break-all">{preview.file.name}</p>
                <p className="text-sm">{preview.rows.length - 1} data rows, {preview.rows[0].length} columns. Showing the first 5 rows.</p>
                <p className="text-sm">Columns apply to matching dates or weeks throughout the active block, including weeks outside this screen. Matching saved entries are overwritten. Finalized weeks are skipped. Blank cells do not delete records.</p>
                <div className="overflow-auto max-h-80 rounded-lg border border-border" tabIndex={0} aria-label="CSV preview">
                    <table className="text-sm"><caption className="sr-only">File contents preview</caption><thead><tr>{preview.rows[0].map((cell, i) => <th key={i} scope="col" className="p-2 border-b border-border text-left whitespace-nowrap">{cell}</th>)}</tr></thead>
                        <tbody>{preview.rows.slice(1, 6).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="p-2 border-b border-border whitespace-nowrap">{cell}</td>)}</tr>)}</tbody>
                    </table>
                </div>
                <div className="flex flex-wrap gap-2"><Button type="button" onClick={importFile} isLoading={isImporting} disabled={disabled}>Import and update records</Button><Button type="button" variant="ghost" disabled={isImporting} onClick={() => { setPreview(null); setFeedback(null); }}>Cancel</Button></div>
            </div>}
            {feedback && <div className="mt-4 space-y-3">
                <p role={feedback.success ? 'status' : 'alert'}>{feedback.message}</p>
                {!!feedback.issues?.length && <div><h3 className="font-semibold">Rows needing attention</h3><ul className="list-disc pl-5 text-sm space-y-1">{feedback.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul></div>}
                {!preview && <Button type="button" onClick={() => setFeedback(null)}>Done</Button>}
            </div>}
            <div className="mt-6 border-t border-border pt-4 space-y-2"><p className="text-sm">Use the active block template and enter member names exactly as registered.</p><Button type="button" variant="secondary" isLoading={templatePending} onClick={downloadTemplate}>Download CSV template</Button></div>
        </Sheet>
        <button type="button" onClick={downloadTemplate} disabled={templatePending} className="block min-h-11 text-sm underline focus-visible:outline-2 focus-visible:outline-lagoon">{templatePending ? 'Preparing template...' : 'CSV template'}</button>
    </div>;
}
