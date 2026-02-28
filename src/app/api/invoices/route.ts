import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Customer from '@/models/Customer';
import Settings from '@/models/Settings';

export async function GET() {
  try {
    await dbConnect();
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Invoices GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

function calculateLoyaltyTier(totalSpent: number): string {
  if (totalSpent >= 5000) return 'platinum';
  if (totalSpent >= 2000) return 'gold';
  if (totalSpent >= 500) return 'silver';
  return 'bronze';
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // Generate invoice number server-side (atomic increment, prevents duplicates)
    let invoiceNumber = body.invoiceNumber as string;
    try {
      let attempts = 0;
      while (attempts < 20) {
        const settingsDoc = await Settings.findOneAndUpdate(
          {},
          { $inc: { invoiceNextNumber: 1 } },
          { new: false, upsert: true, setDefaultsOnInsert: true }
        );
        const prefix = settingsDoc?.invoicePrefix || 'INV';
        const num = (settingsDoc?.invoiceNextNumber ?? 1);
        const candidate = `${prefix}-${String(num).padStart(4, '0')}`;
        const existing = await Invoice.findOne({ invoiceNumber: candidate });
        if (!existing) { invoiceNumber = candidate; break; }
        attempts++;
      }
    } catch (e) {
      console.error('Invoice number generation error:', e);
      // Fall back to timestamp if everything fails
      if (!invoiceNumber) invoiceNumber = `INV-${Date.now()}`;
    }

    const invoice = await Invoice.create({ ...body, invoiceNumber });

    // Update or create customer for loyalty tracking (non-fatal)
    try {
      if (body.customerPhone || body.customerName) {
        const query = body.customerPhone
          ? { phone: body.customerPhone }
          : { name: body.customerName };

        const existing = await Customer.findOne(query);
        if (existing) {
          existing.totalOrders += 1;
          existing.totalSpent += body.total || 0;
          existing.loyaltyPoints += Math.floor((body.total || 0) / 10);
          existing.loyaltyTier = calculateLoyaltyTier(existing.totalSpent);
          if (body.customerName) existing.name = body.customerName;
          if (body.customerEmail) existing.email = body.customerEmail;
          await existing.save();
        } else if (body.customerPhone) {
          // Only create new customer when phone is provided (phone is required in schema)
          const totalSpent = body.total || 0;
          await Customer.create({
            name: body.customerName || 'عميل',
            phone: body.customerPhone,
            email: body.customerEmail || '',
            totalOrders: 1,
            totalSpent,
            loyaltyPoints: Math.floor(totalSpent / 10),
            loyaltyTier: calculateLoyaltyTier(totalSpent),
          });
        }
      }
    } catch (e) {
      console.error('Customer update failed (non-fatal):', e);
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Invoices POST error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
