import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');

    const filter: Record<string, unknown> = {};
    if (category && category !== 'الكل' && category !== 'all') filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const product = await Product.create(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
