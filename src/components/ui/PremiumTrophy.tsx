import React from 'react';
import { cn } from '@/lib/utils';

interface PremiumTrophyProps {
    className?: string;
    variant?: 'gold' | 'silver' | 'bronze' | 'tongan';
}

export function PremiumTrophy({ className, variant = 'gold' }: PremiumTrophyProps) {
    const gradients = {
        gold: {
            base: ['#BF953F', '#FCF6BA', '#B38728', '#FBF5B7', '#AA771C'],
            glow: 'rgba(252, 246, 186, 0.5)',
        },
        silver: {
            base: ['#757F9A', '#D7DDE8', '#687389', '#E5EAF3', '#5D687A'],
            glow: 'rgba(215, 221, 232, 0.5)',
        },
        bronze: {
            base: ['#804A00', '#D48C46', '#663B00', '#E5A565', '#4D2C00'],
            glow: 'rgba(212, 140, 70, 0.5)',
        },
        tongan: {
            base: ['#8c0b1e', '#e61d3e', '#730919', '#f23554', '#590713'],
            glow: 'rgba(230, 29, 62, 0.5)',
        }
    };

    const gradientId = `premium-trophy-gradient-${variant}`;
    const highlightId = `premium-trophy-highlight-${variant}`;
    const shadowId = `premium-trophy-shadow-${variant}`;

    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("drop-shadow-lg", className)}
            style={{ filter: `drop-shadow(0 4px 12px ${gradients[variant].glow})` }}
        >
            <defs>
                <linearGradient id={gradientId} x1="20%" y1="0%" x2="80%" y2="100%">
                    <stop offset="0%" stopColor={gradients[variant].base[0]} />
                    <stop offset="30%" stopColor={gradients[variant].base[1]} />
                    <stop offset="50%" stopColor={gradients[variant].base[2]} />
                    <stop offset="70%" stopColor={gradients[variant].base[3]} />
                    <stop offset="100%" stopColor={gradients[variant].base[4]} />
                </linearGradient>

                <linearGradient id={highlightId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                    <stop offset="20%" stopColor="white" stopOpacity="0" />
                    <stop offset="80%" stopColor="white" stopOpacity="0" />
                    <stop offset="100%" stopColor="white" stopOpacity="0.4" />
                </linearGradient>

                <linearGradient id={shadowId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="black" stopOpacity="0" />
                    <stop offset="80%" stopColor="black" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="black" stopOpacity="0.5" />
                </linearGradient>

                <filter id={`inset-shadow-${variant}`}>
                    <feOffset dx="0" dy="2" />
                    <feGaussianBlur stdDeviation="3" result="offset-blur" />
                    <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                    <feFlood floodColor="black" floodOpacity="0.4" result="color" />
                    <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                    <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                </filter>
            </defs>

            {/* Base/Pedestal */}
            <path
                d="M30 85 L70 85 L75 95 L25 95 Z"
                fill={`url(#${gradientId})`}
                stroke="rgba(0,0,0,0.2)"
                strokeWidth="1"
            />
            <path
                d="M30 85 L70 85 L75 95 L25 95 Z"
                fill={`url(#${highlightId})`}
            />

            {/* Stem */}
            <path
                d="M45 65 L55 65 L57 85 L43 85 Z"
                fill={`url(#${gradientId})`}
            />
            <path
                d="M45 65 L55 65 L57 85 L43 85 Z"
                fill={`url(#${highlightId})`}
            />

            {/* Cup Bowl */}
            <path
                d="M20 20 C 20 50, 40 65, 50 65 C 60 65, 80 50, 80 20 Z"
                fill={`url(#${gradientId})`}
                filter={`url(#inset-shadow-${variant})`}
            />
            <path
                d="M20 20 C 20 50, 40 65, 50 65 C 60 65, 80 50, 80 20 Z"
                fill={`url(#${highlightId})`}
            />

            {/* Cup Lip */}
            <ellipse
                cx="50"
                cy="20"
                rx="30"
                ry="6"
                fill={`url(#${gradientId})`}
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="1"
            />
            
            <ellipse
                cx="50"
                cy="20"
                rx="27"
                ry="4"
                fill="rgba(0,0,0,0.3)"
            />

            {/* Left Handle */}
            <path
                d="M22 28 C 5 28, 5 45, 27 50 M25 34 C 12 34, 12 42, 28 45"
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="4"
                strokeLinecap="round"
            />
            
            {/* Right Handle */}
            <path
                d="M78 28 C 95 28, 95 45, 73 50 M75 34 C 88 34, 88 42, 72 45"
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="4"
                strokeLinecap="round"
            />

            {/* Shading Overlays */}
            <path
                d="M30 85 L70 85 L75 95 L25 95 Z M45 65 L55 65 L57 85 L43 85 Z M20 20 C 20 50, 40 65, 50 65 C 60 65, 80 50, 80 20 Z"
                fill={`url(#${shadowId})`}
                pointerEvents="none"
            />
        </svg>
    );
}

export default PremiumTrophy;
