import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const UPLOADS_DIR = join(process.cwd(), 'backend', 'uploads');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.py')) {
      return NextResponse.json(
        { error: 'Only .py files are allowed' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const fileSize = buffer.byteLength;

    await mkdir(UPLOADS_DIR, { recursive: true });
    const filePath = join(UPLOADS_DIR, file.name);
    await writeFile(filePath, Buffer.from(buffer));

    return NextResponse.json({
      file_name: file.name,
      file_size: `${(fileSize / 1024).toFixed(2)} KB`,
      status: 'uploaded',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    );
  }
}
