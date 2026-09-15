'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { importAttendance, importKm, importLifestyle, importWeighIn } from '@/actions/import-actions';

interface ImportButtonProps {
    type: 'attendance' | 'km' | 'lifestyle' | 'weigh-in';
    className?: string;
    disabled?: boolean;
}

export function ImportButton({ type, className, disabled }: ImportButtonProps) {
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const actions = { attendance: importAttendance, km: importKm, lifestyle: importLifestyle, 'weigh-in': importWeighIn };
            const result = await actions[type](formData);
            if (result.success) toast.success(result.message);
            else toast.error(result.message);
        } catch (error) {
            console.error('Import failed:', error);
            toast.error('Import failed');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className={className}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                style={{ display: 'none' }}
            />
            <Button
                type="button"
                disabled={disabled}
                title={disabled ? "Save your changes before importing" : undefined}
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isImporting}
            >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
            </Button>
        </div>
    );
}
