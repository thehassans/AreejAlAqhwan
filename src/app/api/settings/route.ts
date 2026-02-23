import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Settings from '@/models/Settings';

export async function GET() {
  try {
    await dbConnect();
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
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
    const body = await req.json();
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
