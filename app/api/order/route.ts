import { NextRequest, NextResponse } from 'next/server';
import { OrderSubmission } from '@/lib/types';
import { validateTelegramWebAppData } from '@/lib/validate-telegram';
import { notifyAdminNewOrder, sendCustomerOrderReceipt } from '@/lib/telegram';
import { appendOrderToGoogleSheets } from '@/lib/google-sheets';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    const body: OrderSubmission = await req.json();

    if (!body || !body.customer || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Buyurtma maʼlumotlari toʻliq emas' },
        { status: 400 }
      );
    }

    // Security check: validate initData signature if provided
    if (body.initData && BOT_TOKEN) {
      const isValid = validateTelegramWebAppData(body.initData, BOT_TOKEN);
      if (!isValid && process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, message: 'Autentifikatsiya xatosi: Soxta soʻrov aniqlandi' },
          { status: 403 }
        );
      }
    }

    // Ensure order ID and timestamp exist
    if (!body.id) {
      body.id = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    if (!body.createdAt) {
      const now = new Date();
      body.createdAt = now.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });
    }

    // Execute background notifications and CRM logging concurrently
    const [adminNotification, sheetsSync, customerReceipt] = await Promise.allSettled([
      notifyAdminNewOrder(body),
      appendOrderToGoogleSheets(body),
      sendCustomerOrderReceipt(body),
    ]);

    console.log(`Order ${body.id} processed:`, {
      adminNotification: adminNotification.status,
      sheetsSync: sheetsSync.status,
      customerReceipt: customerReceipt.status,
    });

    return NextResponse.json({
      success: true,
      message: 'Buyurtma muvaffaqiyatli qabul qilindi',
      orderId: body.id,
    });
  } catch (error) {
    console.error('Error in /api/order:', error);
    return NextResponse.json(
      { success: false, message: 'Serverda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
