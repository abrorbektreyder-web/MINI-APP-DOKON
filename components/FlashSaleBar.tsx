'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Clock, Truck } from 'lucide-react';

export function FlashSaleBar() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 11,
    minutes: 42,
    seconds: 18,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="px-4 py-1.5">
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-zinc-900 dark:text-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-current" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Flash Chegirma
            </div>
            <div className="text-[10px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              <Truck className="w-3 h-3 inline" /> Oʻzbekiston boʻylab bepul yetkazish
            </div>
          </div>
        </div>

        {/* Countdown timer */}
        <div className="flex items-center gap-1 font-mono text-xs font-black">
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mr-0.5" />
          <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-800 text-[11px]">
            {formatNumber(timeLeft.hours)}
          </span>
          <span className="text-zinc-500">:</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-800 text-[11px]">
            {formatNumber(timeLeft.minutes)}
          </span>
          <span className="text-zinc-500">:</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-800 text-[11px]">
            {formatNumber(timeLeft.seconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
