import { databaseService, type DatabaseService } from '../services/DatabaseService'

const METRICS_ID = '00000000-0000-0000-0000-000000000001'

type ExecutionMetric = {
  total_tests: number
  passed_tests: number
  failed_tests: number
  pass_rate: number
}

type ArtifactMetric = {
  artifact_content: string
}

type CoverageMetric = {
  coverage_percent: number
}

function average(values: number[]) {
  if (!values.length) return 0
  return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(2))
}

function countGeneratedTests(artifacts: ArtifactMetric[]) {
  return artifacts.reduce((total, artifact) => {
    const matches = artifact.artifact_content.match(/^def test_/gm)
    return total + (matches?.length ?? 0)
  }, 0)
}

export class MetricsRepository {
  constructor(private readonly db: DatabaseService = databaseService) {}

  async refresh() {
    if (!this.db.isEnabled()) return

    const [files, executions, artifacts, coverage] = await Promise.all([
      this.db.select('uploaded_files', { select: 'id' }),
      this.db.select<ExecutionMetric>('executions', {
        select: 'total_tests,passed_tests,failed_tests,pass_rate',
      }),
      this.db.select<ArtifactMetric>('generated_pytest_artifacts', { select: 'artifact_content' }),
      this.db.select<CoverageMetric>('coverage_reports', { select: 'coverage_percent' }),
    ])

    await this.db.update('project_metrics', { id: METRICS_ID }, {
      total_uploaded_files: files.length,
      total_executions: executions.length,
      total_tests_generated: countGeneratedTests(artifacts),
      total_tests_passed: executions.reduce((total, item) => total + Number(item.passed_tests ?? 0), 0),
      total_tests_failed: executions.reduce((total, item) => total + Number(item.failed_tests ?? 0), 0),
      average_pass_rate: average(executions.map((item) => Number(item.pass_rate ?? 0))),
      average_coverage: average(coverage.map((item) => Number(item.coverage_percent ?? 0))),
      last_updated: new Date().toISOString(),
    })
  }
}
