import { spawnSync } from 'child_process'
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { testgenaiDatabase } from '@/database/services/TestGenAIDatabaseService'
import { VENV_PYTHON, BACKEND_DIR } from '@/lib/python-resolver'

export const runtime = 'nodejs'

const ENGINE_PATH = join(BACKEND_DIR, 'mvp_engine.py')
const UPLOADS_DIR = '/tmp/testgenai_uploads'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const fileName = body.file_name ?? body.fileName

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'file_name is required and must be a string.' }, { status: 400 })
    }

    const filePath = join(UPLOADS_DIR, fileName)
    const result = spawnSync(VENV_PYTHON, [ENGINE_PATH, 'analyze', filePath], {
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
