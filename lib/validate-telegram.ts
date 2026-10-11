import crypto from 'crypto';

/**
 * Validates Telegram WebApp initData string using HMAC-SHA256 signature verification.
 * Follows official Telegram documentation:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramWebAppData(initData: string, botToken: string): boolean {
  if (!initData || !botToken) {
    // If not in production or token missing, return true for dev preview
    if (process.env.NODE_ENV !== 'production' || !botToken) {
      return true;
    }
    return false;
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return false;

    urlParams.delete('hash');

    // Sort parameters alphabetically
    const paramsList: string[] = [];
    urlParams.sort();
    urlParams.forEach((val, key) => {
      paramsList.push(`${key}=${val}`);
    });
    const dataCheckString = paramsList.join('\n');

    // Secret key = HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculated hash = HMAC_SHA256(secretKey, dataCheckString)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  } catch (err) {
    console.error('Error validating Telegram initData:', err);
    return false;
  }
}
