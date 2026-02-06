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
    Trophy,
    Menu,
    X,
    LogOut
} from 'lucide-react';
import { logout } from '@/actions/auth-actions';

import { OceanWaves, TonganNgatu } from '../ui/Patterns';

const navItems = [
    { name: 'Dashboard', subtitle: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Teams', subtitle: 'Groups', href: '/teams', icon: Users },
    { name: 'Members', subtitle: 'Participants', href: '/members', icon: UserPlus },
    { name: 'Weigh-in', subtitle: 'Weekly Check', href: '/weigh-in', icon: Scale },
    { name: 'Km Logs', subtitle: 'Weekly KM', href: '/km', icon: Activity },
    { name: 'Lifestyle', subtitle: 'Habits', href: '/lifestyle', icon: Heart },
    { name: 'Attendance', subtitle: 'Sessions', href: '/attendance', icon: CalendarCheck },
    { name: 'Scoreboard', subtitle: 'Leaderboard', href: '/scoreboard', icon: Trophy },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Hamburger Menu Button (Mobile Only) */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={cn(
                    "lg:hidden fixed top-4 left-4 z-50",
                    "p-2.5 rounded-xl transition-all duration-200",
                    "bg-[#0A1F2E] border border-white/10",
                    "hover:bg-[#0E2A3E] hover:border-white/20",
                    "shadow-lg hover:shadow-xl",
                    "focus:outline-none focus:ring-2 focus:ring-lagoon/50"
                )}
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
            >
                {isMobileMenuOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <Menu className="w-6 h-6 text-white" />
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
                "flex flex-col h-full bg-ocean-deep border-r border-white/5 shadow-2xl relative overflow-hidden",
                // Mobile: fixed, slide in from left
                "fixed inset-y-0 left-0 z-50 w-64",
                "transform transition-transform duration-300 ease-in-out",
                "lg:translate-x-0 lg:static lg:z-auto",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Tapa Pattern Overlay */}
                <div className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay opacity-10">
                    <TonganNgatu opacity={0.15} />
                </div>

                {/* Brand Header */}
                <div className="h-24 flex items-center px-6 z-10 border-b border-tapa-brown/20 bg-ocean-deep/90 backdrop-blur-sm relative">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-tongan shadow-lg shadow-tongan/30 flex items-center justify-center text-white font-bold transform -rotate-1 border border-tapa/30">
                            TF
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-offwhite leading-none tracking-tight font-sans">TO'A FATALONA</h1>
                            <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-1.5 opacity-80">Admin Command</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto z-10 custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "group relative flex items-center px-4 py-3 rounded-lg transition-all duration-200 ease-out",
                                    isActive
                                        ? "bg-gradient-to-r from-tongan/10 to-transparent border-r-2 border-tongan text-white"
                                        : "text-tapa-cream/70 hover:bg-ocean-light/10 hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-tongan rounded-r-sm shadow-[0_0_8px_#C8102E]" />
                                )}

                                <item.icon
                                    className={cn(
                                        "mr-3 h-5 w-5 transition-colors duration-200",
                                        isActive ? "text-tongan" : "text-slate-400 group-hover:text-[#E6F3F7]"
                                    )}
                                />
                                <div className="flex flex-col">
                                    <span className={cn("text-sm font-medium tracking-wide", isActive ? "text-white" : "text-offwhite/80 group-hover:text-[#E6F3F7]")}>
                                        {item.name}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] tracking-wider uppercase transition-colors font-normal",
                                        isActive ? "text-slate-400" : "text-slate-500 group-hover:text-slate-400"
                                    )}>
                                        {item.subtitle}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20 z-10 flex items-center justify-between">
                    <div className="flex items-center px-2 py-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/5 flex-1 mr-2">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-tongan to-red-900 flex items-center justify-center text-white font-bold text-xs shadow-lg ring-2 ring-white/10 group-hover:ring-white/30 transition-all shrink-0">
                            A
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-bold text-offwhite group-hover:text-sand transition-colors truncate">Administrator</p>
                            <p className="text-[10px] text-offwhite/60 group-hover:opacity-100 truncate">admin@toafatalona.com</p>
                        </div>
                    </div>

                    <form action={logout}>
                        <button
                            type="submit"
                            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                            aria-label="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
