'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Trash2, Ban, CheckCircle } from 'lucide-react';
import { deleteMember, toggleMemberActive } from '@/actions';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';

export function MemberActions({ memberId, memberName, isActive }: { memberId: string; memberName: string; isActive: boolean }) {
    const [open, setOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const run = async (remove: boolean) => {
        setPending(true); setError(null);
        try {
            const result = remove ? await deleteMember(memberId) : await toggleMemberActive(memberId, isActive);
            if (!result.success) { setError(result.message); return; }
            setOpen(false);
            if (remove) router.push('/members'); else router.refresh();
        } catch { setError('Could not update this member. Please try again.'); }
        finally { setPending(false); }
    };
    return <>
        <Button type="button" variant="secondary" aria-haspopup="dialog" aria-expanded={open}
            aria-label={`Manage ${memberName}`} onClick={() => { setOpen(true); setConfirmDelete(false); setError(null); }}>
            <MoreHorizontal className="mr-2 h-5 w-5" /> Manage member
        </Button>
        <Sheet isOpen={open} onClose={() => { if (!pending) setOpen(false); }} title={`Manage ${memberName}`}>
            <div className="space-y-4">
                <p className="text-sm">Deactivating a member keeps their history and removes them from active participation.</p>
                <Button type="button" variant="secondary" isLoading={pending} onClick={() => run(false)}>
                    {isActive ? <Ban className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    {isActive ? 'Deactivate member' : 'Activate member'}
                </Button>
                <div className="border-t border-border pt-4 space-y-3">
                    {confirmDelete ? <>
                        <p>Delete {memberName} permanently? This cannot be undone. Deactivate them instead to keep their history.</p>
                        <Button type="button" variant="danger" isLoading={pending} onClick={() => run(true)}>Permanently delete member</Button>
                        <Button type="button" variant="ghost" disabled={pending} onClick={() => setConfirmDelete(false)}>Cancel deletion</Button>
                    </> : <Button type="button" variant="danger" disabled={pending} onClick={() => setConfirmDelete(true)}><Trash2 className="mr-2 h-4 w-4" /> Delete member</Button>}
                </div>
                {error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{error}</p>}
            </div>
        </Sheet>
    </>;
}
