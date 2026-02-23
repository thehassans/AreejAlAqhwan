import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const invoice = await Invoice.findById(id);
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Invoice GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    await Invoice.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invoice DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
