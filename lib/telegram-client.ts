'use client';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

// Safe interface for window.Telegram.WebApp
export interface TelegramWebAppData {
  initData: string;
  initDataUnsafe?: {
    user?: TelegramUser;
    start_param?: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebAppData;
    };
  }
}

export function getTelegramWebApp(): TelegramWebAppData | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
}

export function initTelegram(): void {
  const tg = getTelegramWebApp();
  if (tg) {
    try {
      tg.ready();
      tg.expand();
    } catch {
      // non-blocking
    }
  }
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error' = 'light'): void {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) return;

  try {
    if (type === 'selection') {
      tg.HapticFeedback.selectionChanged();
    } else if (type === 'success' || type === 'error') {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch {
    // Graceful fallback for browser testing
  }
}

export function getTelegramUser(): TelegramUser | null {
  const tg = getTelegramWebApp();

  // 1. Official Telegram WebApp SDK object
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }

  // 2. Fallback: Parse initData query string from SDK
  if (tg?.initData) {
    try {
      const params = new URLSearchParams(tg.initData);
      const userRaw = params.get('user');
      if (userRaw) {
        return JSON.parse(userRaw);
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback: Parse directly from window.location.hash (#tgWebAppData=...)
  if (typeof window !== 'undefined' && window.location.hash) {
    try {
      const hashStr = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hashStr);
      const tgWebAppData = hashParams.get('tgWebAppData');
      if (tgWebAppData) {
        const subParams = new URLSearchParams(tgWebAppData);
        const userRaw = subParams.get('user');
        if (userRaw) {
          return JSON.parse(userRaw);
        }
      }
    } catch {
      // ignore
    }
  }

  // 4. Fallback: Parse directly from URL search params
  if (typeof window !== 'undefined' && window.location.search) {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const tgWebAppData = searchParams.get('tgWebAppData');
      if (tgWebAppData) {
        const subParams = new URLSearchParams(tgWebAppData);
        const userRaw = subParams.get('user');
        if (userRaw) {
          return JSON.parse(userRaw);
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export function isUserAdmin(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Cached admin session in browser/webview localStorage
  try {
    if (localStorage.getItem('luxor_admin_session') === 'true') {
      return true;
    }
  } catch {
    // ignore
  }

  // 2. Check URL search parameters
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const adminParam = searchParams.get('admin');
    if (adminParam === 'true' || adminParam === '6377333240') {
      try {
        localStorage.setItem('luxor_admin_session', 'true');
      } catch {}
      return true;
    }
  } catch {
    // ignore
  }

  // 3. Check Telegram user info (ID or username)
  const user = getTelegramUser();
  if (user) {
    const isOwnerId = String(user.id) === '6377333240' || user.id === 6377333240;
    const isOwnerUsername = user.username?.toLowerCase() === 'abrorjon_dev';

    if (isOwnerId || isOwnerUsername) {
      try {
        localStorage.setItem('luxor_admin_session', 'true');
      } catch {}
      return true;
    }
  }

  return false;
}

export function setAdminSession(active: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (active) {
      localStorage.setItem('luxor_admin_session', 'true');
    } else {
      localStorage.removeItem('luxor_admin_session');
    }
  } catch {}
}

export function verifyAdminPin(pin: string): boolean {
  const clean = pin.trim().toLowerCase();
  if (clean === '7777' || clean === '6377333240' || clean === 'luxor') {
    setAdminSession(true);
    return true;
  }
  return false;
}

export function getTelegramInitData(): string {
  const tg = getTelegramWebApp();
  return tg?.initData || '';
}

export function getTelegramStartParam(): string | undefined {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.start_param;
}

export function closeTelegram(): void {
  const tg = getTelegramWebApp();
  if (tg) {
    try {
      tg.close();
    } catch {
      // Fallback
    }
  }
}
