import { DashboardRepository } from '../repositories/DashboardRepository'
import type {
  HistoryCoverageRow,
  HistoryExecutionRow,
  HistoryFileRow,
  HistorySemanticRow,
} from '../repositories/HistoryRepository'

function asNumber(value: unknown) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function average(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value))
  if (!valid.length) return 0
  return Number((valid.reduce((total, value) => total + value, 0) / valid.length).toFixed(2))
}

function dayKey(value?: string | null) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return 'Unknown'
  return date.toISOString().slice(0, 10)
}

function formatDate(value?: string | null) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return 'Not available'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function latestByFile<T extends { uploaded_file_id: string; generated_at?: string }>(rows: T[]) {
  const map = new Map<string, T>()
  rows.forEach((row) => {
    const current = map.get(row.uploaded_file_id)
    if (!current || new Date(row.generated_at ?? 0).getTime() > new Date(current.generated_at ?? 0).getTime()) {
      map.set(row.uploaded_file_id, row)
    }
  })
  return map
}

function providerName(row: Pick<HistorySemanticRow, 'provider'>) {
  const provider = (row.provider || 'local').toLowerCase()
  if (provider.includes('openai')) return 'OpenAI'
  if (provider.includes('gemini')) return 'Gemini'
  return 'Local'
}

function semanticTestCount(row: HistorySemanticRow) {
  return (
    asArray(row.unit_tests_json).length +
    asArray(row.negative_tests_json).length +
    asArray(row.edge_cases_json).length +
    asArray(row.boundary_cases_json).length
  )
}

function issueCount(row: HistorySemanticRow) {
  return asArray(row.potential_logic_issues_json).length
}

function groupByDay<T>(rows: T[], getDate: (row: T) => string | null | undefined, getValue = (_row: T) => 1) {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const key = dayKey(getDate(row))
    map.set(key, (map.get(key) ?? 0) + getValue(row))
  })
  return Array.from(map.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => ({ date, value }))
}

function fileNameFor(fileMap: Map<string, HistoryFileRow>, fileId: string) {
  return fileMap.get(fileId)?.file_name ?? 'Unknown file'
}

function highestBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce<T | null>((best, item) => (!best || getValue(item) > getValue(best) ? item : best), null)
}

function lowestBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce<T | null>((best, item) => (!best || getValue(item) < getValue(best) ? item : best), null)
}

export class AnalyticsService {
  constructor(private readonly repository = new DashboardRepository()) {}

  async getDashboardData() {
    const [projectMetrics, files, executions, coverage, semanticTests, analyses, userStories] = await Promise.all([
      this.repository.getProjectMetrics(),
      this.repository.listFiles(),
      this.repository.listExecutions(),
      this.repository.listCoverage(),
      this.repository.listSemanticTests(),
      this.repository.listAnalyses(),
      this.repository.listUserStories(),
    ])

    const fileMap = new Map(files.map((file) => [file.id, file]))
    const latestCoverage = latestByFile(coverage)
    const latestAnalysis = latestByFile(analyses)
    const totalTestsGenerated =
      semanticTests.reduce((total, row) => total + semanticTestCount(row), 0) +
      userStories.reduce(
        (total, row) =>
          total +
          asArray(row.positive_tests_json).length +
          asArray(row.negative_tests_json).length +
          asArray(row.edge_cases_json).length,
        0,
      )
    const totalPassed = executions.reduce((total, row) => total + asNumber(row.passed_tests), 0)
    const totalFailed = executions.reduce((total, row) => total + asNumber(row.failed_tests), 0)
    const coverageValues = Array.from(latestCoverage.values()).map((row) => asNumber(row.coverage_percent))
    const passRates = executions.map((row) => asNumber(row.pass_rate))
    const logicIssuesDetected = semanticTests.reduce((total, row) => total + issueCount(row), 0)

    const executionsByFile = new Map<string, HistoryExecutionRow[]>()
    executions.forEach((execution) => {
      const rows = executionsByFile.get(execution.uploaded_file_id) ?? []
      rows.push(execution)
      executionsByFile.set(execution.uploaded_file_id, rows)
    })

    const leaderboard = Array.from(executionsByFile.entries())
      .map(([fileId, rows]) => {
        const coverageRow = latestCoverage.get(fileId)
        return {
          fileName: fileNameFor(fileMap, fileId),
          executions: rows.length,
          passRate: average(rows.map((row) => asNumber(row.pass_rate))),
          coverage: asNumber(coverageRow?.coverage_percent),
        }
      })
      .sort((left, right) => right.executions - left.executions || right.passRate - left.passRate)
      .slice(0, 10)

    const highestCoverage = highestBy(Array.from(latestCoverage.entries()), ([, row]) => asNumber(row.coverage_percent))
    const lowestCoverage = lowestBy(Array.from(latestCoverage.entries()), ([, row]) => asNumber(row.coverage_percent))
    const bestPassRate = highestBy(executions, (row) => asNumber(row.pass_rate))
    const worstPassRate = lowestBy(executions, (row) => asNumber(row.pass_rate))
    const mostTested = leaderboard[0]
    const mostRecentExecution = executions[0]

    const providerCounts = new Map<string, number>([
      ['OpenAI', 0],
      ['Gemini', 0],
      ['Local', 0],
    ])
    semanticTests.forEach((row) => providerCounts.set(providerName(row), (providerCounts.get(providerName(row)) ?? 0) + 1))
    userStories.forEach((row) => {
      const name = providerName({ provider: row.provider })
      providerCounts.set(name, (providerCounts.get(name) ?? 0) + 1)
    })

    const activity = [
      ...files.map((file) => ({
        type: 'upload' as const,
        label: 'File uploaded',
        detail: file.file_name,
        timestamp: file.upload_timestamp ?? '',
      })),
      ...semanticTests.slice(0, 300).map((test) => ({
        type: 'generation' as const,
        label: 'Tests generated',
        detail: fileNameFor(fileMap, test.uploaded_file_id),
        timestamp: test.generated_at,
      })),
      ...executions.map((execution) => ({
        type: 'execution' as const,
        label: 'Execution completed',
        detail: `${fileNameFor(fileMap, execution.uploaded_file_id)} - ${execution.passed_tests} passed / ${execution.failed_tests} failed`,
        timestamp: execution.execution_timestamp,
      })),
      ...coverage.map((row) => ({
        type: 'coverage' as const,
        label: 'Coverage generated',
        detail: `${fileNameFor(fileMap, row.uploaded_file_id)} - ${asNumber(row.coverage_percent)}%`,
        timestamp: row.generated_at,
      })),
      ...userStories.map((row) => ({
        type: 'story' as const,
        label: 'User story processed',
        detail: `${asArray(row.positive_tests_json).length + asArray(row.negative_tests_json).length + asArray(row.edge_cases_json).length} cases generated`,
        timestamp: row.generated_at,
      })),
    ]
      .filter((item) => item.timestamp)
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
      .slice(0, 25)
      .map((item, index) => ({ id: `${item.type}-${index}-${item.timestamp}`, ...item, displayTime: formatDate(item.timestamp) }))

    return {
      generatedAt: new Date().toISOString(),
      isEmpty: files.length === 0 && executions.length === 0 && semanticTests.length === 0 && userStories.length === 0,
      kpis: {
        totalFilesUploaded: files.length || projectMetrics?.total_uploaded_files || 0,
        totalExecutions: executions.length || projectMetrics?.total_executions || 0,
        totalTestsGenerated: totalTestsGenerated || projectMetrics?.total_tests_generated || 0,
        totalTestsPassed: totalPassed || projectMetrics?.total_tests_passed || 0,
        totalTestsFailed: totalFailed || projectMetrics?.total_tests_failed || 0,
        averagePassRate: average(passRates) || asNumber(projectMetrics?.average_pass_rate),
        averageCoverage: average(coverageValues) || asNumber(projectMetrics?.average_coverage),
        userStoriesProcessed: userStories.length,
        logicIssuesDetected,
      },
      charts: {
        passFail: [
          { name: 'Passed', value: totalPassed },
          { name: 'Failed', value: totalFailed },
        ],
        coverageTrend: coverage
          .slice()
          .reverse()
          .map((row) => ({
            date: dayKey(row.generated_at),
            coverage: asNumber(row.coverage_percent),
            fileName: fileNameFor(fileMap, row.uploaded_file_id),
          })),
        executionsOverTime: groupByDay(executions, (row) => row.execution_timestamp).map((item) => ({
          date: item.date,
          executions: item.value,
        })),
        providerUsage: Array.from(providerCounts.entries()).map(([name, value]) => ({ name, value })),
        logicIssuesTrend: groupByDay(semanticTests, (row) => row.generated_at, issueCount).map((item) => ({
          date: item.date,
          issues: item.value,
        })),
      },
      insights: {
        mostTestedFile: mostTested?.fileName ?? 'Not available',
        highestCoverageFile: highestCoverage ? fileNameFor(fileMap, highestCoverage[0]) : 'Not available',
        highestCoverage: highestCoverage ? asNumber(highestCoverage[1].coverage_percent) : 0,
        lowestCoverageFile: lowestCoverage ? fileNameFor(fileMap, lowestCoverage[0]) : 'Not available',
        lowestCoverage: lowestCoverage ? asNumber(lowestCoverage[1].coverage_percent) : 0,
        bestPassRateFile: bestPassRate ? fileNameFor(fileMap, bestPassRate.uploaded_file_id) : 'Not available',
        bestPassRate: bestPassRate ? asNumber(bestPassRate.pass_rate) : 0,
        worstPassRateFile: worstPassRate ? fileNameFor(fileMap, worstPassRate.uploaded_file_id) : 'Not available',
        worstPassRate: worstPassRate ? asNumber(worstPassRate.pass_rate) : 0,
        mostRecentExecution: mostRecentExecution
          ? `${fileNameFor(fileMap, mostRecentExecution.uploaded_file_id)} - ${formatDate(mostRecentExecution.execution_timestamp)}`
          : 'Not available',
        totalHistoricalCoverageAverage: average(coverage.map((row) => asNumber(row.coverage_percent))),
        functionsAnalyzed: Array.from(latestAnalysis.values()).reduce((total, row) => total + asNumber(row.function_count), 0),
      },
      leaderboard,
      activity,
    }
  }
}
