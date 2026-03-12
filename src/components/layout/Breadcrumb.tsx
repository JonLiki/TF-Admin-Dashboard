'use client';

import { usePathname } from 'next/navigation';
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
    FileText,
    LucideIcon
} from 'lucide-react';

const routeMap: Record<string, { label: string; icon: LucideIcon }> = {
    '/': { label: 'Dashboard', icon: LayoutDashboard },
    '/teams': { label: 'Teams', icon: Users },
    '/members': { label: 'Members', icon: UserPlus },
    '/weigh-in': { label: 'Weigh-in', icon: Scale },
    '/km': { label: 'KM Logs', icon: Activity },
    '/lifestyle': { label: 'Lifestyle', icon: Heart },
    '/attendance': { label: 'Attendance', icon: CalendarCheck },
    '/summary': { label: 'Summary', icon: FileText },
    '/scoreboard': { label: 'Scoreboard', icon: Trophy },
};

export function Breadcrumb({ className }: { className?: string }) {
    const pathname = usePathname();
    const route = routeMap[pathname] ?? { label: 'Page', icon: LayoutDashboard };
    const Icon = route.icon;

    return (
        <div className={cn(
            "lg:hidden flex items-center gap-2.5 px-4 py-3 pl-16",
            "bg-surface-deep/80 backdrop-blur-md border-b border-white/5",
            "sticky top-0 z-30",
            className
        )}>
            <Icon className="w-4 h-4 text-lagoon-100/70" />
            <span className="text-sm font-bold text-white tracking-tight">{route.label}</span>
        </div>
    );
}
