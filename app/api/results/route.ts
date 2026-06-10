import { readFile } from 'fs/promises'
import { NextResponse } from 'next/server'
import { join } from 'path'

export const runtime = 'nodejs'

const REPORTS_DIR = join(process.cwd(), 'backend', 'reports')

export async function GET() {
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
