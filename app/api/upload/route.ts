import { mkdir, writeFile } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { testgenaiDatabase } from '@/database/services/TestGenAIDatabaseService'

export const runtime = 'nodejs'

const UPLOADS_DIR = '/tmp/testgenai_uploads'
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL ?? 'http://localhost:8000'

/** True when running on Vercel / any remote deployment (not local dev). */
function isRemote() {
  return !FASTAPI_URL.includes('localhost') && !FASTAPI_URL.includes('127.0.0.1')
}

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

    // ── Remote (Vercel → Render) ─────────────────────────────────────────────
    // On Vercel there is no local Python runtime. Forward the upload to the
    // FastAPI backend on Render so the file lives alongside the analyze/run
    // endpoints that will process it.
    if (isRemote()) {
      const proxyForm = new FormData()
      proxyForm.append('file', file)

      const resp = await fetch(`${FASTAPI_URL}/upload`, {
        method: 'POST',
        body: proxyForm,
      })

      const data = await resp.json()
      if (!resp.ok) {
        return NextResponse.json({ error: data?.detail ?? 'Upload failed on backend.' }, { status: resp.status })
      }
      return NextResponse.json(data)
    }

    // ── Local dev ────────────────────────────────────────────────────────────
    const buffer = await file.arrayBuffer()
    const fileSize = buffer.byteLength

    await mkdir(UPLOADS_DIR, { recursive: true })
    const filePath = join(UPLOADS_DIR, file.name)
    await writeFile(filePath, Buffer.from(buffer))
    const uploadedAt = new Date().toISOString()

    await testgenaiDatabase.recordUpload({
      fileName: file.name,
      filePath,
      language: 'Python',
      fileSize,
      repositoryName: 'local-workspace',
      sourceType: 'local',
      uploadedAt,
    })

    return NextResponse.json({
      id: file.name,
      name: file.name,
      language: 'Python',
      sizeBytes: fileSize,
      sizeLabel: formatBytes(fileSize),
      status: 'Uploaded',
      uploadedAt,
      repository: 'local-workspace',
      source: 'local',
    })
  } catch {
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
  }
}
