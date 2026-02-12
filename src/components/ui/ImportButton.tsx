'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { importAttendance, importKm, importLifestyle, importWeighIn } from '@/actions/import-actions';

interface ImportButtonProps {
    type: 'attendance' | 'km' | 'lifestyle' | 'weigh-in';
    className?: string;
}

export function ImportButton({ type, className }: ImportButtonProps) {
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            switch (type) {
                case 'attendance':
                    await importAttendance(formData);
                    break;
                case 'km':
                    await importKm(formData);
                    break;
                case 'lifestyle':
                    await importLifestyle(formData);
                    break;
                case 'weigh-in':
                    await importWeighIn(formData);
                    break;
            }
            toast.success('Import successful');
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
