'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { INITIAL_PRODUCTS } from '@/data/products';
import { Product, CartItem } from '@/lib/types';
import { initTelegram, triggerHaptic, getTelegramUser } from '@/lib/telegram-client';
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
import { Heart, SearchX, Sparkles, Plus, Settings, ShieldCheck } from 'lucide-react';

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

  // Initialize Telegram WebApp and check Admin status on mount
  useEffect(() => {
    initTelegram();

    // Load custom products from localStorage if any
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

    // Check if current user is Admin (6377333240 or URL parameter ?admin=true)
    const tgUser = getTelegramUser();
    const adminParam = searchParams.get('admin');
    if (tgUser?.id === 6377333240 || adminParam === 'true' || adminParam === '6377333240') {
      setIsAdmin(true);
    }
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
                  <div className="text-xs font-bold text-amber-400">Admin Rejimi Faol</div>
                  <div className="text-[10px] text-zinc-400">Mahsulotlarni bevosita tahrirlashingiz mumkin</div>
                </div>
              </div>

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
                    setIsAdmin(true);
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
