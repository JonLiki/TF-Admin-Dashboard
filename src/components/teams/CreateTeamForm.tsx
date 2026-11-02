'use client';

import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createTeam } from '@/actions';

export function CreateTeamForm() {
    return (
        <form
            action={async (formData: FormData) => {
                const res = await createTeam(formData);
                if (res.success) toast.success(res.message);
                else toast.error(res.message);
            }}
            className="space-y-4 relative z-10"
        >
            <Input name="name" label="Group Name" placeholder="e.g. Group To’a" required className="bg-black/20 border-white/10 focus:border-tongan/50" />
            <Button type="submit" className="w-full bg-tongan hover:bg-red-700 shadow-tongan/20" size="md">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
            </Button>
        </form>
    );
}
