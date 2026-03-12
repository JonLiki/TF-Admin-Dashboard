'use client';

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button"; // Or from "@/components/ui/Components" if exported there
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubmitIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
}

export function SubmitIconButton({ icon, className, variant = 'secondary', ...props }: SubmitIconButtonProps) {
    const { pending } = useFormStatus();

    return (
        <Button 
            size="sm" 
            type="submit" 
            variant={variant} 
            disabled={pending || props.disabled}
            className={cn("h-10 w-10 p-0 rounded-lg flex items-center justify-center transition-all", className)}
            {...props}
        >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        </Button>
    );
}
