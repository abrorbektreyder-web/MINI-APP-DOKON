'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/lib/telegram-client';

interface HeroBannerProps {
  onCtaClick: () => void;
}

export function HeroBanner({ onCtaClick }: HeroBannerProps) {
  return (
    <div className="px-4 py-2">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-neutral-900 to-zinc-800 text-white p-5 shadow-lg">
        {/* Subtle decorative glow */}
        <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-44 h-44 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-[70%]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-amber-300 mb-2.5">
            <Sparkles className="w-3 h-3" />
            <span>Yangi Mavsum Kolleksiyasi</span>
          </div>

          <h2 className="text-xl font-extrabold tracking-tight leading-tight text-white mb-1.5">
            Eksklyuziv Uslub &amp; Premium Sifat
          </h2>

          <p className="text-xs text-zinc-300 mb-3.5 leading-relaxed line-clamp-2">
            Eng soʻnggi smart-gadjetlar va trend kiyimlar maxsus chegirma bilan!
          </p>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onCtaClick();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold shadow-md hover:bg-zinc-100 active:scale-95 transition-all"
          >
            <span>Tanlash</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right side background image/accent */}
        <div className="absolute right-0 bottom-0 top-0 w-[35%] overflow-hidden opacity-90 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-l from-transparent to-zinc-900/80 absolute z-10" />
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80"
            alt="Hero Banner"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>
    </div>
  );
}
