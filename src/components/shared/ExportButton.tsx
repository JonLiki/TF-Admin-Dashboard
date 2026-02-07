'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Components';
import { Download, FileDown } from 'lucide-react';
import { exportBlockData } from '@/actions/export-actions';
import { toast } from 'sonner';

interface ExportButtonProps {
    blockId: string;
    type: 'attendance' | 'km' | 'lifestyle' | 'weigh-in';
    className?: string;
}

export function ExportButton({ blockId, type, className }: ExportButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = async () => {
        try {
            setIsLoading(true);
            const csvData = await exportBlockData(blockId, type);

            // Create a blob and download it
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}-export-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully`);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export data');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            isLoading={isLoading}
            className={className}
        >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
        </Button>
    );
}
