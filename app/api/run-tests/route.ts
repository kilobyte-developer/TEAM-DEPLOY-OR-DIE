import { mkdir, readFile, writeFile } from 'fs/promises'
import { spawnSync } from 'child_process'
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'

export const runtime = 'nodejs'

const BACKEND_DIR = join(process.cwd(), 'backend')
const GENERATED_TESTS_DIR = '/tmp/testgenai_generated_tests'
const REPORTS_DIR = '/tmp/testgenai_reports'
const MANIFEST_PATH = join(GENERATED_TESTS_DIR, 'manifest.json')
const RESULTS_PATH = join(REPORTS_DIR, 'results.json')
const PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3'

type Manifest = {
  unitTestFilePath: string
  edgeTestFilePath: string
}

function classifyLogLevel(message: string) {
  if (message.includes('FAILED') || message.includes('ERROR')) return 'fail'
  if (message.includes('PASSED')) return 'pass'
  if (message.includes('WARNING') || message.includes('WARN')) return 'warn'
  return 'info'
}

function parseSummaryCount(pattern: RegExp, output: string) {
  const match = output.match(pattern)
  return match ? Number(match[1]) : 0
}

function buildLogs(output: string) {
  const timestamp = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date())

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      timestamp,
      level: classifyLogLevel(line),
      message: line,
    }))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const mode = body.mode ?? 'source-code'

    if (mode !== 'source-code') {
      return NextResponse.json(
        { error: 'Test execution is only available for source code mode in MVP.' },
        { status: 400 },
      )
    }

    const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf-8')) as Manifest
    const started = performance.now()
    const result = spawnSync(
      PYTHON_CMD,
      ['-m', 'pytest', manifest.unitTestFilePath, manifest.edgeTestFilePath, '-v', '--tb=short'],
      {
        cwd: BACKEND_DIR,
        encoding: 'utf-8',
        timeout: 60000,
      },
    )
    const duration = (performance.now() - started) / 1000

    if (result.error) {
      return NextResponse.json(
        { error: `Test execution failed: ${result.error.message}` },
        { status: 500 },
      )
    }

    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim()
    const collected = parseSummaryCount(/collected\s+(\d+)\s+items/, output)
    const passed = parseSummaryCount(/(\d+)\s+passed/, output)
    const failed = parseSummaryCount(/(\d+)\s+failed/, output)
    const total = collected || passed + failed
    const statusCode = result.status ?? 1
    const payload = {
      mode: 'source-code',
      status: statusCode === 0 || statusCode === 1 ? 'completed' : 'failed',
      generatedAt: new Date().toISOString(),
      totalTests: total,
      passedTests: passed,
      failedTests: failed,
      executionTime: `${duration.toFixed(2)}s`,
      passRate: total ? Number(((passed / total) * 100).toFixed(1)) : 0,
      logs: buildLogs(output),
    }

    await mkdir(REPORTS_DIR, { recursive: true })
    await writeFile(RESULTS_PATH, JSON.stringify(payload, null, 2), 'utf-8')

    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'No generated tests found. Generate tests first.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ error: 'Test execution failed' }, { status: 500 })
  }
}
