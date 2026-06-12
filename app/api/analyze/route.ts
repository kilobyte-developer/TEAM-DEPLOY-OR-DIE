import { spawnSync } from 'child_process'
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { testgenaiDatabase } from '@/database/services/TestGenAIDatabaseService'
import { getVenvPython, BACKEND_DIR } from '@/lib/python-resolver'

export const runtime = 'nodejs'

const ENGINE_PATH = join(BACKEND_DIR, 'mvp_engine.py')
const UPLOADS_DIR = '/tmp/testgenai_uploads'
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL ?? 'http://localhost:8000'

/** True when running on Vercel / any remote deployment (not local dev). */
function isRemote() {
  return !FASTAPI_URL.includes('localhost') && !FASTAPI_URL.includes('127.0.0.1')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const fileName = body.file_name ?? body.fileName

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'file_name is required and must be a string.' }, { status: 400 })
    }

    // ── Remote (Vercel → Render) ─────────────────────────────────────────────
    // On Vercel there is no local Python/venv. Proxy to the FastAPI backend on
    // Render where the file was uploaded and mvp_engine.py is available.
    if (isRemote()) {
      const resp = await fetch(`${FASTAPI_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: fileName }),
      })

      const data = await resp.json()
      if (!resp.ok) {
        return NextResponse.json({ error: data?.detail ?? 'Analysis failed.' }, { status: resp.status })
      }

      await testgenaiDatabase.recordAnalysis(fileName, data)
      return NextResponse.json(data)
    }

    // ── Local dev ────────────────────────────────────────────────────────────
    const filePath = join(UPLOADS_DIR, fileName)
    const result = spawnSync(getVenvPython(), [ENGINE_PATH, 'analyze', filePath], {
      cwd: BACKEND_DIR,
      encoding: 'utf-8',
    })

    if (result.status !== 0) {
      const errorMessage = result.stderr.trim() || 'Analysis failed.'
      const status = errorMessage.includes('File not found') ? 404 : 500
      return NextResponse.json({ error: errorMessage }, { status })
    }

    const payload = JSON.parse(result.stdout)
    await testgenaiDatabase.recordAnalysis(fileName, payload)

    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
