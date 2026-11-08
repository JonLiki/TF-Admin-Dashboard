import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/constants';
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    // Defense in depth: the proxy already gates these routes, but don't rely on it alone.
    if (!session?.user) redirect('/login');
    if (session.user.role !== UserRole.ADMIN) redirect('/user/dashboard');

    return (
        <div className="flex h-dvh overflow-hidden relative z-10">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-surface-ocean focus:p-3">Skip to content</a>
            {/* Fixed Sidebar */}
            <aside className="fixed inset-y-0 z-50">
                <Sidebar user={session?.user} />
            </aside>

            {/* Main Content Wrapper — padded for floating sidebar (w-64 + m-3 margins) */}
            <div className="flex-1 flex flex-col lg:pl-[17.5rem] h-full overflow-hidden w-full">
                <Breadcrumb />
                <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto bg-transparent scroll-smooth">
                    <div className="animate-page-enter">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

