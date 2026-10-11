'use client';

import React from 'react';
import { triggerHaptic } from '@/lib/telegram-client';

export type CategoryType = 'all' | 'watches' | 'clothing' | 'shoes' | 'accessories';

interface CategoryFilterProps {
  selectedCategory: CategoryType;
  onSelectCategory: (cat: CategoryType) => void;
}

const CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: 'all', label: 'Barchasi' },
  { id: 'watches', label: '⌚️ Smart Soatlar' },
  { id: 'clothing', label: '🧥 Kiyimlar' },
  { id: 'shoes', label: '👠 Poyabzallar' },
  { id: 'accessories', label: '🎒 Aksessuarlar' },
];

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="py-2.5">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 scroll-smooth">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic('selection');
                onSelectCategory(cat.id);
              }}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
