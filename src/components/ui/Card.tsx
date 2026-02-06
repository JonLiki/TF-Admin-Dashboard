import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: 'default' | 'tongan';
}

export function Card({ children, className, variant = 'default', ...props }: CardProps) {
    return (
        <div
            className={cn(
                "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden",
                variant === 'tongan' && "border-t-[3px] border-t-tongan relative",
                className
            )}
            {...props}
        >
            {variant === 'tongan' && (
                <div className="absolute top-0 left-0 w-8 h-8 opacity-10 pointer-events-none" style={{ backgroundImage: "url('/patterns/lalava-knot.svg')" }} />
            )}
            {children}
        </div>
    );
}

export function CardHeader({ children, className, ...props }: CardProps) {
    return (
        <div className={cn("px-6 py-5 border-b border-gray-100", className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn("text-lg font-semibold text-gray-900", className)} {...props}>
            {children}
        </h3>
    );
}

export function CardContent({ children, className, ...props }: CardProps) {
    return (
        <div className={cn("p-6", className)} {...props}>
            {children}
        </div>
    );
}
