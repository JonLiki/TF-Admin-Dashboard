'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/Components';
import { cn } from '@/lib/utils';
import {
    Plus,
    Calendar,
    Loader2,
    Zap,
    ZapOff,
    Trash2,
    X,
    CheckCircle2,
    AlertTriangle,
    Layers,
} from 'lucide-react';
import { createBlock, activateBlock, deactivateBlock, deleteBlock } from '@/actions/block-actions';
import { format } from 'date-fns';

interface BlockWeekSlim {
    id: string;
    weekNumber: number;
    startDate: Date | string;
    endDate: Date | string;
}

interface BlockData {
    id: string;
    name: string;
    startDate: Date | string;
    endDate: Date | string;
    isActive: boolean;
    createdAt: Date | string;
    _count: { weeks: number; sessions: number };
    weeks: BlockWeekSlim[];
}

interface BlocksClientViewProps {
    blocks: BlockData[];
}

export function BlocksClientView({ blocks }: BlocksClientViewProps) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [confirmActivate, setConfirmActivate] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await createBlock(formData);
            setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
            if (result.success) setShowCreateForm(false);
            setTimeout(() => setFeedback(null), 4000);
        });
    };

    const handleActivate = (blockId: string) => {
        startTransition(async () => {
            const result = await activateBlock(blockId);
            setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
            setConfirmActivate(null);
            setTimeout(() => setFeedback(null), 4000);
        });
    };

    const handleDeactivate = (blockId: string) => {
        startTransition(async () => {
            const result = await deactivateBlock(blockId);
            setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
            setTimeout(() => setFeedback(null), 4000);
        });
    };

    const handleDelete = (blockId: string) => {
        startTransition(async () => {
            const result = await deleteBlock(blockId);
            setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
            setConfirmDelete(null);
            setTimeout(() => setFeedback(null), 4000);
        });
    };

    const activeBlock = blocks.find(b => b.isActive);

    return (
        <div className="space-y-6">
            {/* Feedback Toast */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={cn(
                            "fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-md flex items-center gap-3",
                            feedback.type === 'success'
                                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                                : "bg-red-500/20 border-red-500/30 text-red-300"
                        )}
                    >
                        {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        <span className="text-sm font-medium">{feedback.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-lagoon" />
                    <span className="text-sm text-white/60">
                        {blocks.length} block{blocks.length !== 1 ? 's' : ''} total
                        {activeBlock && (
                            <span className="ml-2 text-emerald-400">
                                · <strong>{activeBlock.name}</strong> active
                            </span>
                        )}
                    </span>
                </div>
                <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-ocean hover:bg-ocean-deep text-white shadow-lg shadow-ocean/20"
                >
                    {showCreateForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {showCreateForm ? 'Cancel' : 'New Block'}
                </Button>
            </div>

            {/* Create form */}
            <AnimatePresence>
                {showCreateForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <PremiumCard>
                            <form onSubmit={handleCreate} className="p-6 space-y-5">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-lagoon" />
                                    Create New Training Block
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Block Name</label>
                                        <input
                                            name="name"
                                            type="text"
                                            required
                                            placeholder="e.g. Block 2 — 2026"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-lagoon/50 focus:border-lagoon/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Start Date (Monday)</label>
                                        <input
                                            name="startDate"
                                            type="date"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-lagoon/50 focus:border-lagoon/50 [color-scheme:dark]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Number of Weeks</label>
                                        <input
                                            name="numberOfWeeks"
                                            type="number"
                                            required
                                            min={1}
                                            max={20}
                                            defaultValue={8}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-lagoon/50 focus:border-lagoon/50"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => setShowCreateForm(false)}
                                        className="bg-white/5 hover:bg-white/10 text-white/70"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isPending}
                                        className="bg-lagoon hover:bg-lagoon/80 text-black font-semibold shadow-lg shadow-lagoon/20"
                                    >
                                        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                        Create Block
                                    </Button>
                                </div>
                            </form>
                        </PremiumCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Block list */}
            {blocks.length === 0 ? (
                <PremiumCard>
                    <div className="p-12 text-center">
                        <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white/60">No Blocks Yet</h3>
                        <p className="text-sm text-white/40 mt-1">Create your first training block to get started.</p>
                    </div>
                </PremiumCard>
            ) : (
                <div className="grid gap-4">
                    {blocks.map((block, index) => (
                        <motion.div
                            key={block.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <PremiumCard>
                                <div className="p-5">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        {/* Block info */}
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                                                block.isActive
                                                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                                    : "bg-white/5 border-white/10 text-white/40"
                                            )}>
                                                <Calendar className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-base font-bold text-white truncate">{block.name}</h3>
                                                    {block.isActive && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                            <Zap className="w-3 h-3" /> Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-white/50 mt-0.5">
                                                    {format(new Date(block.startDate), 'MMM d, yyyy')} — {format(new Date(block.endDate), 'MMM d, yyyy')}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                                                    <span>{block._count.weeks} weeks</span>
                                                    <span>·</span>
                                                    <span>{block._count.sessions} sessions</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {block.isActive ? (
                                                <Button
                                                    onClick={() => handleDeactivate(block.id)}
                                                    disabled={isPending}
                                                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs"
                                                >
                                                    <ZapOff className="w-3.5 h-3.5 mr-1.5" /> Deactivate
                                                </Button>
                                            ) : (
                                                <>
                                                    {confirmActivate === block.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-amber-400">This will deactivate the current block.</span>
                                                            <Button
                                                                onClick={() => handleActivate(block.id)}
                                                                disabled={isPending}
                                                                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs"
                                                            >
                                                                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm'}
                                                            </Button>
                                                            <Button
                                                                onClick={() => setConfirmActivate(null)}
                                                                className="bg-white/5 hover:bg-white/10 text-white/50 text-xs"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            onClick={() => setConfirmActivate(block.id)}
                                                            disabled={isPending}
                                                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs"
                                                        >
                                                            <Zap className="w-3.5 h-3.5 mr-1.5" /> Activate
                                                        </Button>
                                                    )}

                                                    {confirmDelete === block.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-red-400">Delete all data?</span>
                                                            <Button
                                                                onClick={() => handleDelete(block.id)}
                                                                disabled={isPending}
                                                                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs"
                                                            >
                                                                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
                                                            </Button>
                                                            <Button
                                                                onClick={() => setConfirmDelete(null)}
                                                                className="bg-white/5 hover:bg-white/10 text-white/50 text-xs"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            onClick={() => setConfirmDelete(block.id)}
                                                            disabled={isPending}
                                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </PremiumCard>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
