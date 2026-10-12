import fs from 'fs';
import path from 'path';
import os from 'os';
import { OrderSubmission } from './types';

const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.TELEGRAM__T_TOKEN ||
  '8719208102:AAGcxrZ6CKXmHjt5yCCJpxWS2NJQQ7cIiiE';

const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '6377333240';
const GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID || process.env.TELEGRAM_GROUP_ID || '-1003859670239';

// In-memory runtime group storage
let runtimeGroupId: string | number | null = null;
const TMP_GROUP_FILE = path.join(os.tmpdir(), 'luxor_group_id.txt');

export function setRuntimeGroupId(id: string | number): void {
  runtimeGroupId = id;
  try {
    fs.writeFileSync(TMP_GROUP_FILE, String(id), 'utf-8');
  } catch {
    // ignore tmp write errors in read-only environments
  }
}

export function getRuntimeGroupId(): string | number | null {
  if (runtimeGroupId) return runtimeGroupId;
  try {
    if (fs.existsSync(TMP_GROUP_FILE)) {
      const val = fs.readFileSync(TMP_GROUP_FILE, 'utf-8').trim();
      if (val) {
        runtimeGroupId = val;
        return val;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Returns all recipient chat IDs (Admin private chat and configured groups)
 */
export function getRecipientChatIds(): (string | number)[] {
  const ids = new Set<string | number>();

  if (ADMIN_CHAT_ID) {
    ADMIN_CHAT_ID.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((id) => ids.add(id));
  }

  if (GROUP_CHAT_ID) {
    GROUP_CHAT_ID.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((id) => ids.add(id));
  }

  const dynGroup = getRuntimeGroupId();
  if (dynGroup) {
    ids.add(dynGroup);
  }

  return Array.from(ids);
}

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

    const data = await res.json();
    if (!data.ok) {
      console.error(`Telegram sendMessage failed for chat ${chatId}:`, data);
    }
    return data;
  } catch (error) {
    console.error(`Error sending Telegram message to ${chatId}:`, error);
    return null;
  }
}

/**
 * Sends a new order notification to the admin chat and group
 */
export async function notifyAdminNewOrder(order: OrderSubmission) {
  const recipientIds = getRecipientChatIds();
  if (recipientIds.length === 0) {
    console.warn('No Telegram admin or group chat IDs configured.');
    return null;
  }

  const itemsList = (order.items || [])
    .map((item) => {
      const itemTitle = item.title || 'Mahsulot';
      const itemQty = item.quantity || 1;
      const itemPrice = typeof item.price === 'number' ? item.price.toLocaleString('uz-UZ') : '0';
      const itemSize = item.size || (item as unknown as { selectedSize?: string })?.selectedSize || 'Standart';
      const itemColor = item.color || (item as unknown as { selectedColor?: string })?.selectedColor || 'Asosiy';
      return `• <b>${escapeHtml(itemTitle)}</b>\n  └ ${itemQty} dona × ${itemPrice} so'm [${escapeHtml(itemSize)} / ${escapeHtml(itemColor)}]`;
    })
    .join('\n');

  const tgUsername = order.telegramUser?.username
    ? `@${order.telegramUser.username}`
    : order.telegramUser?.id
    ? `ID: ${order.telegramUser.id}`
    : `Mavjud emas`;

  const customerName = order.customer?.fullName || (order.customer as unknown as { name?: string })?.name || 'Mijoz';
  const customerPhone = order.customer?.phone || 'Mavjud emas';
  const customerRegion = order.customer?.region || '';
  const customerAddress = order.customer?.address || '';
  const totalAmountNum = typeof order.totalAmount === 'number'
    ? order.totalAmount
    : typeof (order as unknown as { total?: number })?.total === 'number'
    ? (order as unknown as { total: number }).total
    : 0;

  const paymentText =
    order.customer?.paymentMethod === 'card_on_delivery'
      ? 'Karta orqali qabul qilinganda'
      : 'Naqd pul orqali qabul qilinganda';

  const message = `
🔥 <b>YANGI BUYURTMA: ${order.id}</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Mijoz:</b> ${escapeHtml(customerName)}
📞 <b>Telefon:</b> <code>${escapeHtml(customerPhone)}</code>
${customerRegion ? `📍 <b>Viloyat:</b> ${escapeHtml(customerRegion)}\n` : ''}🏡 <b>Manzil:</b> ${escapeHtml(customerAddress)}
💬 <b>Telegram:</b> ${tgUsername}
💳 <b>To'lov:</b> ${paymentText}
${order.customer?.comment ? `📝 <b>Izoh:</b> ${escapeHtml(order.customer.comment)}\n` : ''}
📦 <b>Buyurtma tarkibi:</b>
${itemsList}

💰 <b>JAMI SUMMA:</b> <b>${totalAmountNum.toLocaleString('uz-UZ')} so'm</b>
━━━━━━━━━━━━━━━━━━
⏰ <b>Sana:</b> ${order.createdAt}
Holat: 🟡 <b>Yangi buyurtma</b>
`.trim();

  // Telegram Inline Keyboard
  // Note: Telegram rejects 'tel:' URLs in inline buttons with a 400 Bad Request error.
  // Phone numbers are placed inside <code></code> tags in message body for instant tap-to-call/copy.
  const inlineButtons: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [
    [
      { text: '✅ Qabul qilindi', callback_data: `status_accept_${order.id}` },
      { text: '🚚 Yetkazilmoqda', callback_data: `status_shipping_${order.id}` },
    ],
  ];

  if (order.telegramUser?.username) {
    inlineButtons.push([
      {
        text: '💬 Mijozga yozish',
        url: `https://t.me/${order.telegramUser.username.replace('@', '')}`,
      },
    ]);
  }

  const sendPromises = recipientIds.map((targetId) =>
    sendTelegramMessage(targetId, message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: inlineButtons,
      },
    })
  );

  const results = await Promise.allSettled(sendPromises);
  return results;
}

/**
 * Sends a confirmation receipt to the buyer in their private Telegram chat
 */
export async function sendCustomerOrderReceipt(order: OrderSubmission) {
  const customerTgId = order.telegramUser?.id;
  if (!customerTgId) return null;

  const customerName = order.customer?.fullName || (order.customer as unknown as { name?: string })?.name || 'Mijoz';
  const customerPhone = order.customer?.phone || 'Mavjud emas';
  const customerRegion = order.customer?.region || '';
  const customerAddress = order.customer?.address || '';
  const totalAmountNum = typeof order.totalAmount === 'number'
    ? order.totalAmount
    : typeof (order as unknown as { total?: number })?.total === 'number'
    ? (order as unknown as { total: number }).total
    : 0;

  const addressLine = [customerRegion, customerAddress].filter(Boolean).join(', ');

  const receipt = `
🎉 <b>Hurmatli ${escapeHtml(customerName)}!</b>

Sizning <b>${order.id}</b> raqamli buyurtmangiz muvaffaqiyatli qabul qilindi.

📦 <b>Jami summa:</b> ${totalAmountNum.toLocaleString('uz-UZ')} so'm
${addressLine ? `📍 <b>Yetkazish manzili:</b> ${escapeHtml(addressLine)}\n` : ''}
Operatorimiz tez orada siz bilan <code>${escapeHtml(customerPhone)}</code> raqami orqali bog'lanadi.

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
