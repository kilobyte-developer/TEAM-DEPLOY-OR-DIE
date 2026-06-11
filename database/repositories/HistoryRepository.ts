import { databaseService, type DatabaseService } from '../services/DatabaseService'

export type HistoryExecutionRow = {
  id: string
  uploaded_file_id: string
  execution_timestamp: string
  status: string
  total_tests: number
  passed_tests: number
  failed_tests: number
  pass_rate: number
  execution_time?: string | null
  logs_json?: unknown[]
}

export type HistoryFileRow = {
  id: string
  file_name: string
  language?: string | null
  upload_timestamp?: string | null
}

export type HistoryAnalysisRow = {
  uploaded_file_id: string
  function_count: number
  class_count: number
  import_count: number
  dependency_count: number
  functions_json: unknown[]
  classes_json: unknown[]
  imports_json: unknown[]
  dependencies_json: unknown[]
  generated_at: string
}

export type HistorySemanticRow = {
  uploaded_file_id: string
  provider?: string | null
  model?: string | null
  function_name: string
  signature?: string | null
  unit_tests_json: unknown[]
  negative_tests_json: unknown[]
  edge_cases_json: unknown[]
  boundary_cases_json: unknown[]
  potential_logic_issues_json: unknown[]
  generated_at: string
}

export type HistoryCoverageRow = {
  uploaded_file_id: string
  coverage_percent: number
  functions_covered: number
  functions_missing: string[]
  coverage_summary?: string | null
  coverage_json?: Record<string, unknown>
  generated_at: string
}

export type HistoryExecutionDetailRow = {
  execution_id: string
  test_name: string
  status: string
  expected_output?: string | null
  actual_output?: string | null
  failure_reason?: string | null
  duration?: string | null
}

export class HistoryRepository {
  constructor(private readonly db: DatabaseService = databaseService) {}

  async listExecutions(limit = 1000) {
    return this.db.select<HistoryExecutionRow>('executions', {
      select: 'id,uploaded_file_id,execution_timestamp,status,total_tests,passed_tests,failed_tests,pass_rate,execution_time',
      order: 'execution_timestamp.desc',
      limit,
    })
  }

  async getExecution(executionId: string) {
    const rows = await this.db.select<HistoryExecutionRow>('executions', {
      select: '*',
      eq: { id: executionId },
      limit: 1,
    })
    return rows[0]
  }

  async listFilesByIds(fileIds: string[]) {
    if (!fileIds.length) return []
    return this.db.select<HistoryFileRow>('uploaded_files', {
      select: 'id,file_name,language,upload_timestamp',
      in: { id: fileIds },
    })
  }

  async getLatestAnalysis(fileId: string) {
    const rows = await this.db.select<HistoryAnalysisRow>('analysis_results', {
      select: '*',
      eq: { uploaded_file_id: fileId },
      order: 'generated_at.desc',
      limit: 1,
    })
    return rows[0]
  }

  async listSemanticTests(fileId: string) {
    return this.db.select<HistorySemanticRow>('semantic_test_cases', {
      select: '*',
      eq: { uploaded_file_id: fileId },
      order: 'generated_at.desc',
      limit: 250,
    })
  }

  async getLatestCoverage(fileId: string) {
    const rows = await this.db.select<HistoryCoverageRow>('coverage_reports', {
      select: '*',
      eq: { uploaded_file_id: fileId },
      order: 'generated_at.desc',
      limit: 1,
    })
    return rows[0]
  }

  async listLatestCoverage(limit = 1500) {
    return this.db.select<HistoryCoverageRow>('coverage_reports', {
      select: 'uploaded_file_id,coverage_percent,functions_covered,functions_missing,coverage_summary,generated_at',
      order: 'generated_at.desc',
      limit,
    })
  }

  async listExecutionDetails(executionId: string) {
    return this.db.select<HistoryExecutionDetailRow>('execution_details', {
      select: '*',
      eq: { execution_id: executionId },
      limit: 500,
    })
  }

  async findOldestExecutions(count: number) {
    return this.db.select<Pick<HistoryExecutionRow, 'id'>>('executions', {
      select: 'id',
      order: 'execution_timestamp.asc',
      limit: count,
    })
  }

  async deleteExecutions(ids: string[]) {
    if (!ids.length) return []
    return this.db.delete<Pick<HistoryExecutionRow, 'id'>>('executions', {
      select: 'id',
      in: { id: ids },
    })
  }
}
