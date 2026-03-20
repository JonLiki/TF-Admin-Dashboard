import { LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/auth";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col relative z-10 w-full overflow-hidden">
            {/* Minimal Top Navigation for Participants */}
            <header className="h-16 w-full border-b border-ocean/20 bg-ocean-deep/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tongan to-tongan-dark text-white font-black flex items-center justify-center uppercase shadow-lg shadow-tongan/20">
                        TF
                    </div>
                    <span className="font-bold text-lg text-white tracking-widest uppercase">Challenge</span>
                </div>
                
                <form action={async () => {
                    'use server';
                    await signOut({ redirectTo: '/login' });
                }}>
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-tapa hover:text-white bg-ocean/20 hover:bg-ocean/40 rounded-lg transition-colors border border-white/5">
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </form>
            </header>

            {/* Main Participant Content Area */}
            <main className="flex-1 overflow-y-auto bg-transparent scroll-smooth w-full">
                <div className="animate-page-enter max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
