'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <div className={cn("p-2 rounded-lg w-9 h-9", className)} />
        );
    }

    const cycleTheme = () => {
        if (theme === 'dark') setTheme('light');
        else if (theme === 'light') setTheme('system');
        else setTheme('dark');
    };

    const currentIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
    const label = theme === 'dark' ? 'Dark mode' : theme === 'light' ? 'Light mode' : 'System';

    return (
        <button
            onClick={cycleTheme}
            className={cn(
                "relative p-2 rounded-lg transition-all duration-200",
                "text-foreground/60 hover:text-foreground",
                "hover:bg-foreground/5",
                "focus:outline-none focus:ring-2 focus:ring-lagoon/50",
                className
            )}
            aria-label={`Theme: ${label}. Click to switch.`}
            title={label}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ y: -12, opacity: 0, rotate: -30 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 12, opacity: 0, rotate: 30 }}
                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                >
                    {(() => {
                        const Icon = currentIcon;
                        return <Icon className="w-5 h-5" />;
                    })()}
                </motion.div>
            </AnimatePresence>
        </button>
    );
}
