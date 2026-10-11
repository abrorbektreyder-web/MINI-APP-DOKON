'use client';

import React from 'react';
import { Heart, Star, Plus } from 'lucide-react';
import { Product } from '@/lib/types';
import { triggerHaptic } from '@/lib/telegram-client';
import { formatPrice } from '@/lib/format';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAddToCart: (product: Product) => void;
}

export function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onSelectProduct,
  onQuickAddToCart,
}: ProductCardProps) {
  return (
    <div className="group relative flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Product Image & Badges */}
      <div
        onClick={() => {
          triggerHaptic('light');
          onSelectProduct(product);
        }}
        className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer"
      >
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {product.badge && (
            <span className="px-2 py-0.5 rounded-md bg-zinc-900/90 text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm shadow-sm">
              {product.badge}
            </span>
          )}
          {product.discountPercent && (
            <span className="px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-black">
              -{product.discountPercent}%
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('light');
            onToggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${
            isWishlisted
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-200 hover:bg-white'
          }`}
          aria-label="Sevimlilarga qoʻshish"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-col flex-1 p-3">
        {/* Rating & Sold count */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
          <div className="flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{product.rating}</span>
          </div>
          {product.soldCount && <span>{product.soldCount}</span>}
        </div>

        {/* Title */}
        <h3
          onClick={() => {
            triggerHaptic('light');
            onSelectProduct(product);
          }}
          className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors mb-2"
        >
          {product.title}
        </h3>

        {/* Price & Action button */}
        <div className="mt-auto flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="text-xs font-black text-zinc-950 dark:text-zinc-50" suppressHydrationWarning>
              {formatPrice(product.price)} <span className="text-[10px] font-normal text-zinc-500">so'm</span>
            </div>
            {product.oldPrice && (
              <div className="text-[10px] text-zinc-400 line-through" suppressHydrationWarning>
                {formatPrice(product.oldPrice)} so'm
              </div>
            )}
          </div>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onQuickAddToCart(product);
            }}
            className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center hover:bg-zinc-800 active:scale-90 transition-all shadow-sm"
            aria-label="Savatga qoʻshish"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
