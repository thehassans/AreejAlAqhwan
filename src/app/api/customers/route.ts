import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';

export async function GET() {
  try {
    await dbConnect();
    const customers = await Customer.find().sort({ totalSpent: -1 });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Customers GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
