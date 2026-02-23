import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Customer from '@/models/Customer';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const orderNumber = searchParams.get('orderNumber');
    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') filter.status = status;
    if (orderNumber) filter.orderNumber = orderNumber;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const order = await Order.create({ ...body, orderNumber });

    // Update or create customer
    const existing = await Customer.findOne({ phone: body.customer.phone });
    if (existing) {
      existing.totalOrders += 1;
      existing.totalSpent += body.total;
      existing.loyaltyPoints += Math.floor(body.total);
      if (existing.totalSpent >= 5000) existing.loyaltyTier = 'platinum';
      else if (existing.totalSpent >= 2000) existing.loyaltyTier = 'gold';
      else if (existing.totalSpent >= 500) existing.loyaltyTier = 'silver';
      await existing.save();
    } else {
      await Customer.create({
        name: body.customer.name,
        phone: body.customer.phone,
        email: body.customer.email || '',
        city: body.customer.city || '',
        address: body.customer.address || '',
        totalOrders: 1,
        totalSpent: body.total,
        loyaltyPoints: Math.floor(body.total),
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
