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

export interface GeneratedTests {
  repository: string
  generatedAt: string
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
