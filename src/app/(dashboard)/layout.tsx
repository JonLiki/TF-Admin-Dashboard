import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden relative z-10">
            {/* Fixed Sidebar */}
            <aside className="fixed inset-y-0 z-50">
                <Sidebar />
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col lg:pl-64 h-full overflow-hidden w-full">
                <Breadcrumb />
                <main className="flex-1 overflow-y-auto bg-transparent scroll-smooth">
                    <div className="animate-page-enter">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

