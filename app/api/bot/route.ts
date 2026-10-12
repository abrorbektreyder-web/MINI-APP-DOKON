import { NextRequest, NextResponse } from 'next/server';
import { setRuntimeGroupId } from '@/lib/telegram';

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
      title?: string;
    };
    text?: string;
    new_chat_members?: Array<{
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    }>;
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

    // 1. Handle incoming user / group messages
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const chatType = msg.chat.type;
      const text = msg.text ? msg.text.trim() : '';
      const fromUsername = msg.from?.username?.toLowerCase();
      const firstName = msg.from?.first_name || 'Xaridor';

      // A) Handle Bot being added to a Telegram Group or Supergroup
      if (msg.new_chat_members && Array.isArray(msg.new_chat_members)) {
        const botWasAdded = msg.new_chat_members.some(
          (m) => m.is_bot && (m.username === 'Luxordokon_bot' || m.id === 8719208102)
        );
        if (botWasAdded) {
          setRuntimeGroupId(chatId);
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `🎉 <b>LUXOR Savdo Boti guruhga muvaffaqiyatli ulandi!</b>\n\n📌 <b>Guruh Chat ID:</b> <code>${chatId}</code>\n\nEndi yangi tushgan barcha buyurtmalar ushbu guruhga avtomatik yetkaziladi. 🚀📦\n\n<i>Doimiy saqlash uchun Vercel'da <b>TELEGRAM_GROUP_CHAT_ID</b> = <code>${chatId}</code> qilib qo'yishingiz mumkin.</i>`,
              parse_mode: 'HTML',
            }),
          });
          return NextResponse.json({ ok: true });
        }
      }

      // B) Handle forwarded message from a group
      if ((msg as any).forward_from_chat) {
        const fwChat = (msg as any).forward_from_chat;
        const forwardedChatId = fwChat.id;
        const groupTitle = fwChat.title || 'Buyurtmalar guruhi';
        setRuntimeGroupId(forwardedChatId);

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🎉 <b>"${groupTitle}" guruhi muvaffaqiyatli aniqlandi va ulandi!</b>\n\n📌 <b>Guruh Chat ID:</b> <code>${forwardedChatId}</code>\n\nEndi yangi tushgan barcha buyurtmalar to'g'ridan-to'g'ri ushbu guruhga boradi! 🚀📦`,
            parse_mode: 'HTML',
          }),
        });
        return NextResponse.json({ ok: true });
      }

      // C) Handle ANY message inside a Group or Supergroup
      if (chatType === 'group' || chatType === 'supergroup') {
        setRuntimeGroupId(chatId);

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `✅ <b>"${msg.chat.title || 'LUXOR-BUYURTMALAR'}" guruhi ulandi!</b>\n\n📌 <b>Guruh Chat ID:</b> <code>${chatId}</code>\n\nEndi yangi buyurtmalar ushbu guruhga yuboriladi! 🚀📦`,
            parse_mode: 'HTML',
          }),
        });

        // Also notify the store owner in private chat
        if (chatId !== 6377333240) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: 6377333240,
              text: `📢 <b>"${msg.chat.title || 'Guruh'}" guruhi ulandi!</b>\n\n📌 Guruh ID: <code>${chatId}</code>\nBuyurtmalar endi ushbu guruhga yetkaziladi.`,
              parse_mode: 'HTML',
            }),
          });
        }

        return NextResponse.json({ ok: true });
      }

      // C) Handle Private Chat messages (Admin or Customer)
      if (text.startsWith('/start')) {
        const isOwner =
          chatId === 6377333240 ||
          String(chatId) === '6377333240' ||
          fromUsername === 'abrorjon_dev';

        // Parse deep-link parameter: /start hk9pro -> param is hk9pro
        const parts = text.split(' ');
        const deepLinkParam = parts.length > 1 ? parts[1].replace('p_', '') : '';

        // Construct targeted Mini App URL
        let webAppUrl = APP_URL;
        if (isOwner) {
          webAppUrl = deepLinkParam
            ? `${APP_URL}?product=${encodeURIComponent(deepLinkParam)}&admin=6377333240`
            : `${APP_URL}?admin=6377333240`;
        } else if (deepLinkParam) {
          webAppUrl = `${APP_URL}?product=${encodeURIComponent(deepLinkParam)}`;
        }

        const welcomeText = isOwner
          ? `
Assalomu alaykum, <b>Hurmatli Do‘kon Egasi</b>! 👑

<b>LUXOR</b> boshqaruv tizimiga xush kelibsiz!
Siz do‘konga yangi mahsulotlar qo‘shishingiz, narx va chegirmalarni tahrirlashingiz hamda tovarlarni o‘chirishingiz mumkin.

Pastdagi tugmani bosib, admin rejimida to‘liq boshqaring: 👇
`.trim()
          : `
Assalomu alaykum, <b>${escapeHtml(firstName)}</b>! 👋

<b>LUXOR</b> rasmiy do‘koniga xush kelibsiz! ✨
Eng sara smart-gadjetlar va premium tovarlar kafolatlangan sifat bilan siz uchun tayyor.

🚚 <b>Yetkazib berish:</b> Butun O‘zbekiston bo‘ylab 1 kunda (bepul)
💳 <b>To‘lov:</b> Tovarni qabul qilib olganda

Katalogni ko‘rish va xarid qilish uchun pastdagi tugmani bosing: 👇
`.trim();

        const buttonText = isOwner
          ? '🛍 Do‘konni Boshqarish (Admin) 👑'
          : '🛍 Do‘konni Ochish ✨';

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
                    text: buttonText,
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
