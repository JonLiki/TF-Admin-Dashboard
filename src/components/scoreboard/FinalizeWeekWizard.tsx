'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Lock,
    Unlock,
    Scale,
    Activity,
    Heart,
    CalendarCheck,
    ArrowRight,
    ShieldCheck,
    BarChart3,
} from 'lucide-react';
import { finalizeWeek, unfinalizeWeek, getWeekDataCompleteness } from '@/actions/block-actions';

interface FinalizeWeekWizardProps {
    weekId: string;
    weekNumber: number;
    isFinalized: boolean;
}

type WizardStep = 'check' | 'confirm' | 'done';

interface CompletenessData {
    weighIns: { entered: number; total: number };
    km: { entered: number; total: number };
    lifestyle: { entered: number; total: number };
    attendance: { sessionsWithData: number; totalSessions: number };
    isFinalized: boolean;
    weekNumber: number;
}

function getPercentage(entered: number, total: number) {
    if (total === 0) return 100;
    return Math.round((entered / total) * 100);
}

function getBarColor(pct: number) {
    if (pct >= 90) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
}

const categories = [
    { key: 'weighIns' as const, label: 'Weigh-ins', icon: Scale },
    { key: 'km' as const, label: 'KM Logs', icon: Activity },
    { key: 'lifestyle' as const, label: 'Lifestyle', icon: Heart },
];

export function FinalizeWeekWizard({ weekId, weekNumber, isFinalized: initialFinalized }: FinalizeWeekWizardProps) {
    const [step, setStep] = useState<WizardStep>('check');
    const [isPending, startTransition] = useTransition();
    const [completeness, setCompleteness] = useState<CompletenessData | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isFinalized, setIsFinalized] = useState(initialFinalized);

    const loadCompleteness = () => {
        setIsOpen(true);
        startTransition(async () => {
            const data = await getWeekDataCompleteness(weekId);
            if (data) {
                setCompleteness(data);
                setIsFinalized(data.isFinalized);
            }
        });
    };

    const handleFinalize = () => {
        startTransition(async () => {
            const result = await finalizeWeek(weekId);
            if (result.success) {
                setIsFinalized(true);
                setStep('done');
                setFeedback({ type: 'success', message: result.message });
            } else {
                setFeedback({ type: 'error', message: result.message });
            }
            setTimeout(() => setFeedback(null), 4000);
        });
    };

    const handleUnfinalize = () => {
        startTransition(async () => {
            const result = await unfinalizeWeek(weekId);
            if (result.success) {
                setIsFinalized(false);
                setStep('check');
                setFeedback({ type: 'success', message: result.message });
            } else {
                setFeedback({ type: 'error', message: result.message });
            }
            setTimeout(() => setFeedback(null), 4000);
        });
    };

    // If already finalized, show locked state
    if (isFinalized && !isOpen) {
        return (
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">Week {weekNumber} Finalized</span>
                </div>
                <Button
                    onClick={handleUnfinalize}
                    disabled={isPending}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs"
                >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5 mr-1.5" />}
                    Unfinalize
                </Button>
                <AnimatePresence>
                    {feedback && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                "text-xs font-medium",
                                feedback.type === 'success' ? "text-emerald-400" : "text-red-400"
                            )}
                        >
                            {feedback.message}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Not finalized — show wizard trigger or wizard steps
    if (!isOpen) {
        return (
            <Button
                onClick={loadCompleteness}
                disabled={isPending}
                className="bg-ocean hover:bg-ocean-deep text-white shadow-lg shadow-ocean/20"
            >
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                Finalize Week {weekNumber}
            </Button>
        );
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full"
            >
                <PremiumCard>
                    <div className="p-5 space-y-4">
                        {/* Step indicator */}
                        <div className="flex items-center gap-2 text-xs text-white/40">
                            <span className={cn("font-bold", step === 'check' ? "text-lagoon" : "text-white/30")}>1. Data Check</span>
                            <ArrowRight className="w-3 h-3" />
                            <span className={cn("font-bold", step === 'confirm' ? "text-lagoon" : "text-white/30")}>2. Confirm</span>
                            <ArrowRight className="w-3 h-3" />
                            <span className={cn("font-bold", step === 'done' ? "text-emerald-400" : "text-white/30")}>3. Done</span>
                        </div>

                        {/* Step 1: Data Check */}
                        {step === 'check' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-lagoon" />
                                    Week {weekNumber} Data Completeness
                                </h3>

                                {isPending || !completeness ? (
                                    <div className="flex items-center gap-2 text-white/50 text-sm py-4">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading data status...
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2.5">
                                            {categories.map((cat) => {
                                                const { entered, total } = completeness[cat.key];
                                                const pct = getPercentage(entered, total);
                                                return (
                                                    <div key={cat.key} className="flex items-center gap-3">
                                                        <cat.icon className="w-4 h-4 text-white/40 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs text-white/70">{cat.label}</span>
                                                                <span className={cn("text-xs font-mono font-bold", pct >= 90 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400")}>
                                                                    {entered}/{total}
                                                                </span>
                                                            </div>
                                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                <div className={cn("h-full rounded-full transition-all duration-500", getBarColor(pct))} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Attendance */}
                                            <div className="flex items-center gap-3">
                                                <CalendarCheck className="w-4 h-4 text-white/40 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs text-white/70">Attendance</span>
                                                        <span className={cn("text-xs font-mono font-bold",
                                                            getPercentage(completeness.attendance.sessionsWithData, completeness.attendance.totalSessions) >= 90 ? "text-emerald-400" : "text-amber-400"
                                                        )}>
                                                            {completeness.attendance.sessionsWithData}/{completeness.attendance.totalSessions} sessions
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all duration-500",
                                                                getBarColor(getPercentage(completeness.attendance.sessionsWithData, completeness.attendance.totalSessions))
                                                            )}
                                                            style={{ width: `${getPercentage(completeness.attendance.sessionsWithData, completeness.attendance.totalSessions)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Warning if incomplete */}
                                        {categories.some(c => getPercentage(completeness[c.key].entered, completeness[c.key].total) < 100) && (
                                            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                                <p className="text-xs text-amber-300">
                                                    Some data is incomplete. You can still finalize, but missing entries won&apos;t be included in calculations.
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 justify-end">
                                            <Button
                                                onClick={() => { setIsOpen(false); setStep('check'); }}
                                                className="bg-white/5 hover:bg-white/10 text-white/50 text-xs"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => setStep('confirm')}
                                                className="bg-lagoon hover:bg-lagoon/80 text-black font-semibold text-xs"
                                            >
                                                Continue <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Step 2: Confirm */}
                        {step === 'confirm' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-lagoon" />
                                    Confirm Finalization
                                </h3>

                                <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                                    <p className="text-xs text-white/70">This will:</p>
                                    <ul className="text-xs text-white/60 space-y-1.5 ml-4 list-disc">
                                        <li>Calculate team metrics (KM avg, weight loss, lifestyle, attendance)</li>
                                        <li>Determine and award weekly winners</li>
                                        <li>Update the point ledger</li>
                                        <li><strong className="text-white/80">Lock Week {weekNumber}</strong> from further data entry</li>
                                    </ul>
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                    <Button
                                        onClick={() => setStep('check')}
                                        className="bg-white/5 hover:bg-white/10 text-white/50 text-xs"
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleFinalize}
                                        disabled={isPending}
                                        className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold"
                                    >
                                        {isPending ? (
                                            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Finalizing...</>
                                        ) : (
                                            <><Lock className="w-3.5 h-3.5 mr-1.5" /> Finalize & Lock</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Done */}
                        {step === 'done' && (
                            <div className="text-center py-4 space-y-3">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                >
                                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                                </motion.div>
                                <h3 className="text-sm font-bold text-white">Week {weekNumber} Finalized!</h3>
                                <p className="text-xs text-white/50">Metrics calculated, winners awarded, and week locked.</p>
                                <Button
                                    onClick={() => { setIsOpen(false); }}
                                    className="bg-white/5 hover:bg-white/10 text-white/50 text-xs mt-2"
                                >
                                    Close
                                </Button>
                            </div>
                        )}
                    </div>
                </PremiumCard>

                {/* Feedback */}
                <AnimatePresence>
                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                "mt-2 text-xs font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5",
                                feedback.type === 'success' ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                            )}
                        >
                            {feedback.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {feedback.message}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}
