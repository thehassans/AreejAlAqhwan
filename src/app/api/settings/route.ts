import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Settings from '@/models/Settings';
import { DEFAULT_INVOICE_WHATSAPP_MESSAGE } from '@/lib/invoiceWhatsApp';

const normalizeSettingsPayload = (body: Record<string, unknown>) => ({
  ...body,
  invoiceWhatsappMessage: typeof body.invoiceWhatsappMessage === 'string' && body.invoiceWhatsappMessage.trim()
    ? body.invoiceWhatsappMessage
    : DEFAULT_INVOICE_WHATSAPP_MESSAGE,
});

export async function GET() {
  try {
    await dbConnect();
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    } else if (!settings.invoiceWhatsappMessage) {
      settings.invoiceWhatsappMessage = DEFAULT_INVOICE_WHATSAPP_MESSAGE;
      await settings.save();
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const body = normalizeSettingsPayload(await req.json());
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(body);
    } else {
      Object.assign(settings, body);
      await settings.save();
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
