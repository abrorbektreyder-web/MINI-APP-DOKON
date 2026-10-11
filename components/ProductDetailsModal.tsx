'use client';

import React, { useState } from 'react';
import { X, Heart, Star, ShoppingBag, Zap, ChevronLeft, ChevronRight, ShieldCheck, Truck, Check } from 'lucide-react';
import { Product } from '@/lib/types';
import { triggerHaptic } from '@/lib/telegram-client';
import { formatPrice } from '@/lib/format';

interface ProductDetailsModalProps {
  product: Product | null;
  isWishlisted: boolean;
  onClose: () => void;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: { name: string; hex: string }, quantity: number) => void;
  onBuyNow: (product: Product, size: string, color: { name: string; hex: string }, quantity: number) => void;
}

export function ProductDetailsModal({
  product,
  isWishlisted,
  onClose,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
}: ProductDetailsModalProps) {
  if (!product) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'Standard');
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string }>(
    product.colors[0] || { name: 'Asosiy', hex: '#111827' }
  );
  const [quantity, setQuantity] = useState(1);

  const handlePrevImage = () => {
    triggerHaptic('light');
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1));
  };

  const handleNextImage = () => {
    triggerHaptic('light');
    setActiveImageIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md mx-auto h-[92vh] flex flex-col rounded-t-3xl bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Controls */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-center text-zinc-800 dark:text-zinc-200 shadow-md active:scale-95 transition-all"
            aria-label="Yopish"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onToggleWishlist(product);
            }}
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center shadow-md active:scale-95 transition-all ${
              isWishlisted
                ? 'bg-rose-500 text-white'
                : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-800 dark:text-zinc-200'
            }`}
            aria-label="Sevimlilar"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
          {/* Image Gallery Carousel */}
          <div className="relative aspect-[4/4] w-full bg-zinc-100 dark:bg-zinc-900">
            <img
              src={product.images[activeImageIndex]}
              alt={product.title}
              className="w-full h-full object-cover object-center"
            />

            {/* Gallery Navigation Arrows (if multiple images) */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center text-zinc-900 dark:text-zinc-100 active:scale-90"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center text-zinc-900 dark:text-zinc-100 active:scale-90"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Pagination Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md">
                  {product.images.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        activeImageIndex === i ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Details Section */}
          <div className="p-5">
            {/* Rating and Sold */}
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{product.rating}</span>
                <span className="text-zinc-400 font-normal">({product.reviewsCount} sharh)</span>
              </div>
              {product.soldCount && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {product.soldCount}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug mb-3">
              {product.title}
            </h1>

            {/* Price block */}
            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-2xl font-black text-zinc-950 dark:text-zinc-50" suppressHydrationWarning>
                {formatPrice(product.price)} <span className="text-sm font-semibold text-zinc-500">so'm</span>
              </span>
              {product.oldPrice && (
                <span className="text-sm text-zinc-400 line-through" suppressHydrationWarning>
                  {formatPrice(product.oldPrice)} so'm
                </span>
              )}
              {product.discountPercent && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-xs font-black">
                  -{product.discountPercent}%
                </span>
              )}
            </div>

            {/* Size Selector */}
            {product.sizes.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Oʻlcham / Model
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{selectedSize}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        triggerHaptic('selection');
                        setSelectedSize(size);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        selectedSize === size
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md ring-2 ring-zinc-900 dark:ring-white'
                          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 hover:bg-zinc-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Rang
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{selectedColor.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor.name === color.name;
                    return (
                      <button
                        key={color.name}
                        onClick={() => {
                          triggerHaptic('selection');
                          setSelectedColor(color);
                        }}
                        className={`relative w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                          isSelected
                            ? 'border-zinc-900 dark:border-white scale-110 shadow-md'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        aria-label={color.name}
                      >
                        {isSelected && (
                          <Check className={`w-4 h-4 stroke-[3] ${color.hex === '#F8FAFC' || color.hex === '#F5EBE0' ? 'text-black' : 'text-white'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 mb-5">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Miqdor:
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setQuantity((q) => Math.max(1, q - 1));
                  }}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300 disabled:opacity-40 active:scale-95"
                >
                  -
                </button>
                <span className="font-mono text-sm font-bold min-w-5 text-center text-zinc-900 dark:text-zinc-100">
                  {quantity}
                </span>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setQuantity((q) => q + 1);
                  }}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300 active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Tavsif
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Specifications / Highlights */}
            {product.specs && (
              <div className="grid grid-cols-2 gap-2 text-[11px] p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">{product.specs.warranty}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">{product.specs.delivery}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Dual Action Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-900 flex items-center gap-2.5 z-30">
          <button
            onClick={() => {
              triggerHaptic('medium');
              onAddToCart(product, selectedSize, selectedColor, quantity);
            }}
            className="flex-1 h-12 rounded-xl border-2 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-95 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Savatga</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('heavy');
              onBuyNow(product, selectedSize, selectedColor, quantity);
            }}
            className="flex-1 h-12 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4 fill-current text-amber-400" />
            <span>Tezkor Xarid</span>
          </button>
        </div>
      </div>
    </div>
  );
}
