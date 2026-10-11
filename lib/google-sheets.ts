import { google } from 'googleapis';
import { OrderSubmission } from './types';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
// Handle escaped newlines in environment variable
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

/**
 * Appends an order row to Google Sheets CRM (Orders sheet)
 * Columns:
 * A: Sana va Vaqt
 * B: Buyurtma ID
 * C: Mijoz Ismi
 * D: Telefon Raqami
 * E: Viloyat va Manzil
 * F: Buyurtma Tarkibi
 * G: Jami Summa
 * H: Telegram Username
 * I: Status (Yangi)
 */
export async function appendOrderToGoogleSheets(order: OrderSubmission): Promise<boolean> {
  if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    console.warn(
      'Google Sheets credentials not fully configured in environment. Skipping sheet sync.'
    );
    return false;
  }

  try {
    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const itemsSummary = order.items
      .map(
        (item) =>
          `${item.title} (${item.quantity} dona, ${item.size || 'std'}/${item.color || 'def'})`
      )
      .join('; ');

    const tgUsername = order.telegramUser?.username
      ? `@${order.telegramUser.username}`
      : order.telegramUser?.id
      ? `ID: ${order.telegramUser.id}`
      : '-';

    const rowData = [
      order.createdAt,
      order.id,
      order.customer.fullName,
      order.customer.phone,
      `${order.customer.region}, ${order.customer.address}`,
      itemsSummary,
      `${order.totalAmount.toLocaleString('uz-UZ')} so'm`,
      tgUsername,
      'Yangi',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Buyurtmalar!A:I',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowData],
      },
    });

    return true;
  } catch (error) {
    console.error('Error appending row to Google Sheets:', error);
    return false;
  }
}
