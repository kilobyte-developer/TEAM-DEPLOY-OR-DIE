import { mkdir, writeFile } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'

export const runtime = 'nodejs'

const UPLOADS_DIR = join(process.cwd(), 'backend', 'uploads')

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.py')) {
      return NextResponse.json({ error: 'Only Python (.py) files are supported in MVP mode.' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const fileSize = buffer.byteLength

    await mkdir(UPLOADS_DIR, { recursive: true })
    const filePath = join(UPLOADS_DIR, file.name)
    await writeFile(filePath, Buffer.from(buffer))

    return NextResponse.json({
      id: file.name,
      name: file.name,
      language: 'Python',
      sizeBytes: fileSize,
      sizeLabel: formatBytes(fileSize),
      status: 'Uploaded',
      uploadedAt: new Date().toISOString(),
      repository: 'local-workspace',
      source: 'local',
    })
  } catch {
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
  }
}
