'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
    X,
    LogOut
} from 'lucide-react';
import { logout } from '@/actions/auth-actions';
import { motion } from 'framer-motion';
import { ThemeToggle } from '../ui/ThemeToggle';

import { TonganNgatu } from '../ui/Patterns';
import { usePreventBrowserSave } from '@/hooks/useKeyboardShortcut';

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

export function Sidebar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Prevent Ctrl+S from opening browser Save dialog
    usePreventBrowserSave();

    return (
        <>
            {/* Hamburger Menu Button (Mobile Only) */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={cn(
                    "lg:hidden fixed top-4 left-4 z-50",
                    "p-2.5 rounded-xl transition-all duration-200",
                    "bg-surface-ocean border border-white/10",
                    "hover:bg-ocean/20 hover:border-white/20",
                    "shadow-lg hover:shadow-xl",
                    "focus:outline-none focus:ring-2 focus:ring-lagoon/50"
                )}
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
            >
                {isMobileMenuOpen ? (
                    <X className="w-6 h-6 text-foreground" />
                ) : (
                    <Menu className="w-6 h-6 text-foreground" />
                )}
            </button>

            {/* Backdrop Overlay (Mobile Only) */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "flex flex-col bg-obsidian/45 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.6)] relative overflow-hidden",
                // Desktop: floating island with margins and rounded corners
                "lg:m-3 lg:rounded-2xl lg:border lg:border-white/10 lg:h-[calc(100vh-1.5rem)]",
                // Mobile: full-height fixed panel
                "h-full border-r border-white/10 lg:border-r-0",
                "fixed inset-y-0 left-0 z-50 w-64",
                "transform transition-transform duration-300 ease-in-out",
                "lg:translate-x-0 lg:static lg:z-auto",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* --- TONGAN WARRIOR VISUALS (CSS FALLBACK) --- */}

                {/* 1. Translucent Obsidian Base with Glass effect */}
                <div className="absolute inset-0 bg-obsidian/45 backdrop-blur-xl z-0" />

                {/* 2. Atmospheric Glows (Bioluminescence & Volcanic) */}
                <div className="absolute top-[-10%] left-[-20%] w-[150%] h-[50%] bg-[radial-gradient(circle,rgba(102,252,241,0.15)_0%,transparent_70%)] blur-3xl z-0 pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-20%] w-[120%] h-[60%] bg-[radial-gradient(circle,rgba(197,0,0,0.1)_0%,transparent_70%)] blur-3xl z-0 pointer-events-none" />

                {/* 3. Warrior Silhouette Concept (Central Shadow) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-0 pointer-events-none" />

                {/* 4. Tapa Pattern Overlay */}
                <div className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay opacity-20">
                    <TonganNgatu opacity={0.3} />
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-[10px] text-foreground/40 text-center font-mono">
                    To&apos;a Fatalona &copy; 2026
                </div>

                {/* Brand Header */}
                <div className="h-24 flex items-center px-6 z-10 border-b border-tapa-brown/20 bg-ocean-deep/90 backdrop-blur-sm relative">
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
                            <p className="text-[10px] text-foreground/60 font-bold tracking-[0.2em] uppercase mt-1.5 opacity-80">Admin Command</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 overflow-y-auto z-10 custom-scrollbar">
                    {navSections.map((section, sectionIndex) => (
                        <div key={section.label} className={cn(sectionIndex > 0 && "mt-4")}>
                            {/* Section Divider Label */}
                            <div className="flex items-center gap-2 px-4 mb-2">
                                <span className="text-[9px] font-bold text-foreground/50 uppercase tracking-[0.2em]">{section.label}</span>
                                <div className="flex-1 h-px bg-gradient-to-r from-white/5 to-transparent" />
                            </div>

                            <div className="space-y-0.5">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
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
                                                    layoutId="sidebarActive"
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
                                                    <span className={cn("text-xs font-bold tracking-wide", isActive ? "text-foreground" : "text-offwhite/80 group-hover:text-lagoon-100")}>
                                                        {item.name}
                                                    </span>
                                                    <span className={cn(
                                                        "text-micro tracking-wider uppercase transition-colors font-medium",
                                                        isActive ? "text-foreground/80" : "text-foreground/50 group-hover:text-foreground/60"
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
                <div className="p-4 border-t border-white/5 bg-black/20 z-10 flex items-center justify-between gap-2">
                    <div className="flex items-center px-2 py-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/5 flex-1 min-w-0">
                        <div className="relative shrink-0">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-tongan to-red-900 flex items-center justify-center text-white font-bold text-xs shadow-lg ring-2 ring-white/10 group-hover:ring-white/30 transition-all">
                                A
                            </div>
                            {/* Online status dot */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-obsidian shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-bold text-offwhite group-hover:text-sand transition-colors truncate">Administrator</p>
                            <p className="text-[10px] text-offwhite/60 group-hover:opacity-100 truncate">admin@toafatalona.com</p>
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
            </div>
        </>
    );
}

