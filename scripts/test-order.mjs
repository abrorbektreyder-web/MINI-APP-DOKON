const BOT_TOKEN = '8719208102:AAGcxrZ6CKXmHjt5yCCJpxWS2NJQQ7cIiiE';
const CHANNEL_ID = -1003859670239;

const message = `
🔥 <b>YANGI BUYURTMA: #ORD-7777</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Mijoz:</b> Abrorbek
📞 <b>Telefon:</b> <code>+998901234567</code>
📍 <b>Viloyat:</b> Toshkent shahri
🏡 <b>Manzil:</b> Chilonzor tumani
💬 <b>Telegram:</b> @abrorjon_dev
💳 <b>To'lov:</b> Naqd pul orqali qabul qilinganda

📦 <b>Buyurtma tarkibi:</b>
• <b>HK9 Pro+ Smart Watch</b>
  └ 1 dona × 360 000 so'm [Qora / 45mm]

💰 <b>JAMI SUMMA:</b> <b>360 000 so'm</b>
━━━━━━━━━━━━━━━━━━
⏰ <b>Sana:</b> 12.10.2026, 15:07
Holat: 🟡 <b>Yangi buyurtma</b>
`.trim();

async function run() {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHANNEL_ID,
      text: message,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Qabul qilindi', callback_data: 'status_accept_ORD-7777' },
            { text: '🚚 Yetkazilmoqda', callback_data: 'status_shipping_ORD-7777' }
          ],
          [
            { text: '💬 Mijoz bilan yozishish', url: 'https://t.me/abrorjon_dev' }
          ]
        ]
      }
    })
  });
  console.log(await res.json());
}

run();
