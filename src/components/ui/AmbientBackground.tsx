'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { TonganNgatu } from './Patterns';
import { useMounted } from '@/hooks/useMounted';

export function AmbientBackground() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  // Avoid hydration mismatch: useTheme() returns undefined on the server,
  // so we defer rendering until after the client has mounted.
  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      {/* Tongan Ngatu cultural pattern — the page's quiet ambient identity;
          the deliberate, brighter moment lives in the KupesiBand page-title
          motif (see PageHeader). */}
      <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay">
        <TonganNgatu />
      </div>

      {/* Vignette edge darkening (dark) / warming (light) */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at center, transparent 40%, rgba(11,12,16,0.6) 100%)'
            : 'radial-gradient(ellipse at center, transparent 50%, rgba(240,236,229,0.4) 100%)',
        }}
      />
    </div>
  );
}
