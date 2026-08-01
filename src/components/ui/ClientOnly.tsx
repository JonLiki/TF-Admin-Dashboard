'use client';

import { useMounted } from '@/hooks/useMounted';

export default function ClientOnly({ children }: { children: React.ReactNode }) {
    const hasMounted = useMounted();

    if (!hasMounted) {
        return null;
    }

    return <>{children}</>;
}
