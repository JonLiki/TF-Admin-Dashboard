import { Sidebar } from "@/components/layout/Sidebar";
import { TonganNgatu } from "@/components/ui/Patterns";

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
                {/* 
            We remove the fixed top header from previous layout if it exists in layout.tsx 
            and move header logic to page components or a shared TopBar component if preferred.
            For now, let's keep the main scrolling area simple.
         */}
                <main className="flex-1 overflow-y-auto bg-transparent scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    );
}
