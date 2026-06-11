import { databaseService, type DatabaseService } from '../services/DatabaseService'
import type {
  HistoryAnalysisRow,
  HistoryCoverageRow,
  HistoryExecutionRow,
  HistoryFileRow,
  HistorySemanticRow,
} from './HistoryRepository'

export type ProjectMetricsRow = {
  total_uploaded_files: number
  total_executions: number
  total_tests_generated: number
  total_tests_passed: number
  total_tests_failed: number
  average_pass_rate: number
  average_coverage: number
  last_updated: string
}

export type UserStoryMetricRow = {
  id: string
  provider?: string | null
  model?: string | null
  positive_tests_json: unknown[]
  negative_tests_json: unknown[]
  edge_cases_json: unknown[]
  generated_at: string
}

export class DashboardRepository {
  constructor(private readonly db: DatabaseService = databaseService) {}

  async getProjectMetrics() {
    const rows = await this.db.select<ProjectMetricsRow>('project_metrics', {
      select: '*',
      limit: 1,
    })
    return rows[0]
  }

  async listFiles(limit = 1500) {
    return this.db.select<HistoryFileRow>('uploaded_files', {
      select: 'id,file_name,language,upload_timestamp',
      order: 'upload_timestamp.desc',
      limit,
    })
  }

  async listExecutions(limit = 1500) {
    return this.db.select<HistoryExecutionRow>('executions', {
      select: 'id,uploaded_file_id,execution_timestamp,status,total_tests,passed_tests,failed_tests,pass_rate,execution_time',
      order: 'execution_timestamp.desc',
      limit,
    })
  }

  async listCoverage(limit = 1500) {
    return this.db.select<HistoryCoverageRow>('coverage_reports', {
      select: 'uploaded_file_id,coverage_percent,functions_covered,functions_missing,coverage_summary,generated_at',
      order: 'generated_at.desc',
      limit,
    })
  }

  async listSemanticTests(limit = 2500) {
    return this.db.select<HistorySemanticRow>('semantic_test_cases', {
      select: 'uploaded_file_id,provider,model,unit_tests_json,negative_tests_json,edge_cases_json,boundary_cases_json,potential_logic_issues_json,generated_at',
      order: 'generated_at.desc',
      limit,
    })
  }

  async listAnalyses(limit = 1500) {
    return this.db.select<HistoryAnalysisRow>('analysis_results', {
      select: 'uploaded_file_id,function_count,class_count,import_count,dependency_count,generated_at',
      order: 'generated_at.desc',
      limit,
    })
  }

  async listUserStories(limit = 1500) {
    return this.db.select<UserStoryMetricRow>('user_story_sessions', {
      select: 'id,provider,model,positive_tests_json,negative_tests_json,edge_cases_json,generated_at',
      order: 'generated_at.desc',
      limit,
    })
  }
}
