import { getFullBlockSummary } from "@/actions/data";
import { PageHeader } from "@/components/ui/Components";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { OceanWaves } from "@/components/ui/Patterns";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

// If Tabs component doesn't exist, I'll create a local simple one or use standard state if client component.
// But this is a server page. I might need a client wrapper for tabs or just stack them.
// Let's stack them for now or use a client component for the report view.
// Actually, making the whole page client might be easier for tabs, but data fetching is server.
// I'll make a `SummaryReportView` client component and pass data to it.

import SummaryReportView from "./SummaryReportView";

export default async function SummaryPage() {
    const data = await getFullBlockSummary();

    if (!data) {
        return (
            <div className="p-10 text-center text-white">
                <h2 className="text-2xl font-bold">No Active Block Found</h2>
                <p className="text-white/60">Please activate a block to view the summary.</p>
            </div>
        );
    }

    return (
        <div className="min-h-full pb-10 relative">
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
                <OceanWaves />
            </div>

            <PageHeader title="Block Summary" subtitle="Weekly Performance Reports" />

            <div className="px-6 md:px-10 mt-6 relative z-10">
                <SummaryReportView
                    block={data.block}
                    members={data.members}
                    sessions={data.sessions}
                />
            </div>
        </div>
    );
}
