import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import Invoice from '@/models/Invoice';

export async function GET() {
  try {
    await dbConnect();

    const [totalOrders, totalProducts, totalCustomers, totalInvoices, orders] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      Customer.countDocuments(),
      Invoice.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(5),
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const recentInvoices = await Invoice.find().sort({ createdAt: -1 }).limit(5);

    return NextResponse.json({
      stats: {
        totalOrders,
        totalProducts,
        totalCustomers,
        totalInvoices,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      recentOrders: orders,
      recentInvoices,
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
