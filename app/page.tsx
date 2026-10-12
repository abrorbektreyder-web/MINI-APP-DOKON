'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { INITIAL_PRODUCTS } from '@/data/products';
import { Product, CartItem } from '@/lib/types';
import {
  initTelegram,
  triggerHaptic,
  isUserAdmin,
  setAdminSession,
  verifyAdminPin,
} from '@/lib/telegram-client';
import { Header } from '@/components/Header';
import { HeroBanner } from '@/components/HeroBanner';
import { FlashSaleBar } from '@/components/FlashSaleBar';
import { CategoryFilter, CategoryType } from '@/components/CategoryFilter';
import { ProductCard } from '@/components/ProductCard';
import { ProductDetailsModal } from '@/components/ProductDetailsModal';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { OrderSuccessModal } from '@/components/OrderSuccessModal';
import { AdminProductModal } from '@/components/AdminProductModal';
import { BottomNav, NavTab } from '@/components/BottomNav';
import {
  Heart,
  SearchX,
  Sparkles,
  Plus,
  Settings,
  ShieldCheck,
  KeyRound,
  LogOut,
  X,
} from 'lucide-react';

function LuxorStoreContent() {
  const searchParams = useSearchParams();

  // Primary State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Initialize Telegram WebApp and check Admin status on mount
  useEffect(() => {
    initTelegram();

    // 1. Instant load from localStorage
    try {
      const saved = localStorage.getItem('luxor_custom_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
        }
      }
    } catch {
      // fallback
    }

    // 2. Background sync from backend catalog API
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setProducts(data.data);
          try {
            localStorage.setItem('luxor_custom_products', JSON.stringify(data.data));
          } catch {}
        }
      })
      .catch(() => {});

    // 3. Multi-interval Admin verification to eliminate Webview race conditions
    const runAdminCheck = () => {
      if (isUserAdmin()) {
        setIsAdmin(true);
        return true;
      }
      return false;
    };

    runAdminCheck();
    const t1 = setTimeout(runAdminCheck, 150);
    const t2 = setTimeout(runAdminCheck, 450);
    const t3 = setTimeout(runAdminCheck, 1200);
    const t4 = setTimeout(runAdminCheck, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [searchParams]);

  // Deep-link handler: e.g. ?product=hk9pro or ?p=hk9pro
  useEffect(() => {
    const productParam = searchParams.get('product') || searchParams.get('p') || searchParams.get('start');
    if (productParam) {
      const cleanParam = productParam.replace('p_', '');
      const matched = products.find(
        (p) => p.slug === cleanParam || p.id === cleanParam || p.id === `prod-${cleanParam}`
      );
      if (matched) {
        setSelectedProduct(matched);
      }
    }
  }, [searchParams, products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }
      // Wishlist tab filter
      if (activeTab === 'wishlist') {
        return wishlistIds.includes(p.id);
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery, activeTab, wishlistIds]);

  // Wishlist handler
  const handleToggleWishlist = (product: Product) => {
    setWishlistIds((prev) =>
      prev.includes(product.id) ? prev.filter((id) => id !== product.id) : [...prev, product.id]
    );
  };

  // Quick add to cart from grid card
  const handleQuickAddToCart = (product: Product) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          product,
          selectedSize: product.sizes[0] || 'Standard',
          selectedColor: product.colors[0] || { name: 'Asosiy', hex: '#111827' },
          quantity: 1,
        },
      ];
    });
  };

  // Add to cart from details modal
  const handleAddToCart = (
    product: Product,
    size: string,
    color: { name: string; hex: string },
    quantity: number
  ) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor.name === color.name
      );
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        return next;
      }
      return [...prev, { product, selectedSize: size, selectedColor: color, quantity }];
    });
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  // Direct "Buy Now" handler (opens checkout immediately)
  const handleBuyNow = (
    product: Product,
    size: string,
    color: { name: string; hex: string },
    quantity: number
  ) => {
    setCart([
      {
        product,
        selectedSize: size,
        selectedColor: color,
        quantity,
      },
    ]);
    setSelectedProduct(null);
    setIsCheckoutOpen(true);
  };

  // Cart quantity updater
  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    setCart((prev) => {
      const next = [...prev];
      next[index].quantity = newQty;
      return next;
    });
  };

  // Cart item remover
  const handleRemoveCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Total cart items count
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Tab change handler
  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'cart') {
      setIsCartOpen(true);
    } else if (tab === 'catalog') {
      setSelectedCategory('all');
    }
  };

  // Admin: Save or Edit Product
  const handleSaveProduct = async (product: Product) => {
    setProducts((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === product.id);
      let updated: Product[];
      if (existingIdx > -1) {
        updated = [...prev];
        updated[existingIdx] = product;
      } else {
        updated = [product, ...prev];
      }

      // Persist in localStorage
      try {
        localStorage.setItem('luxor_custom_products', JSON.stringify(updated));
      } catch {
        // ignore
      }

      return updated;
    });

    // Also notify backend API in background
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
    } catch {
      // non-blocking
    }
  };

  // Admin: Delete Product
  const handleDeleteProduct = async (productId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem('luxor_custom_products', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    try {
      await fetch(`/api/products?id=${productId}`, { method: 'DELETE' });
    } catch {
      // non-blocking
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 text-zinc-900 dark:text-zinc-50 transition-colors">
      {/* Top Header */}
      <Header
        cartCount={cartItemsCount}
        wishlistCount={wishlistIds.length}
        searchQuery={searchQuery}
        isAdmin={isAdmin}
        onBrandClick={() => {
          if (!isAdmin) {
            setPinInput('');
            setPinError('');
            setIsPinModalOpen(true);
          } else {
            setIsAdminModalOpen(true);
          }
        }}
        onSearchChange={setSearchQuery}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setActiveTab('wishlist')}
      />

      <main className="max-w-md mx-auto">
        {/* Admin Quick Action Banner (Shown if Admin) */}
        {isAdmin && (
          <div className="px-4 py-2">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-zinc-900 via-neutral-900 to-zinc-900 text-white flex items-center justify-between shadow-md border border-amber-500/30">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-400">Admin Rejimi Faol 👑</div>
                  <div className="text-[10px] text-zinc-400">Mahsulotlarni bevosita boshqaring</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    setProductToEdit(null);
                    setIsAdminModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 text-xs font-extrabold flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Qoʻshish</span>
                </button>

                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setAdminSession(false);
                    setIsAdmin(false);
                  }}
                  title="Admin rejimidan chiqish"
                  className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 active:scale-95 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Home Screen Widgets */}
        {activeTab === 'home' && !searchQuery && (
          <>
            <HeroBanner onCtaClick={() => setSelectedCategory('clothing')} />
            <FlashSaleBar />
          </>
        )}

        {/* Section Header if Wishlist is active */}
        {activeTab === 'wishlist' && (
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              <span>Saqlanganlar ({wishlistIds.length})</span>
            </h2>
            <button
              onClick={() => setActiveTab('home')}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Barchasini koʻrish
            </button>
          </div>
        )}

        {/* Category Pill Filters (hidden on Wishlist tab) */}
        {activeTab !== 'wishlist' && (
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}

        {/* Section title */}
        {activeTab === 'home' && !searchQuery && (
          <div className="px-4 pt-1 pb-2 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Eng Ommabop Mahsulotlar</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-zinc-400">
                {filteredProducts.length} ta tovar
              </span>
              {/* Secret Admin Mode Switch for easy testing */}
              {!isAdmin && (
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    setPinInput('');
                    setPinError('');
                    setIsPinModalOpen(true);
                  }}
                  className="p-1 text-zinc-300 dark:text-zinc-700 hover:text-zinc-500"
                  title="Admin rejimini yoqish"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2-Column Product Grid */}
        <div className="px-4 py-2">
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                <SearchX className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                {activeTab === 'wishlist' ? 'Sevimlilar roʻyxati boʻsh' : 'Mahsulot topilmadi'}
              </h3>
              <p className="text-xs text-zinc-500 mb-4 max-w-xs mx-auto">
                {activeTab === 'wishlist'
                  ? 'Katalogdagi yurakcha belgisini bosib, tovarlarni bu yerga qoʻshing.'
                  : 'Boshqa soʻzlar orqali qidirib koʻring yoki toifani oʻzgartiring.'}
              </p>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setActiveTab('home');
                }}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold active:scale-95 shadow-sm"
              >
                Katalogni koʻrish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={wishlistIds.includes(product.id)}
                  isAdmin={isAdmin}
                  onToggleWishlist={handleToggleWishlist}
                  onSelectProduct={(p) => setSelectedProduct(p)}
                  onQuickAddToCart={handleQuickAddToCart}
                  onEdit={(p) => {
                    setProductToEdit(p);
                    setIsAdminModalOpen(true);
                  }}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        cartCount={cartItemsCount}
        wishlistCount={wishlistIds.length}
        onTabChange={handleTabChange}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isWishlisted={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
        onClose={() => setSelectedProduct(null)}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      {/* Admin Product Management Modal (Add / Edit) */}
      <AdminProductModal
        isOpen={isAdminModalOpen}
        productToEdit={productToEdit}
        onClose={() => {
          setIsAdminModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
      />

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        items={cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        items={cart}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(id) => {
          setIsCheckoutOpen(false);
          setCart([]);
          setOrderSuccessId(id);
        }}
      />

      {/* Celebratory Order Success Modal */}
      <OrderSuccessModal
        orderId={orderSuccessId}
        onClose={() => setOrderSuccessId(null)}
      />

      {/* Admin PIN Unlock Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                    Admin Kirish
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Do‘kon egasi tasdiq kodi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (verifyAdminPin(pinInput)) {
                  setIsAdmin(true);
                  setIsPinModalOpen(false);
                  setPinInput('');
                  setPinError('');
                  triggerHaptic('success');
                } else {
                  setPinError('Noto‘g‘ri kod. Standart: 7777 yoki Admin Telegram ID');
                  triggerHaptic('error');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  PIN-kod yoki Admin ID:
                </label>
                <input
                  type="password"
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError('');
                  }}
                  placeholder="Masalan: 7777"
                  className="w-full h-12 px-4 rounded-xl text-center text-lg font-mono font-bold tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {pinError && (
                  <p className="text-xs text-rose-500 mt-1.5 text-center font-medium">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-bold active:scale-95"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-sm font-black active:scale-95 shadow-md shadow-amber-500/20"
                >
                  Tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LuxorMiniAppPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm font-semibold text-zinc-500">Yuklanmoqda...</div>}>
      <LuxorStoreContent />
    </Suspense>
  );
}
