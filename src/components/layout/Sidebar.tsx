'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    UserPlus,
    Scale,
    Activity,
    Heart,
    CalendarCheck,
    Dumbbell,
    Trophy,
    FileText,
    Calendar,
    Menu,
    LogOut
} from 'lucide-react';
import { logout } from '@/actions/auth-actions';
import { motion } from 'framer-motion';
import { ThemeToggle } from '../ui/ThemeToggle';

import { TonganNgatu } from '../ui/Patterns';


interface NavItem {
    name: string;
    subtitle: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
    label: string;
    items: NavItem[];
}

const navSections: NavSection[] = [
    {
        label: 'OVERVIEW',
        items: [
            { name: 'Dashboard', subtitle: 'Overview', href: '/', icon: LayoutDashboard },
        ],
    },
    {
        label: 'DATA ENTRY',
        items: [
            { name: 'Teams', subtitle: 'Groups', href: '/teams', icon: Users },
            { name: 'Members', subtitle: 'Participants', href: '/members', icon: UserPlus },
            { name: 'Weigh-in', subtitle: 'Weekly Check', href: '/weigh-in', icon: Scale },
            { name: 'Km Logs', subtitle: 'Weekly KM', href: '/km', icon: Activity },
            { name: 'Lifestyle', subtitle: 'Habits', href: '/lifestyle', icon: Heart },
            { name: 'Attendance', subtitle: 'Sessions', href: '/attendance', icon: CalendarCheck },
        ],
    },
    {
        label: 'ANALYTICS',
        items: [
            { name: 'Benchmarks', subtitle: 'Progress', href: '/benchmarks', icon: Dumbbell },
            { name: 'Summary', subtitle: 'Reports', href: '/summary', icon: FileText },
            { name: 'Scoreboard', subtitle: 'Leaderboard', href: '/scoreboard', icon: Trophy },
            { name: 'Blocks', subtitle: 'Training Periods', href: '/blocks', icon: Calendar },
        ],
    },
];

export function Sidebar({ user }: { user?: { name?: string | null; email?: string | null } }) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 1024px)');
        const closeOnDesktop = () => { if (desktop.matches) setIsMobileMenuOpen(false); };
        desktop.addEventListener('change', closeOnDesktop);
        return () => desktop.removeEventListener('change', closeOnDesktop);
    }, []);

    const content = <>                {/* --- TONGAN WARRIOR VISUALS (CSS FALLBACK) --- */}

                {/* 1. Translucent Obsidian Base with Glass effect */}
                <div className="absolute inset-0 bg-obsidian/45 backdrop-blur-xl z-0" />

                {/* 2. Atmospheric Glow (Volcanic — Tongan red, the identity color) */}
                <div className="absolute bottom-[-10%] right-[-20%] w-[120%] h-[60%] bg-[radial-gradient(circle,rgba(197,0,0,0.08)_0%,transparent_70%)] blur-3xl z-0 pointer-events-none" />

                {/* 3. Warrior Silhouette Concept (Central Shadow) */}
                <div className="absolute inset-0 bg-gradient-to-t dark:from-black/40 dark:via-transparent dark:to-black/20 z-0 pointer-events-none" />

                {/* 4. Tapa Pattern Overlay */}
                <div className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay opacity-40">
                    <TonganNgatu opacity={0.3} />
                </div>

                <div className="hidden">
                    To&apos;a Fatalona &copy; 2026
                </div>

                {/* Brand Header */}
                <div className="min-h-24 shrink-0 flex items-center px-6 z-10 border-b border-tapa-brown/20 bg-ocean-deep/90 backdrop-blur-sm relative">
                    <div className="flex items-center space-x-3">
                        <div className="relative group/brand">
                            {/* Pulsing glow ring */}
                            <div className="absolute -inset-1 rounded-lg bg-tongan/30 blur-md breathing-glow" />
                            <div className="relative w-10 h-10 rounded-lg bg-tongan shadow-lg shadow-tongan/30 flex items-center justify-center text-white font-bold transform -rotate-1 border border-tapa/30">
                                TF
                            </div>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-none tracking-tight font-display text-gradient">TO&apos;A FATALONA</h1>
                            <p className="text-xs text-foreground/60 font-bold tracking-[0.2em] uppercase mt-1.5 opacity-80">Team Admin</p>
                        </div>
                    </div>
                </div>

                <nav className="min-h-0 flex-1 px-3 py-4 overflow-y-auto z-10 custom-scrollbar">
                    {navSections.map((section, sectionIndex) => (
                        <div key={section.label} className={cn(sectionIndex > 0 && "mt-4")}>
                            {/* Section Divider Label */}
                            <div className="flex items-center gap-2 px-4 mb-2">
                                <span className="text-xs font-bold text-foreground/50 uppercase tracking-[0.2em]">{section.label}</span>
                                <div className="flex-1 h-px bg-gradient-to-r from-white/5 to-transparent" />
                            </div>

                            <div className="space-y-0.5">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`));
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            aria-current={isActive ? 'page' : undefined}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn(
                                                "group relative flex items-center px-4 py-3 rounded-lg transition-all duration-200 ease-out overflow-hidden my-0.5",
                                                isActive
                                                    ? "text-foreground"
                                                    : "text-tapa-cream/70 hover:bg-ocean-light/10 hover:text-foreground"
                                            )}
                                        >
                                            {/* Active State Background Animation */}
                                            {isActive && (
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-tongan/20 via-tongan/5 to-transparent border-r-2 border-tongan shadow-[inset_0_0_12px_rgba(200,16,46,0.15)]"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                            )}

                                            {/* Hover Glow Effect (Only applied when not active) */}
                                            {!isActive && (
                                                <div className="absolute inset-0 bg-lagoon/0 group-hover:bg-lagoon/5 transition-colors duration-300" />
                                            )}

                                            {isActive && (
                                                <motion.div
                                                    initial={{ opacity: 0, scaleY: 0 }}
                                                    animate={{ opacity: 1, scaleY: 1 }}
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-tongan rounded-r-sm shadow-[0_0_12px_#C8102E,0_0_4px_#C8102E]"
                                                />
                                            )}

                                            <div className="relative z-10 flex items-center w-full">
                                                <motion.div
                                                    whileHover={{ scale: isActive ? 1 : 1.1, rotate: isActive ? 0 : 5 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                                >
                                                    <item.icon
                                                        className={cn(
                                                            "mr-3 h-5 w-5 transition-colors duration-200 block",
                                                            isActive ? "text-tongan drop-shadow-[0_0_8px_rgba(200,16,46,0.6)]" : "text-foreground/60 group-hover:text-lagoon-100"
                                                        )}
                                                    />
                                                </motion.div>
                                                <div className="flex flex-col">
                                                    <span className={cn("text-sm font-bold tracking-wide", isActive ? "text-foreground" : "text-offwhite/80 group-hover:text-lagoon-100")}>
                                                        {item.name}
                                                    </span>
                                                    <span className={cn(
                                                        "text-xs tracking-wider uppercase transition-colors font-medium",
                                                        isActive ? "text-foreground/80" : "text-foreground/70 group-hover:text-foreground/80"
                                                    )}>
                                                        {item.subtitle}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User Profile Footer */}
                <div className="p-3 border-t border-border bg-surface-ocean z-10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center px-2 py-2 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5 flex-1 min-w-0">
                        <div className="relative shrink-0">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-tongan to-red-900 flex items-center justify-center text-white font-bold text-xs shadow-lg ring-2 ring-white/10 group-hover:ring-white/30 transition-all">
                                {(user?.name || user?.email || 'A')[0].toUpperCase()}
                            </div>
                            {/* Online status dot */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-obsidian shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-bold text-offwhite group-hover:text-sand transition-colors truncate">{user?.name || 'Administrator'}</p>
                            <p className="text-xs text-offwhite/60 group-hover:opacity-100 truncate">{user?.email || 'Signed in'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <ThemeToggle />
                        <form action={logout}>
                            <button
                                type="submit"
                                className="p-2 rounded-lg text-foreground/60 hover:text-red-400 hover:bg-white/5 transition-colors"
                                aria-label="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
</>;
    return (
        <>
            <button type="button" onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden fixed top-2 left-3 z-50 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-ocean border border-border focus-visible:outline-2 focus-visible:outline-lagoon"
                aria-label="Open navigation" aria-expanded={isMobileMenuOpen} aria-haspopup="dialog">
                <Menu className="h-6 w-6" />
            </button>
            <div className="hidden lg:flex flex-col relative overflow-hidden w-64 m-3 rounded-2xl border border-border bg-surface-deep h-[calc(100dvh-1.5rem)]">
                {content}
            </div>
            <Sheet isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} title="Navigation" side="left">
                <div className="flex flex-col relative">{content}</div>
            </Sheet>
        </>
    );
}
