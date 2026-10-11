'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, CreditCard, Banknote, Loader2 } from 'lucide-react';
import { CartItem, OrderSubmission } from '@/lib/types';
import { UZBEKISTAN_REGIONS } from '@/data/regions';
import { triggerHaptic, getTelegramUser, getTelegramInitData } from '@/lib/telegram-client';
import { formatPrice } from '@/lib/format';

interface CheckoutModalProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export function CheckoutModal({
  isOpen,
  items,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  if (!isOpen) return null;

  const tgUser = getTelegramUser();
  const defaultName = tgUser?.first_name
    ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim()
    : '';

  const [fullName, setFullName] = useState(defaultName);
  const [phone, setPhone] = useState('+998 ');
  const [region, setRegion] = useState(UZBEKISTAN_REGIONS[0].name);
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'card_on_delivery'>('cash_on_delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Phone input mask handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9]/g, '');
    if (!raw.startsWith('998')) {
      raw = '998' + raw;
    }
    // Limit to 12 digits (998 + 9 digits)
    raw = raw.slice(0, 12);

    let formatted = '+998';
    if (raw.length > 3) formatted += ' (' + raw.slice(3, 5);
    if (raw.length > 5) formatted += ') ' + raw.slice(5, 8);
    if (raw.length > 8) formatted += '-' + raw.slice(8, 10);
    if (raw.length > 10) formatted += '-' + raw.slice(10, 12);

    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Iltimos, ismingizni kiriting');
      triggerHaptic('error');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 12) {
      setError('Iltimos, telefon raqamingizni toʻliq kiriting (+998 __ ___-__-__)');
      triggerHaptic('error');
      return;
    }

    if (!address.trim()) {
      setError('Iltimos, yetkazib berish manzilini kiriting');
      triggerHaptic('error');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      const orderData: OrderSubmission = {
        id: `#ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }),
        customer: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          region,
          address: address.trim(),
          comment: comment.trim() || undefined,
          paymentMethod,
        },
        items: items.map((item) => ({
          id: item.product.id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
          size: item.selectedSize,
          color: item.selectedColor.name,
          image: item.product.images[0],
        })),
        totalAmount,
        telegramUser: tgUser
          ? {
              id: tgUser.id,
              username: tgUser.username,
              first_name: tgUser.first_name,
              last_name: tgUser.last_name,
            }
          : undefined,
        initData: getTelegramInitData(),
      };

      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        triggerHaptic('success');
        onSuccess(result.orderId || orderData.id);
      } else {
        setError(result.message || 'Xatolik yuz berdi. Qayta urinib koʻring.');
        triggerHaptic('error');
      }
    } catch {
      setError('Internet aloqasi bilan bogʻliq muammo. Qayta urinib koʻring.');
      triggerHaptic('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md mx-auto max-h-[90vh] flex flex-col rounded-t-3xl bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Buyurtmani Rasmiylashtirish
            </h2>
            <p className="text-[11px] text-zinc-500">
              Toʻlov tovar yetkazib berilganda qabul qilinadi
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Ism va Familiya <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masalan: Sardor Aliyev"
              className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Telefon raqami <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+998 (__) ___-__-__"
              className="w-full h-11 px-3.5 font-mono rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Viloyat / Hudud <span className="text-rose-500">*</span>
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            >
              {UZBEKISTAN_REGIONS.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Address */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Manzil, koʻcha va uy raqami <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Masalan: Chilonzor 9-mavze, 14-uy"
              className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Toʻlov usuli
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setPaymentMethod('cash_on_delivery');
                }}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  paymentMethod === 'cash_on_delivery'
                    ? 'border-zinc-900 dark:border-white bg-zinc-900/5 dark:bg-white/5 ring-1 ring-zinc-900 dark:ring-white'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Naqd pul</div>
                  <div className="text-[10px] text-zinc-500">Yetkazilganda</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setPaymentMethod('card_on_delivery');
                }}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  paymentMethod === 'card_on_delivery'
                    ? 'border-zinc-900 dark:border-white bg-zinc-900/5 dark:bg-white/5 ring-1 ring-zinc-900 dark:ring-white'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Karta orqali</div>
                  <div className="text-[10px] text-zinc-500">Kuryer terminali</div>
                </div>
              </button>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Kuryer uchun qoʻshimcha izoh (ixtiyoriy)
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Masalan: Kechki payt olib keling"
              className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
            />
          </div>

          {/* Order Summary Snapshot */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-1 text-xs">
            <div className="flex justify-between text-zinc-500">
              <span>Mahsulotlar ({items.length} xil):</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200" suppressHydrationWarning>
                {formatPrice(totalAmount)} so'm
              </span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Yetkazib berish:</span>
              <span className="font-semibold text-emerald-600">Bepul (0 so'm)</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700 text-sm font-black text-zinc-900 dark:text-zinc-100">
              <span>Jami summa:</span>
              <span suppressHydrationWarning>{formatPrice(totalAmount)} so'm</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-zinc-800 active:scale-95 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Qabul qilinmoqda...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Buyurtmani Tasdiqlash</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Xavfsiz va kafolatlangan savdo</span>
          </div>
        </form>
      </div>
    </div>
  );
}
