import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const order = await Order.findByIdAndUpdate(id, body, { new: true });
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    console.error('Order PUT error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    await Order.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
