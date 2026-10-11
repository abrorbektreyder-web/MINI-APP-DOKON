'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, MessageCircle, ArrowRight } from 'lucide-react';
import { triggerHaptic, closeTelegram } from '@/lib/telegram-client';

interface OrderSuccessModalProps {
  orderId: string | null;
  onClose: () => void;
}

export function OrderSuccessModal({ orderId, onClose }: OrderSuccessModalProps) {
  useEffect(() => {
    if (!orderId) return;

    triggerHaptic('success');

    // Launch celebratory confetti fireworks
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899'],
      });
    } catch {
      // ignore
    }
  }, [orderId]);

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-950 p-6 text-center shadow-2xl border border-zinc-100 dark:border-zinc-800 animate-scale-in">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-1">
          Buyurtmangiz Qabul Qilindi! 🎉
        </h2>

        <div className="inline-block px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 mb-3">
          {orderId}
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
          Tez orada operatorimiz siz bilan telefon orqali bogʻlanadi va yetkazib berish vaqtini tasdiqlaydi.
        </p>

        <div className="space-y-2.5">
          <button
            onClick={() => {
              triggerHaptic('medium');
              closeTelegram();
            }}
            className="w-full h-11 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Telegramga qaytish</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-full h-11 rounded-xl bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 hover:bg-zinc-200"
          >
            <span>Yana xarid qilish</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
