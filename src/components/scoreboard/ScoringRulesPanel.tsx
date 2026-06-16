import { PremiumCard } from "@/components/ui/PremiumCard";
import { Info, Medal, Scale, Heart, CalendarCheck, ChevronDown } from "lucide-react";

const categories = [
    { icon: Medal, label: "KM Average", desc: "Total kilometres logged ÷ team members" },
    { icon: Scale, label: "Weight Loss", desc: "Combined kilograms the team lost that week" },
    { icon: Heart, label: "Lifestyle Average", desc: "Lifestyle posts ÷ team members" },
    { icon: CalendarCheck, label: "Attendance Average", desc: "Sessions attended ÷ team members" },
];

const rules = [
    "Teams need at least 4 members to be eligible to win.",
    "Each week, the top eligible team in a category earns 1 point — the value must be above zero.",
    "Ties share the win: every tied team gets the point.",
    "Points lock in once a week is finalized; standings are the running total across the block.",
];

export function ScoringRulesPanel() {
    return (
        <PremiumCard variant="quiet" className="p-0">
            <details className="group/rules">
                <summary className="flex items-center gap-3 cursor-pointer list-none p-5 select-none">
                    <div className="p-2 bg-lagoon/10 rounded-lg border border-lagoon/20 shrink-0">
                        <Info className="w-5 h-5 text-lagoon-100" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-foreground tracking-tight">How scoring works</h3>
                        <p className="text-micro text-foreground/50 uppercase tracking-widest font-semibold mt-0.5">
                            4 categories · 1 point each per week
                        </p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-foreground/50 transition-transform duration-300 group-open/rules:rotate-180 shrink-0" />
                </summary>

                <div className="px-5 pb-5 pt-1 space-y-4">
                    <p className="text-sm text-foreground/70 leading-relaxed">
                        Every finalized week, teams compete across four categories. The top eligible team
                        in each earns one point — your overall standing is the running total.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {categories.map((c) => (
                            <div key={c.label} className="flex items-start gap-3 p-3 rounded-lg bg-ocean/20 border border-white/5">
                                <div className="p-1.5 rounded bg-lagoon/10 text-lagoon-100 shrink-0">
                                    <c.icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-foreground">{c.label}</p>
                                    <p className="text-micro text-foreground/50">{c.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <ul className="space-y-2">
                        {rules.map((r) => (
                            <li key={r} className="flex items-start gap-2.5 text-xs text-foreground/60 leading-relaxed">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-tongan shrink-0" />
                                <span>{r}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </details>
        </PremiumCard>
    );
}
