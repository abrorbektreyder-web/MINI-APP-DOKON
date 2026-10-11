import { OrderSubmission } from './types';

const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.TELEGRAM__T_TOKEN ||
  '8719208102:AAGcxrZ6CKXmHjt5yCCJpxWS2NJQQ7cIiiE';

const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '6377333240';

/**
 * Sends a message via Telegram Bot API
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: {
    parse_mode?: 'HTML' | 'MarkdownV2';
    reply_markup?: unknown;
  }
) {
  if (!BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN is not configured. Message not sent.');
    return null;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parse_mode || 'HTML',
        reply_markup: options?.reply_markup,
      }),
    });

    return await res.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return null;
  }
}

/**
 * Sends a new order notification to the admin chat or group
 */
export async function notifyAdminNewOrder(order: OrderSubmission) {
  if (!ADMIN_CHAT_ID) {
    console.warn('TELEGRAM_ADMIN_CHAT_ID is not configured.');
    return null;
  }

  const itemsList = order.items
    .map(
      (item) =>
        `• <b>${item.title}</b>\n  └ ${item.quantity} dona × ${item.price.toLocaleString('uz-UZ')} so'm [${item.size || 'Standard'} / ${item.color || 'Asosiy'}]`
    )
    .join('\n');

  const tgUsername = order.telegramUser?.username
    ? `@${order.telegramUser.username}`
    : order.telegramUser?.id
    ? `ID: ${order.telegramUser.id}`
    : `Mavjud emas`;

  const paymentText =
    order.customer.paymentMethod === 'card_on_delivery'
      ? 'Karta orqali qabul qilinganda'
      : 'Naqd pul orqali qabul qilinganda';

  const message = `
🔥 <b>YANGI BUYURTMA: ${order.id}</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Mijoz:</b> ${escapeHtml(order.customer.fullName)}
📞 <b>Telefon:</b> <code>${escapeHtml(order.customer.phone)}</code>
📍 <b>Viloyat:</b> ${escapeHtml(order.customer.region)}
🏡 <b>Manzil:</b> ${escapeHtml(order.customer.address)}
💬 <b>Telegram:</b> ${tgUsername}
💳 <b>To'lov:</b> ${paymentText}
${order.customer.comment ? `📝 <b>Izoh:</b> ${escapeHtml(order.customer.comment)}\n` : ''}
📦 <b>Buyurtma tarkibi:</b>
${itemsList}

💰 <b>JAMI SUMMA:</b> <b>${order.totalAmount.toLocaleString('uz-UZ')} so'm</b>
━━━━━━━━━━━━━━━━━━
⏰ <b>Sana:</b> ${order.createdAt}
Holat: 🟡 <b>Yangi buyurtma</b>
`.trim();

  return await sendTelegramMessage(ADMIN_CHAT_ID, message, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Qabul qilindi', callback_data: `status_accept_${order.id}` },
          { text: '🚚 Yetkazilmoqda', callback_data: `status_shipping_${order.id}` },
        ],
        [
          { text: '📞 Qoʻngʻiroq qilish', url: `tel:${order.customer.phone.replace(/[^0-9+]/g, '')}` },
        ],
      ],
    },
  });
}

/**
 * Sends a confirmation receipt to the buyer in their private Telegram chat
 */
export async function sendCustomerOrderReceipt(order: OrderSubmission) {
  const customerTgId = order.telegramUser?.id;
  if (!customerTgId) return null;

  const receipt = `
🎉 <b>Hurmatli ${escapeHtml(order.customer.fullName)}!</b>

Sizning <b>${order.id}</b> raqamli buyurtmangiz muvaffaqiyatli qabul qilindi.

📦 <b>Jami summa:</b> ${order.totalAmount.toLocaleString('uz-UZ')} so'm
📍 <b>Yetkazish manzili:</b> ${escapeHtml(order.customer.region)}, ${escapeHtml(order.customer.address)}

Operatorimiz tez orada siz bilan <code>${escapeHtml(order.customer.phone)}</code> raqami orqali bog'lanadi.

<b>LUXOR</b> do'konini tanlaganingiz uchun tashakkur! ✨
`.trim();

  return await sendTelegramMessage(customerTgId, receipt, { parse_mode: 'HTML' });
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
