'use client';

import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { CartItem } from '@/lib/types';
import { triggerHaptic } from '@/lib/telegram-client';
import { formatPrice } from '@/lib/format';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md mx-auto max-h-[85vh] flex flex-col rounded-t-3xl bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Sizning Savatchangiz ({items.length})
            </h2>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-700"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping banner */}
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
          <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Siz uchun Oʻzbekiston boʻylab bepul yetkazib berish faol!</span>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 divide-y divide-zinc-100 dark:divide-zinc-900">
          {items.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-3 text-zinc-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                Savatchangiz hozircha boʻsh
              </p>
              <p className="text-xs text-zinc-500 mb-4">
                Katalogdan yoqqan tovarlarni qoʻshing!
              </p>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold active:scale-95"
              >
                Doʻkonga qaytish
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={`${item.product.id}-${index}`} className="py-3.5 flex gap-3 items-center">
                <img
                  src={item.product.images[0]}
                  alt={item.product.title}
                  className="w-16 h-20 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {item.product.title}
                  </h3>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 mb-1.5 flex items-center gap-2">
                    <span>{item.selectedSize}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block border border-zinc-300 dark:border-zinc-700"
                        style={{ backgroundColor: item.selectedColor.hex }}
                      />
                      {item.selectedColor.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-zinc-950 dark:text-zinc-50" suppressHydrationWarning>
                      {formatPrice(item.product.price * item.quantity)} so'm
                    </span>

                    {/* Stepper */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          onUpdateQuantity(index, item.quantity - 1);
                        }}
                        className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold min-w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          onUpdateQuantity(index, item.quantity + 1);
                        }}
                        className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs"
                      >
                        +
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          onRemoveItem(index);
                        }}
                        className="p-1 ml-1 text-zinc-400 hover:text-rose-500"
                        aria-label="Oʻchirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Total and Checkout Button */}
        {items.length > 0 && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1.5 text-xs text-zinc-500">
              <span>Yetkazib berish:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Bepul (0 so'm)</span>
            </div>
            <div className="flex items-center justify-between mb-3 text-sm font-black text-zinc-900 dark:text-zinc-100">
              <span>Jami toʻlov:</span>
              <span className="text-lg" suppressHydrationWarning>
                {formatPrice(totalAmount)} so'm
              </span>
            </div>

            <button
              onClick={() => {
                triggerHaptic('heavy');
                onProceedToCheckout();
              }}
              className="w-full h-12 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <span>Rasmiylashtirishga oʻtish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
