import crypto from 'crypto';

const QR_SECRET = process.env.QR_SECRET || 'areej-qr-attendance-secret-2024';

export function generateDailyQRValue(date: string): string {
  const hmac = crypto.createHmac('sha256', QR_SECRET);
  hmac.update(`AREEJ-ATTENDANCE-${date}`);
  const digest = hmac.digest('hex').substring(0, 10);
  return `AREEJ-ATT-${date}-${digest}`;
}

export function validateQRCode(qrValue: string): { valid: boolean; date: string; message: string } {
  if (!qrValue || typeof qrValue !== 'string') {
    return { valid: false, date: '', message: 'رمز QR غير صالح' };
  }
  const regex = /^AREEJ-ATT-(\d{4}-\d{2}-\d{2})-([a-f0-9]{10})$/;
  const match = qrValue.match(regex);
  if (!match) {
    return { valid: false, date: '', message: 'صيغة رمز QR غير صحيحة' };
  }
  const date = match[1];
  const providedDigest = match[2];
  const expected = generateDailyQRValue(date);
  const expectedDigest = expected.split('-').pop();
  if (providedDigest !== expectedDigest) {
    return { valid: false, date, message: 'رمز QR غير صحيح' };
  }
  const today = new Date().toLocaleDateString('en-CA');
  if (date !== today) {
    return { valid: false, date, message: 'رمز QR منتهي الصلاحية، يرجى مسح الرمز اليومي الحالي' };
  }
  return { valid: true, date, message: 'رمز QR صحيح' };
}
