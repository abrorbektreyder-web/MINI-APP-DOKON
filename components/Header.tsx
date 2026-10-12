'use client';

import React from 'react';
import { ShoppingBag, Heart, Search, X } from 'lucide-react';
import { triggerHaptic } from '@/lib/telegram-client';

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  searchQuery: string;
  isAdmin?: boolean;
  onBrandClick?: () => void;
  onSearchChange: (query: string) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
}

export function Header({
  cartCount,
  wishlistCount,
  searchQuery,
  isAdmin = false,
  onBrandClick,
  onSearchChange,
  onOpenCart,
  onOpenWishlist,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-900 transition-colors">
      <div className="max-w-md mx-auto px-4 pt-3 pb-2.5">
        {/* Top brand & actions bar */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div
            onClick={() => {
              triggerHaptic('selection');
              onBrandClick?.();
            }}
            className="flex items-center gap-2 cursor-pointer select-none"
            role="button"
            title={isAdmin ? 'Admin rejim faol' : 'Admin kirish'}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <h1 className="text-2xl font-black tracking-[0.25em] text-zinc-900 dark:text-zinc-50 font-serif uppercase">
              LUXOR
            </h1>
            {isAdmin && (
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                ADMIN 👑
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Wishlist button */}
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenWishlist();
              }}
              className="relative p-2.5 rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-95 transition-all"
              aria-label="Sevimlilar"
            >
              <Heart className="w-5 h-5 stroke-[2]" />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart button */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                onOpenCart();
              }}
              className="relative p-2.5 rounded-full text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 active:scale-95 transition-all"
              aria-label="Savatcha"
            >
              <ShoppingBag className="w-5 h-5 stroke-[2]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-black text-white dark:bg-white dark:text-black text-[11px] font-extrabold rounded-full flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modern search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Mahsulotlarni qidirish..."
            className="w-full h-10 pl-10 pr-9 text-sm rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all border border-transparent focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
