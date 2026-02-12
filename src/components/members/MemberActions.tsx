'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, CheckCircle, Trash2, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteMember, toggleMemberActive } from '@/actions';
import { toast } from 'sonner';

interface MemberActionsProps {
    memberId: string;
    isActive: boolean;
}

export function MemberActions({ memberId, isActive }: MemberActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const handleToggleActive = async () => {
        setIsPending(true);
        try {
            const result = await toggleMemberActive(memberId, isActive);
            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsPending(false);
            setIsOpen(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this member? This action cannot be undone.")) return;

        setIsPending(true);
        try {
            const result = await deleteMember(memberId);
            if (result.success) {
                toast.success("Member deleted");
                router.push('/members'); // Redirect to list
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error("Failed to delete member");
        } finally {
            setIsPending(false);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                title="Manage Member"
            >
                <MoreHorizontal className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden"
                        >
                            <div className="py-1">
                                <button
                                    onClick={handleToggleActive}
                                    disabled={isPending}
                                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors gap-2"
                                >
                                    {isActive ? (
                                        <>
                                            <Ban className="w-4 h-4 text-orange-500" />
                                            <span>Deactivate Member</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            <span>Activate Member</span>
                                        </>
                                    )}
                                </button>

                                <div className="h-px bg-gray-100 my-1" />

                                <button
                                    onClick={handleDelete}
                                    disabled={isPending}
                                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete Member</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
