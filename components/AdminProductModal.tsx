'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Tag, DollarSign, Image as ImageIcon, Sparkles, Layers } from 'lucide-react';
import { Product } from '@/lib/types';
import { triggerHaptic } from '@/lib/telegram-client';

interface AdminProductModalProps {
  isOpen: boolean;
  productToEdit: Product | null;
  onClose: () => void;
  onSave: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

export function AdminProductModal({
  isOpen,
  productToEdit,
  onClose,
  onSave,
  onDelete,
}: AdminProductModalProps) {
  const isEditing = !!productToEdit;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'watches' | 'clothing' | 'shoes' | 'accessories'>('watches');
  const [price, setPrice] = useState<number>(350000);
  const [oldPrice, setOldPrice] = useState<number | undefined>(undefined);
  const [discountPercent, setDiscountPercent] = useState<number | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState<'New In' | 'Best Seller' | 'Flash Sale' | 'Hot' | ''>('New In');
  const [sizes, setSizes] = useState('S, M, L');
  const [colors, setColors] = useState('Qora, Kumush, Moviy');

  useEffect(() => {
    if (productToEdit) {
      setTitle(productToEdit.title);
      setCategory(productToEdit.category === 'all' ? 'clothing' : productToEdit.category);
      setPrice(productToEdit.price);
      setOldPrice(productToEdit.oldPrice);
      setDiscountPercent(productToEdit.discountPercent);
      setImageUrl(productToEdit.images[0] || '');
      setDescription(productToEdit.description || '');
      setBadge(productToEdit.badge || '');
      setSizes(productToEdit.sizes.join(', '));
      setColors(productToEdit.colors.map((c) => c.name).join(', '));
    } else {
      // Reset for new product
      setTitle('');
      setCategory('clothing');
      setPrice(250000);
      setOldPrice(320000);
      setDiscountPercent(20);
      setImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80');
      setDescription('');
      setBadge('New In');
      setSizes('S, M, L, XL');
      setColors('Qora, Oq, Koʻk');
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  // Auto calculate discount percentage when price or oldPrice changes
  const handlePriceChange = (newPrice: number) => {
    setPrice(newPrice);
    if (oldPrice && oldPrice > newPrice) {
      const disc = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
      setDiscountPercent(disc);
    }
  };

  const handleOldPriceChange = (newOldPrice: number) => {
    setOldPrice(newOldPrice);
    if (newOldPrice > price) {
      const disc = Math.round(((newOldPrice - price) / newOldPrice) * 100);
      setDiscountPercent(disc);
    } else {
      setDiscountPercent(undefined);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim() || price <= 0) return;

    triggerHaptic('success');

    const cleanSizes = sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const cleanColors = colors
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => ({
        name: c,
        hex: c.toLowerCase().includes('oq')
          ? '#FFFFFF'
          : c.toLowerCase().includes('qizil')
          ? '#DC2626'
          : c.toLowerCase().includes('ko')
          ? '#2563EB'
          : c.toLowerCase().includes('kumush')
          ? '#CBD5E1'
          : '#18181B',
      }));

    const savedProduct: Product = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      slug: productToEdit
        ? productToEdit.slug
        : title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .slice(0, 20),
      title: title.trim(),
      category,
      price,
      oldPrice: oldPrice && oldPrice > price ? oldPrice : undefined,
      discountPercent: discountPercent && discountPercent > 0 ? discountPercent : undefined,
      images: [imageUrl.trim()],
      rating: productToEdit ? productToEdit.rating : 4.9,
      reviewsCount: productToEdit ? productToEdit.reviewsCount : 1,
      sizes: cleanSizes.length > 0 ? cleanSizes : ['Standard'],
      colors: cleanColors.length > 0 ? cleanColors : [{ name: 'Asosiy', hex: '#18181B' }],
      description: description.trim() || `${title} — yuqori sifatli mahsulot.`,
      inStock: true,
      soldCount: productToEdit?.soldCount || 'Yangi',
      badge: badge ? (badge as Product['badge']) : undefined,
      specs: {
        material: 'Premium sifatli material',
        warranty: 'Rasmiy kafolat',
        delivery: 'Oʻzbekiston boʻylab bepul',
        stock: 'Mavjud',
      },
    };

    onSave(savedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md mx-auto max-h-[92vh] flex flex-col rounded-t-3xl bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between bg-zinc-900 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">
              {isEditing ? 'Mahsulotni Tahrirlash' : 'Yangi Mahsulot Qoʻshish'}
            </h2>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1 rounded-full text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Mahsulot Nomi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: HK9 Pro Smart Soat"
              className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Boʻlim (Kategoriya)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value="watches">⌚️ Smart Soatlar</option>
              <option value="clothing">🧥 Kiyim-kechak</option>
              <option value="shoes">👠 Poyabzallar</option>
              <option value="accessories">🎒 Aksessuarlar</option>
            </select>
          </div>

          {/* Price & Old Price & Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Sotuv Narxi (soʻm) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Eski Narxi (Skidka uchun)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={oldPrice || ''}
                  onChange={(e) => handleOldPriceChange(Number(e.target.value))}
                  placeholder="Masalan: 450000"
                  className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Discount badge display */}
          {discountPercent && discountPercent > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-bold">
              <Tag className="w-4 h-4" />
              <span>Avtomatik chegirma: -{discountPercent}% stikeri qoʻyiladi</span>
            </div>
          )}

          {/* Image URL */}
          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Rasm Havolasi (URL) <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... rasm linki"
                className="flex-1 h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-11 h-11 rounded-xl object-cover border border-zinc-200"
                />
              )}
            </div>
          </div>

          {/* Badge */}
          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Maxsus Nishon (Stiker)
            </label>
            <div className="flex flex-wrap gap-2">
              {['New In', 'Best Seller', 'Flash Sale', 'Hot', ''].map((b) => (
                <button
                  type="button"
                  key={b}
                  onClick={() => setBadge(b as typeof badge)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    badge === b
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {b || 'Nishonsiz'}
                </button>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Oʻlchamlar (vergul bilan ajrating)
            </label>
            <input
              type="text"
              value={sizes}
              onChange={(e) => setSizes(e.target.value)}
              placeholder="Masalan: S, M, L yoki 45mm, 49mm"
              className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Colors */}
          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Ranglar (vergul bilan ajrating)
            </label>
            <input
              type="text"
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              placeholder="Masalan: Qora, Oq, Qizil"
              className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Mahsulot Tavsifi
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mahsulot haqida batafsil maʼlumot..."
              className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('heavy');
                  if (confirm('Ushbu mahsulotni haqiqatdan ham oʻchirmoqchimisiz?')) {
                    onDelete(productToEdit.id);
                    onClose();
                  }
                }}
                className="h-12 px-4 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Oʻchirish</span>
              </button>
            )}

            <button
              type="submit"
              className="flex-1 h-12 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Oʻzgarishlarni Saqlash' : 'Doʻkonga Qoʻshish'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
