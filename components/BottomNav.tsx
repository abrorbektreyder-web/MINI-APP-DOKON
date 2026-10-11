'use client';

import React from 'react';
import { Home, LayoutGrid, Heart, ShoppingBag } from 'lucide-react';
import { triggerHaptic } from '@/lib/telegram-client';

export type NavTab = 'home' | 'catalog' | 'wishlist' | 'cart';

interface BottomNavProps {
  activeTab: NavTab;
  cartCount: number;
  wishlistCount: number;
  onTabChange: (tab: NavTab) => void;
}

export function BottomNav({
  activeTab,
  cartCount,
  wishlistCount,
  onTabChange,
}: BottomNavProps) {
  const tabs: { id: NavTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'home', label: 'Bosh sahifa', icon: Home },
    { id: 'catalog', label: 'Katalog', icon: LayoutGrid },
    { id: 'wishlist', label: 'Sevimlilar', icon: Heart, badge: wishlistCount },
    { id: 'cart', label: 'Savatcha', icon: ShoppingBag, badge: cartCount },
  ];

  return (
    <div className="fixed bottom-3 left-4 right-4 z-40 max-w-md mx-auto pointer-events-none">
      <nav className="pointer-events-auto bg-zinc-900/90 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/10 text-white rounded-2xl px-2 py-1.5 shadow-2xl flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                onTabChange(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all active:scale-90 ${
                isActive
                  ? 'text-white font-bold bg-white/10'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-amber-500 text-zinc-950 text-[10px] font-black rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
