import { getBlocks } from "@/actions/block-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { OceanWaves } from "@/components/ui/Patterns";
import { BlocksClientView } from "@/components/blocks/BlocksClientView";

export default async function BlocksPage() {
    const blocks = await getBlocks();

    return (
        <div className="min-h-full pb-10 relative">
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
                <OceanWaves />
            </div>

            <PageHeader title="Blocks" subtitle="Training Periods" />

            <div className="px-6 md:px-10 mt-6 relative z-10">
                <BlocksClientView blocks={blocks} />
            </div>
        </div>
    );
}
