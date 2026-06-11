import { NextRequest, NextResponse } from 'next/server'
import { HistoryRepository } from '@/database/repositories/HistoryRepository'
import { MetricsRepository } from '@/database/repositories/MetricsRepository'

export const runtime = 'nodejs'

const DELETE_PASSWORD = 'iAmCaptialTeamDeployOrDie'

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function asNumber(value: unknown) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

export async function GET() {
  try {
    const repository = new HistoryRepository()
    const executions = await repository.listExecutions()
    const fileIds = unique(executions.map((execution) => execution.uploaded_file_id))
    const [files, coverage] = await Promise.all([
      repository.listFilesByIds(fileIds),
      repository.listLatestCoverage(),
    ])

    const fileMap = new Map(files.map((file) => [file.id, file]))
    const latestCoverage = new Map<string, (typeof coverage)[number]>()
    coverage.forEach((row) => {
      if (!latestCoverage.has(row.uploaded_file_id)) latestCoverage.set(row.uploaded_file_id, row)
    })

    const records = executions.map((execution) => {
      const file = fileMap.get(execution.uploaded_file_id)
      const coverageRow = latestCoverage.get(execution.uploaded_file_id)

      return {
        id: execution.id,
        uploadedFileId: execution.uploaded_file_id,
        fileName: file?.file_name ?? 'Unknown file',
        language: file?.language ?? 'Unknown',
        uploadTimestamp: file?.upload_timestamp ?? null,
        executionDate: execution.execution_timestamp,
        totalTests: asNumber(execution.total_tests),
        passed: asNumber(execution.passed_tests),
        failed: asNumber(execution.failed_tests),
        passRate: asNumber(execution.pass_rate),
        coveragePercent: asNumber(coverageRow?.coverage_percent),
        providerUsed: 'Local',
        status: execution.status ?? 'unknown',
      }
    })

    return NextResponse.json({ records })
  } catch {
    return NextResponse.json({ error: 'Unable to load historical records.', records: [] }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const password = typeof body.password === 'string' ? body.password : ''
    const count = Number(body.count)

    if (password !== DELETE_PASSWORD) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
    }

    if (!Number.isInteger(count) || count < 1) {
      return NextResponse.json({ error: 'Delete count must be a positive whole number.' }, { status: 400 })
    }

    const repository = new HistoryRepository()
    const oldest = await repository.findOldestExecutions(count)
    const deleted = await repository.deleteExecutions(oldest.map((row) => row.id))
    await new MetricsRepository().refresh()

    return NextResponse.json({
      requested: count,
      deleted: deleted.length,
      deletedIds: deleted.map((row) => row.id),
    })
  } catch {
    return NextResponse.json({ error: 'Unable to delete historical records.' }, { status: 500 })
  }
}
