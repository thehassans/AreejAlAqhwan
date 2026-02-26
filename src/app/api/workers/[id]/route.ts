import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Worker from '@/models/Worker';
import bcrypt from 'bcryptjs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const worker = await Worker.findById(id).select('-password');
    if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    return NextResponse.json(worker);
  } catch (error) {
    console.error('Worker GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch worker' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const { name, phone, email, password, pageAccess, isActive } = await req.json();

    const updateData: Record<string, unknown> = { name, phone, email, pageAccess, isActive };
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const worker = await Worker.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    return NextResponse.json(worker);
  } catch (error) {
    console.error('Worker PUT error:', error);
    return NextResponse.json({ error: 'Failed to update worker' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    await Worker.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Worker DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete worker' }, { status: 500 });
  }
}
