'use client';

import { useAutoSync } from '@/hooks/useAutoSync';

export function SyncProvider({ children }: { children: React.ReactNode }) {
    useAutoSync();
    return <>{children}</>>;
}</>
