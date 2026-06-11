export type InputMode = "source-code" | "user-story"

export type RequestStatus = "idle" | "loading" | "success" | "error"

export type UploadStatus =
  | "Queued"
  | "Uploading"
  | "Uploaded"
  | "Analyzing"
  | "Analyzed"
  | "Failed"

export type ExecutionStatus = "idle" | "running" | "completed" | "failed"

export interface UploadedSourceFile {
  id: string
  name: string
  language: string
  sizeBytes: number
  sizeLabel: string
  status: UploadStatus
  uploadedAt: string
  repository: string
  source: "demo" | "local"
}

export interface FunctionParameter {
  name: string
  type: string
}

export interface AnalysisFunction {
  id: string
  name: string
  fileName: string
  className?: string
  parameters: FunctionParameter[]
  returnType: string
  dependencies: string[]
  description: string
}

export interface AnalysisClass {
  id: string
  name: string
  fileName: string
  methods: string[]
  dependencies: string[]
}

export interface AnalysisResult {
  repository: string
  generatedAt: string
  functions: AnalysisFunction[]
  classes: AnalysisClass[]
  imports: string[]
  dependencies: string[]
}

export interface TestArtifact {
  id: string
  fileName: string
  label: string
  language: string
  code: string
  testCount: number
}

export type SemanticTestCategory = "unit" | "negative" | "edge" | "boundary"

export interface SemanticTestCase {
  id: string
  title: string
  input: string
  expected: string
  category: SemanticTestCategory
}

export interface PotentialLogicIssue {
  message: string
  confidence: "Low" | "Medium" | "High" | number | string
  severity?: "Low" | "Medium" | "High" | "Critical" | string
  fixSuggestion?: {
    status?: "available" | "unavailable"
    issueSummary?: string
    currentCode?: string
    suggestedCode?: string
    explanation?: string
    confidence?: number | string
    severity?: "Low" | "Medium" | "High" | "Critical" | string
    potentialImpact?: string
    generatedAt?: string
    provider?: "gemini"
    model?: string
  }
}

export interface SemanticFunctionTestSuite {
  id: string
  functionName: string
  fileName: string
  className?: string
  potentialLogicIssues?: PotentialLogicIssue[]
  unitTests: SemanticTestCase[]
  negativeTests: SemanticTestCase[]
  edgeCases: SemanticTestCase[]
  boundaryCases: SemanticTestCase[]
}

export interface GeneratedTests {
  repository: string
  generatedAt: string
  provider?: {
    provider: "gemini" | "local"
    model?: string
    fallbackReason?: string
  }
  semanticSuites?: SemanticFunctionTestSuite[]
  unitTests: TestArtifact[]
  edgeCaseTests: TestArtifact[]
  summary: {
    filesCovered: number
    unitTestsGenerated: number
    edgeTestsGenerated: number
  }
}

export interface UserStoryTestCase {
  id: string
  scenario: string
  steps: string[]
  expectedResult: string
  priority: "Low" | "Medium" | "High" | "Critical"
}

export interface UserStoryTestSuite {
  story: string
  status: "Ready" | "Generated" | "Needs Review"
  wordCount: number
  generatedAt: string
  provider?: {
    provider: "openai" | "gemini" | "local"
    model?: string
  }
  positiveCases: UserStoryTestCase[]
  negativeCases: UserStoryTestCase[]
  edgeCases: UserStoryTestCase[]
}

export interface ExecutionLogEntry {
  timestamp: string
  level: "info" | "pass" | "fail" | "warn"
  message: string
}

export interface ExecutionResult {
  mode: InputMode
  status: ExecutionStatus
  generatedAt: string
  totalTests: number
  passedTests: number
  failedTests: number
  executionTime: string
  passRate: number
  logs: ExecutionLogEntry[]
}

export interface CoverageByFile {
  fileName: string
  coveragePercent: number
  coveredFunctions: number
  missingFunctions: string[]
}

export interface CoverageReport {
  generatedAt: string
  coveragePercent: number
  functionsCovered: number
  functionsMissingCoverage: string[]
  edgeCasesCovered: number
  summary: string
  byFile: CoverageByFile[]
}

export interface EvaluationRecord {
  repository: string
  testsGenerated: number
  passed: number
  failed: number
  coverage: number
  status: "PASS" | "PARTIAL" | "FAIL"
}

export interface ActivityItem {
  id: string
  type: "upload" | "analysis" | "generation" | "execution" | "coverage"
  label: string
  detail: string
  time: string
}

export interface AsyncSlice<T> {
  status: RequestStatus
  data: T | null
  error: string | null
}

export interface AppStats {
  filesUploaded: number
  functionsDetected: number
  testsGenerated: number
  passedTests: number
  failedTests: number
  passRate: number
  executionTime: string
  coveragePercentage: number
}

export interface TestGenAIState {
  demoMode: boolean
  inputMode: InputMode
  uploadStatus: RequestStatus
  uploadError: string | null
  uploadedFiles: UploadedSourceFile[]
  selectedFileId: string | null
  userStoryInput: string
  analysis: AsyncSlice<AnalysisResult>
  generatedTests: AsyncSlice<GeneratedTests>
  userStoryTests: AsyncSlice<UserStoryTestSuite>
  execution: AsyncSlice<ExecutionResult>
  coverage: AsyncSlice<CoverageReport>
  evaluationResults: EvaluationRecord[]
  activity: ActivityItem[]
}

export interface PastRecordSummary {
  id: string
  uploadedFileId: string
  fileName: string
  language: string
  uploadTimestamp: string | null
  executionDate: string
  totalTests: number
  passed: number
  failed: number
  passRate: number
  coveragePercent: number
  providerUsed: string
  status: string
}

export interface PastRecordDetails {
  id: string
  file: {
    id: string
    fileName: string
    language: string
    uploadTimestamp: string | null
  }
  provider: {
    provider: string
    model: string
  }
  execution: {
    executionTimestamp: string
    status: string
    totalTests: number
    passed: number
    failed: number
    passRate: number
    executionTime: string
    logs: ExecutionLogEntry[]
    details: Array<{
      test_name: string
      status: string
      expected_output?: string | null
      actual_output?: string | null
      failure_reason?: string | null
      duration?: string | null
    }>
  }
  analysis: {
    generatedAt: string | null
    functionCount: number
    classCount: number
    importCount: number
    dependencyCount: number
    functions: unknown[]
    classes: unknown[]
    imports: unknown[]
    dependencies: unknown[]
  }
  coverage: {
    generatedAt: string | null
    coveragePercent: number
    functionsCovered: number
    functionsMissing: string[]
    notes: string
    raw: unknown
  }
  semanticTests: Array<{
    functionName: string
    signature: string
    provider: string
    model: string
    generatedAt: string
    unitTests: SemanticTestCase[]
    negativeTests: SemanticTestCase[]
    edgeCases: SemanticTestCase[]
    boundaryCases: SemanticTestCase[]
    potentialLogicIssues: PotentialLogicIssue[]
  }>
  hasHtmlReport: boolean
}

export interface AnalyticsDashboardData {
  generatedAt?: string
  error?: string
  isEmpty: boolean
  kpis: {
    totalFilesUploaded: number
    totalExecutions: number
    totalTestsGenerated: number
    totalTestsPassed: number
    totalTestsFailed: number
    averagePassRate: number
    averageCoverage: number
    userStoriesProcessed: number
    logicIssuesDetected: number
  }
  charts: {
    passFail: Array<{ name: string; value: number }>
    coverageTrend: Array<{ date: string; coverage: number; fileName?: string }>
    executionsOverTime: Array<{ date: string; executions: number }>
    providerUsage: Array<{ name: string; value: number }>
    logicIssuesTrend: Array<{ date: string; issues: number }>
  }
  insights: {
    mostTestedFile?: string
    highestCoverageFile?: string
    highestCoverage?: number
    lowestCoverageFile?: string
    lowestCoverage?: number
    bestPassRateFile?: string
    bestPassRate?: number
    worstPassRateFile?: string
    worstPassRate?: number
    mostRecentExecution?: string
    totalHistoricalCoverageAverage?: number
    functionsAnalyzed?: number
  }
  leaderboard: Array<{
    fileName: string
    executions: number
    passRate: number
    coverage: number
  }>
  activity: Array<{
    id: string
    type: 'upload' | 'generation' | 'execution' | 'coverage' | 'story'
    label: string
    detail: string
    timestamp: string
    displayTime: string
  }>
}
