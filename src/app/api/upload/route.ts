import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    let files = formData.getAll('files') as File[];
    if (!files.length) {
      const single = formData.get('file') as File | null;
      if (single) files = [single];
    }
    const type = (formData.get('type') as string) || (formData.get('folder') as string) || 'products';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type);
    await mkdir(uploadDir, { recursive: true });

    const urls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const ext = path.extname(originalName).toLowerCase();
      
      let finalName: string;
      let finalBuffer: Buffer;

      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].includes(ext)) {
        // Convert images to webp
        finalName = `${timestamp}-${path.basename(originalName, ext)}.webp`;
        finalBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
      } else if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) {
        // Keep videos as-is (webm conversion would need ffmpeg)
        finalName = `${timestamp}-${originalName}`;
        finalBuffer = buffer;
      } else {
        finalName = `${timestamp}-${originalName}`;
        finalBuffer = buffer;
      }

      const filePath = path.join(uploadDir, finalName);
      await writeFile(filePath, finalBuffer);
      urls.push(`/uploads/${type}/${finalName}`);
    }

    return NextResponse.json({ urls, url: urls[0] || null });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
