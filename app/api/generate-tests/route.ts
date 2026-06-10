import { spawnSync } from 'child_process'
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'

export const runtime = 'nodejs'

const BACKEND_DIR = join(process.cwd(), 'backend')
const ENGINE_PATH = join(BACKEND_DIR, 'mvp_engine.py')
const GENERATED_TESTS_DIR = join(BACKEND_DIR, 'generated_tests')
const UPLOADS_DIR = join(BACKEND_DIR, 'uploads')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const fileName = body.file_name ?? body.fileName

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'file_name is required and must be a string.' }, { status: 400 })
    }

    const filePath = join(UPLOADS_DIR, fileName)
    const result = spawnSync('python', [ENGINE_PATH, 'generate-tests', filePath, GENERATED_TESTS_DIR], {
      cwd: BACKEND_DIR,
      encoding: 'utf-8',
    })

    if (result.status !== 0) {
      const errorMessage = result.stderr.trim() || 'Test generation failed.'
      const status = errorMessage.includes('File not found') ? 404 : 500
      return NextResponse.json({ error: errorMessage }, { status })
    }

    return NextResponse.json(JSON.parse(result.stdout))
  } catch {
    return NextResponse.json({ error: 'Test generation failed' }, { status: 500 })
  }
}
