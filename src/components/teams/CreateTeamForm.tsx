'use client';

import { useActionState, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createTeam } from '@/actions';

export function CreateTeamForm() {
    const [name, setName] = useState('');
    const [state, action, pending] = useActionState(async (_previous: { success: boolean; message: string } | null, data: FormData) => {
        try { const result = await createTeam(data); if (result.success) setName(''); return result; }
        catch { return { success: false, message: 'Could not create this team. Please try again.' }; }
    }, null);
    return (
        <form action={action}
            className="space-y-4 relative z-10"
        >
            <Input disabled={pending} name="name" value={name} onChange={event => setName(event.target.value)} label="Team name" placeholder="e.g. Team To’a" required className="bg-black/20 border-white/10 focus:border-tongan/50" />
            <p role={state?.success === false ? 'alert' : 'status'} className="text-sm">{state?.message}</p>
            <Button type="submit" isLoading={pending} className="w-full bg-tongan hover:bg-red-700 shadow-tongan/20" size="md">
                <Plus className="w-4 h-4 mr-2" />
                Create team
            </Button>
        </form>
    );
}
