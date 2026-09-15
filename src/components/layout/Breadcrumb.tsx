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
    Calendar,
    Dumbbell,
    LucideIcon
} from 'lucide-react';

const routeMap: Record<string, { label: string; icon: LucideIcon }> = {
    '/blocks': { label: 'Blocks', icon: Calendar },
    '/benchmarks': { label: 'Benchmarks', icon: Dumbbell },
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
    const parent = Object.keys(routeMap).find(path => path !== '/' && pathname.startsWith(`${path}/`));
    const route = routeMap[pathname] ?? (parent ? { ...routeMap[parent], label: `${routeMap[parent].label} / ${parent === '/members' ? 'Member details' : 'Team details'}` } : { label: 'Dashboard', icon: LayoutDashboard });
    const Icon = route.icon;

    return (
        <div className={cn(
            "lg:hidden relative flex items-center gap-2.5 min-h-16 px-4 py-3 pl-16",
            "bg-surface-deep/80 backdrop-blur-md border-b border-white/5",
            "sticky top-0 z-30",
            className
        )}>
            <Icon className="w-4 h-4 text-lagoon-100/70" />
            <span className="text-sm font-bold text-foreground tracking-tight">{route.label}</span>
            {/* Bottom gradient accent */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lagoon/20 to-transparent" />
        </div>
    );
}

