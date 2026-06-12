import { readFile } from 'fs/promises'
import { NextResponse } from 'next/server'
import { join } from 'path'

export const runtime = 'nodejs'

const REPORTS_DIR = '/tmp/testgenai_reports'
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL ?? 'http://localhost:8000'

/** True when running on Vercel / any remote deployment (not local dev). */
function isRemote() {
  return !FASTAPI_URL.includes('localhost') && !FASTAPI_URL.includes('127.0.0.1')
}

export async function GET() {
  // ── Remote (Vercel → Render) ─────────────────────────────────────────────
  if (isRemote()) {
    try {
      const resp = await fetch(`${FASTAPI_URL}/results`)
      const data = await resp.json()
      return NextResponse.json(data, { status: resp.status })
    } catch {
      return NextResponse.json({
        mode: 'source-code',
        status: 'idle',
        generatedAt: new Date().toISOString(),
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        executionTime: '0.00s',
        passRate: 0,
        logs: [],
      })
    }
  }

  // ── Local dev ────────────────────────────────────────────────────────────
  try {
    const resultsPath = join(REPORTS_DIR, 'results.json')
    const fileContent = await readFile(resultsPath, 'utf-8')
    return NextResponse.json(JSON.parse(fileContent))
  } catch {
    return NextResponse.json({
      mode: 'source-code',
      status: 'idle',
      generatedAt: new Date().toISOString(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      executionTime: '0.00s',
      passRate: 0,
      logs: [],
    })
  }
}
