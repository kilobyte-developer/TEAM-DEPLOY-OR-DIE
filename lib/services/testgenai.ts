import {
  createLocalUploadedFile,
  demoAnalysisResult,
  demoCoverageReport,
  demoEvaluationResults,
  demoExecutionResult,
  demoInitialActivity,
  demoUploadedFiles,
  demoUserStoryExecutionResult,
  demoUserStoryInput,
  demoUserStoryTestSuite,
  demoGeneratedTests,
  getWordCount,
} from "@/lib/mock-data"
import type {
  AnalysisResult,
  CoverageReport,
  EvaluationRecord,
  ExecutionResult,
  GeneratedTests,
  InputMode,
  UploadedSourceFile,
  UserStoryTestSuite,
} from "@/lib/testgenai-types"

const DEFAULT_DELAY_MS = 650

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function resolveAnalysis(files: UploadedSourceFile[]): AnalysisResult {
  const fallback = files[0]?.repository ?? demoAnalysisResult.repository
  const availableNames = new Set(files.map((file) => file.name))
  const functions =
    availableNames.size === 0
      ? demoAnalysisResult.functions
      : demoAnalysisResult.functions.map((item, index) => ({
          ...item,
          fileName: files[index % files.length]?.name ?? item.fileName,
        }))
  const classes =
    availableNames.size === 0
      ? demoAnalysisResult.classes
      : demoAnalysisResult.classes.map((item, index) => ({
          ...item,
          fileName: files[index % files.length]?.name ?? item.fileName,
        }))

  return {
    ...clone(demoAnalysisResult),
    repository: fallback,
    generatedAt: new Date().toISOString(),
    functions,
    classes,
  }
}

function resolveGeneratedTests(files: UploadedSourceFile[]): GeneratedTests {
  const primaryFile = files[0]?.name ?? "auth_service.py"
  const repository = files[0]?.repository ?? demoGeneratedTests.repository

  return {
    ...clone(demoGeneratedTests),
    repository,
    generatedAt: new Date().toISOString(),
    unitTests: demoGeneratedTests.unitTests.map((artifact) => ({
      ...artifact,
      fileName: artifact.fileName.replace("auth_service.py", primaryFile),
    })),
    edgeCaseTests: demoGeneratedTests.edgeCaseTests.map((artifact) => ({
      ...artifact,
      fileName: artifact.fileName.replace("auth_service.py", primaryFile),
    })),
  }
}

function resolveUserStorySuite(story: string): UserStoryTestSuite {
  return {
    ...clone(demoUserStoryTestSuite),
    story,
    generatedAt: new Date().toISOString(),
    wordCount: getWordCount(story),
  }
}

function simulate<T>(value: T, delay = DEFAULT_DELAY_MS): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(value)), delay)
  })
}

export async function uploadFile(files: File[]): Promise<UploadedSourceFile[]> {
  const mapped = files.map((file, index) => createLocalUploadedFile(file, index))
  return simulate(mapped)
}

export async function analyzeCode(files: UploadedSourceFile[]): Promise<AnalysisResult> {
  return simulate(resolveAnalysis(files), 820)
}

export async function generateTests(files: UploadedSourceFile[]): Promise<GeneratedTests> {
  return simulate(resolveGeneratedTests(files), 880)
}

export async function generateUserStoryTests(story: string): Promise<UserStoryTestSuite> {
  return simulate(resolveUserStorySuite(story || demoUserStoryInput), 920)
}

export async function runTests(mode: InputMode): Promise<ExecutionResult> {
  return simulate(mode === "user-story" ? demoUserStoryExecutionResult : demoExecutionResult, 1100)
}

export async function getCoverage(): Promise<CoverageReport> {
  return simulate(demoCoverageReport, 760)
}

export async function getEvaluationResults(): Promise<EvaluationRecord[]> {
  return simulate(demoEvaluationResults, 480)
}

export async function getDemoWorkspace(): Promise<{
  activity: typeof demoInitialActivity
  analysis: AnalysisResult
  coverage: CoverageReport
  evaluationResults: EvaluationRecord[]
  execution: ExecutionResult
  files: UploadedSourceFile[]
  generatedTests: GeneratedTests
  userStoryInput: string
  userStoryTests: UserStoryTestSuite
}> {
  return simulate(
    {
      activity: demoInitialActivity,
      analysis: demoAnalysisResult,
      coverage: demoCoverageReport,
      evaluationResults: demoEvaluationResults,
      execution: demoExecutionResult,
      files: demoUploadedFiles,
      generatedTests: demoGeneratedTests,
      userStoryInput: demoUserStoryInput,
      userStoryTests: demoUserStoryTestSuite,
    },
    300,
  )
}
