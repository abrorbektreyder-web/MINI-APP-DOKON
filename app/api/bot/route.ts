import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.TELEGRAM__T_TOKEN ||
  '8719208102:AAGcxrZ6CKXmHjt5yCCJpxWS2NJQQ7cIiiE';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://mini-app-dokon.vercel.app';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
      text?: string;
    };
    data?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json();

    if (!BOT_TOKEN) {
      console.warn('BOT_TOKEN missing in webhook handler');
      return NextResponse.json({ ok: true });
    }

    // 1. Handle incoming user text messages
    if (update.message?.text) {
      const text = update.message.text.trim();
      const chatId = update.message.chat.id;
      const firstName = update.message.from.first_name || 'Xaridor';

      if (text.startsWith('/start')) {
        // Parse deep-link parameter: /start hk9pro -> param is hk9pro
        const parts = text.split(' ');
        const deepLinkParam = parts.length > 1 ? parts[1].replace('p_', '') : '';

        // Construct targeted Mini App URL
        const webAppUrl = deepLinkParam
          ? `${APP_URL}?product=${encodeURIComponent(deepLinkParam)}`
          : APP_URL;

        const welcomeText = `
Assalomu alaykum, <b>${escapeHtml(firstName)}</b>! 👋

<b>LUXOR</b> rasmiy do‘koniga xush kelibsiz! ✨
Eng sara smart-gadjetlar va premium tovarlar kafolatlangan sifat bilan siz uchun tayyor.

🚚 <b>Yetkazib berish:</b> Butun O‘zbekiston bo‘ylab 1 kunda (bepul)
💳 <b>To‘lov:</b> Tovarni qabul qilib olganda

Katalogni ko‘rish va xarid qilish uchun pastdagi tugmani bosing: 👇
`.trim();

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeText,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🛍 Do‘konni Ochish ✨',
                    web_app: { url: webAppUrl },
                  },
                ],
              ],
            },
          }),
        });
      }
    }

    // 2. Handle callback queries from Admin buttons
    if (update.callback_query) {
      const cb = update.callback_query;
      const data = cb.data || '';
      const messageId = cb.message?.message_id;
      const chatId = cb.message?.chat.id;

      if (chatId && messageId && data.startsWith('status_')) {
        const parts = data.split('_');
        const statusType = parts[1];
        const orderId = parts[2] || '';

        const statusLabel =
          statusType === 'accept' ? '✅ Qabul qilindi' : '🚚 Yetkazilmoqda';

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: cb.id,
            text: `Buyurtma ${orderId} holati: ${statusLabel}`,
          }),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error handling Telegram bot webhook:', err);
    return NextResponse.json({ ok: true });
  }
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
