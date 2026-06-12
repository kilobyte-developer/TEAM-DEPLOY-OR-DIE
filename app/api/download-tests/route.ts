import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'

const GENERATED_TESTS_DIR = '/tmp/testgenai_generated_tests'
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL ?? 'http://localhost:8000'

/** True when running on Vercel / any remote deployment (not local dev). */
function isRemote() {
  return !FASTAPI_URL.includes('localhost') && !FASTAPI_URL.includes('127.0.0.1')
}

export async function GET() {
  // ── Remote (Vercel → Render) ─────────────────────────────────────────────
  if (isRemote()) {
    try {
      const resp = await fetch(`${FASTAPI_URL}/download-tests`)
      if (!resp.ok) {
        return NextResponse.json(
          { error: 'No generated tests found. Run test generation first.' },
          { status: resp.status },
        )
      }
      const text = await resp.text()
      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/x-python',
          'Content-Disposition': 'attachment; filename="test_generated.py"',
        },
      })
    } catch {
      return NextResponse.json({ error: 'Failed to download tests' }, { status: 500 })
    }
  }

  // ── Local dev ────────────────────────────────────────────────────────────
  try {
    const testFilePath = join(GENERATED_TESTS_DIR, 'test_generated.py')
    const fileContent = await readFile(testFilePath, 'utf-8')

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/x-python',
        'Content-Disposition': 'attachment; filename="test_generated.py"',
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return NextResponse.json(
        { error: 'No generated tests found. Run test generation first.' },
        { status: 404 },
      )
    }
    return NextResponse.json({ error: 'Failed to download tests' }, { status: 500 })
  }
}
