'use client';

import React from 'react';
import { TonganNgatu } from './Patterns';

const particles = [
  { size: 3, top: '15%', left: '10%', delay: '0s', duration: '12s' },
  { size: 2, top: '35%', left: '85%', delay: '2s', duration: '15s' },
  { size: 4, top: '60%', left: '25%', delay: '4s', duration: '18s' },
  { size: 2, top: '80%', left: '70%', delay: '1s', duration: '14s' },
  { size: 3, top: '25%', left: '55%', delay: '3s', duration: '16s' },
  { size: 2, top: '70%', left: '40%', delay: '5s', duration: '13s' },
];

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      {/* Layer 1: Gradient Mesh (slow-moving ambient color) */}
      <div className="absolute inset-0 gradient-mesh" />

      {/* Layer 2: Grid dot pattern */}
      <div className="absolute inset-0 ambient-grid opacity-[0.04]" />

      {/* Layer 3: Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-bio-cyan/40"
          style={{
            width: p.size,
            height: p.size,
            top: p.top,
            left: p.left,
            animation: `float ${p.duration} ease-in-out ${p.delay} infinite`,
            filter: `blur(${p.size > 2 ? 1 : 0}px)`,
          }}
        />
      ))}

      {/* Layer 4: Tongan Ngatu cultural pattern */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay">
        <TonganNgatu />
      </div>

      {/* Layer 5: Vignette edge darkening */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(11,12,16,0.6) 100%)',
        }}
      />
    </div>
  );
}
