import { NextRequest, NextResponse } from 'next/server'
import { HistoryRepository } from '@/database/repositories/HistoryRepository'

export const runtime = 'nodejs'

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function asNumber(value: unknown) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function providerFromTests(rows: Awaited<ReturnType<HistoryRepository['listSemanticTests']>>) {
  const first = rows.find((row) => row.provider || row.model)
  return {
    provider: first?.provider ?? 'local',
    model: first?.model ?? 'mvp_engine',
  }
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const repository = new HistoryRepository()
    const execution = await repository.getExecution(id)

    if (!execution) {
      return NextResponse.json({ error: 'Historical record not found.' }, { status: 404 })
    }

    const [files, analysis, semanticTests, coverage, details] = await Promise.all([
      repository.listFilesByIds([execution.uploaded_file_id]),
      repository.getLatestAnalysis(execution.uploaded_file_id),
      repository.listSemanticTests(execution.uploaded_file_id),
      repository.getLatestCoverage(execution.uploaded_file_id),
      repository.listExecutionDetails(execution.id),
    ])
    const file = files[0]
    const provider = providerFromTests(semanticTests)

    return NextResponse.json({
      id: execution.id,
      file: {
        id: execution.uploaded_file_id,
        fileName: file?.file_name ?? 'Unknown file',
        language: file?.language ?? 'Unknown',
        uploadTimestamp: file?.upload_timestamp ?? null,
      },
      provider,
      execution: {
        executionTimestamp: execution.execution_timestamp,
        status: execution.status ?? 'unknown',
        totalTests: asNumber(execution.total_tests),
        passed: asNumber(execution.passed_tests),
        failed: asNumber(execution.failed_tests),
        passRate: asNumber(execution.pass_rate),
        executionTime: execution.execution_time ?? 'Not available',
        logs: asArray(execution.logs_json),
        details,
      },
      analysis: {
        generatedAt: analysis?.generated_at ?? null,
        functionCount: asNumber(analysis?.function_count),
        classCount: asNumber(analysis?.class_count),
        importCount: asNumber(analysis?.import_count),
        dependencyCount: asNumber(analysis?.dependency_count),
        functions: asArray(analysis?.functions_json),
        classes: asArray(analysis?.classes_json),
        imports: asArray(analysis?.imports_json),
        dependencies: asArray(analysis?.dependencies_json),
      },
      coverage: {
        generatedAt: coverage?.generated_at ?? null,
        coveragePercent: asNumber(coverage?.coverage_percent),
        functionsCovered: asNumber(coverage?.functions_covered),
        functionsMissing: asArray<string>(coverage?.functions_missing),
        notes: coverage?.coverage_summary ?? 'No coverage notes available.',
        raw: coverage?.coverage_json ?? null,
      },
      semanticTests: semanticTests.map((row) => ({
        functionName: row.function_name,
        signature: row.signature ?? row.function_name,
        provider: row.provider ?? 'local',
        model: row.model ?? 'mvp_engine',
        generatedAt: row.generated_at,
        unitTests: asArray(row.unit_tests_json),
        negativeTests: asArray(row.negative_tests_json),
        edgeCases: asArray(row.edge_cases_json),
        boundaryCases: asArray(row.boundary_cases_json),
        potentialLogicIssues: asArray(row.potential_logic_issues_json),
      })),
      hasHtmlReport: Boolean(analysis || semanticTests.length || coverage || execution),
    })
  } catch {
    return NextResponse.json({ error: 'Unable to load historical record details.' }, { status: 500 })
  }
}
