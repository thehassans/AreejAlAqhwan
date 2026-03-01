import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAdminFromToken } from '@/lib/auth';
import Invoice from '@/models/Invoice';
import Order from '@/models/Order';
import Customer from '@/models/Customer';

const ALLOWED = ['invoices', 'orders', 'customers'] as const;
type Collection = typeof ALLOWED[number];

export async function DELETE(req: NextRequest) {
  try {
    const payload = await getAdminFromToken();
    if (!payload) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { collection } = await req.json() as { collection: Collection };
    if (!ALLOWED.includes(collection)) {
      return NextResponse.json({ error: 'مجموعة غير صالحة' }, { status: 400 });
    }

    await dbConnect();

    let deleted = 0;
    if (collection === 'invoices') {
      const r = await Invoice.deleteMany({});
      deleted = r.deletedCount;
    } else if (collection === 'orders') {
      const r = await Order.deleteMany({});
      deleted = r.deletedCount;
    } else if (collection === 'customers') {
      const r = await Customer.deleteMany({});
      deleted = r.deletedCount;
    }

    return NextResponse.json({ success: true, deleted });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
