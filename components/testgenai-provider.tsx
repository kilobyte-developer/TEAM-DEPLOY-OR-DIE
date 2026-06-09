"use client"

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react"
import { DEMO_MODE_ENABLED, USER_STORY_PLACEHOLDER, getWordCount } from "@/lib/mock-data"
import {
  analyzeCode,
  generateTests,
  generateUserStoryTests,
  getCoverage,
  getDemoWorkspace,
  getEvaluationResults,
  runTests,
  uploadFile,
} from "@/lib/services/testgenai"
import type {
  ActivityItem,
  AnalysisResult,
  AppStats,
  AsyncSlice,
  CoverageReport,
  ExecutionResult,
  GeneratedTests,
  InputMode,
  TestGenAIState,
  UploadedSourceFile,
  UserStoryTestSuite,
} from "@/lib/testgenai-types"

function createAsyncSlice<T>(data: T | null, status: AsyncSlice<T>["status"] = "idle"): AsyncSlice<T> {
  return {
    status,
    data,
    error: null,
  }
}

const initialState: TestGenAIState = {
  demoMode: DEMO_MODE_ENABLED,
  inputMode: "source-code",
  uploadStatus: "idle",
  uploadError: null,
  uploadedFiles: [],
  selectedFileId: null,
  userStoryInput: USER_STORY_PLACEHOLDER,
  analysis: createAsyncSlice<AnalysisResult>(null),
  generatedTests: createAsyncSlice<GeneratedTests>(null),
  userStoryTests: createAsyncSlice<UserStoryTestSuite>(null),
  execution: createAsyncSlice<ExecutionResult>(null),
  coverage: createAsyncSlice<CoverageReport>(null),
  evaluationResults: [],
  activity: [],
}

type Action =
  | { type: "BOOTSTRAP"; payload: Partial<TestGenAIState> }
  | { type: "SET_INPUT_MODE"; payload: InputMode }
  | { type: "SET_SELECTED_FILE"; payload: string | null }
  | { type: "SET_USER_STORY_INPUT"; payload: string }
  | { type: "UPLOAD_START"; payload: UploadedSourceFile[] }
  | { type: "UPLOAD_SUCCESS"; payload: UploadedSourceFile[] }
  | { type: "UPLOAD_ERROR"; payload: string }
  | { type: "REMOVE_FILE"; payload: string }
  | { type: "ANALYSIS_START" }
  | { type: "ANALYSIS_SUCCESS"; payload: AnalysisResult }
  | { type: "ANALYSIS_ERROR"; payload: string }
  | { type: "TESTS_START" }
  | { type: "TESTS_SUCCESS"; payload: GeneratedTests }
  | { type: "TESTS_ERROR"; payload: string }
  | { type: "USER_STORY_TESTS_START" }
  | { type: "USER_STORY_TESTS_SUCCESS"; payload: UserStoryTestSuite }
  | { type: "USER_STORY_TESTS_ERROR"; payload: string }
  | { type: "EXECUTION_START" }
  | { type: "EXECUTION_SUCCESS"; payload: ExecutionResult }
  | { type: "EXECUTION_ERROR"; payload: string }
  | { type: "COVERAGE_START" }
  | { type: "COVERAGE_SUCCESS"; payload: CoverageReport }
  | { type: "COVERAGE_ERROR"; payload: string }
  | { type: "SET_EVALUATION_RESULTS"; payload: TestGenAIState["evaluationResults"] }
  | { type: "PUSH_ACTIVITY"; payload: ActivityItem }

function prependActivity(activity: ActivityItem[], item: ActivityItem) {
  return [item, ...activity].slice(0, 8)
}

function resetSourceWorkflow(state: TestGenAIState) {
  return {
    ...state,
    analysis: createAsyncSlice<AnalysisResult>(null),
    generatedTests: createAsyncSlice<GeneratedTests>(null),
    execution: createAsyncSlice<ExecutionResult>(null),
    coverage: createAsyncSlice<CoverageReport>(null),
  }
}

function reducer(state: TestGenAIState, action: Action): TestGenAIState {
  switch (action.type) {
    case "BOOTSTRAP":
      return {
        ...state,
        ...action.payload,
      }
    case "SET_INPUT_MODE":
      return {
        ...state,
        inputMode: action.payload,
      }
    case "SET_SELECTED_FILE":
      return {
        ...state,
        selectedFileId: action.payload,
      }
    case "SET_USER_STORY_INPUT":
      return {
        ...state,
        userStoryInput: action.payload,
      }
    case "UPLOAD_START":
      return {
        ...state,
        uploadStatus: "loading",
        uploadError: null,
        uploadedFiles: [...action.payload, ...state.uploadedFiles],
        selectedFileId: action.payload[0]?.id ?? state.selectedFileId,
      }
    case "UPLOAD_SUCCESS": {
      const uploadedIds = new Set(action.payload.map((file) => file.id))
      return {
        ...state,
        uploadStatus: "success",
        uploadedFiles: state.uploadedFiles.map((file) =>
          uploadedIds.has(file.id)
            ? action.payload.find((item) => item.id === file.id) ?? file
            : file,
        ),
      }
    }
    case "UPLOAD_ERROR":
      return {
        ...state,
        uploadStatus: "error",
        uploadError: action.payload,
        uploadedFiles: state.uploadedFiles.filter((file) => file.status !== "Uploading"),
      }
    case "REMOVE_FILE": {
      const files = state.uploadedFiles.filter((file) => file.id !== action.payload)
      const nextState = {
        ...state,
        uploadedFiles: files,
        selectedFileId:
          state.selectedFileId === action.payload ? files[0]?.id ?? null : state.selectedFileId,
      }
      return files.length === 0 ? resetSourceWorkflow(nextState) : nextState
    }
    case "ANALYSIS_START":
      return {
        ...state,
        analysis: {
          ...state.analysis,
          status: "loading",
          error: null,
        },
      }
    case "ANALYSIS_SUCCESS":
      return {
        ...state,
        uploadedFiles: state.uploadedFiles.map((file) => ({ ...file, status: "Analyzed" })),
        analysis: createAsyncSlice(action.payload, "success"),
      }
    case "ANALYSIS_ERROR":
      return {
        ...state,
        analysis: {
          ...state.analysis,
          status: "error",
          error: action.payload,
        },
      }
    case "TESTS_START":
      return {
        ...state,
        generatedTests: {
          ...state.generatedTests,
          status: "loading",
          error: null,
        },
      }
    case "TESTS_SUCCESS":
      return {
        ...state,
        generatedTests: createAsyncSlice(action.payload, "success"),
      }
    case "TESTS_ERROR":
      return {
        ...state,
        generatedTests: {
          ...state.generatedTests,
          status: "error",
          error: action.payload,
        },
      }
    case "USER_STORY_TESTS_START":
      return {
        ...state,
        userStoryTests: {
          ...state.userStoryTests,
          status: "loading",
          error: null,
        },
      }
    case "USER_STORY_TESTS_SUCCESS":
      return {
        ...state,
        userStoryTests: createAsyncSlice(action.payload, "success"),
      }
    case "USER_STORY_TESTS_ERROR":
      return {
        ...state,
        userStoryTests: {
          ...state.userStoryTests,
          status: "error",
          error: action.payload,
        },
      }
    case "EXECUTION_START":
      return {
        ...state,
        execution: {
          ...state.execution,
          status: "loading",
          error: null,
        },
      }
    case "EXECUTION_SUCCESS":
      return {
        ...state,
        execution: createAsyncSlice(action.payload, "success"),
      }
    case "EXECUTION_ERROR":
      return {
        ...state,
        execution: {
          ...state.execution,
          status: "error",
          error: action.payload,
        },
      }
    case "COVERAGE_START":
      return {
        ...state,
        coverage: {
          ...state.coverage,
          status: "loading",
          error: null,
        },
      }
    case "COVERAGE_SUCCESS":
      return {
        ...state,
        coverage: createAsyncSlice(action.payload, "success"),
      }
    case "COVERAGE_ERROR":
      return {
        ...state,
        coverage: {
          ...state.coverage,
          status: "error",
          error: action.payload,
        },
      }
    case "SET_EVALUATION_RESULTS":
      return {
        ...state,
        evaluationResults: action.payload,
      }
    case "PUSH_ACTIVITY":
      return {
        ...state,
        activity: prependActivity(state.activity, action.payload),
      }
    default:
      return state
  }
}

function createActivityItem(
  type: ActivityItem["type"],
  label: string,
  detail: string,
): ActivityItem {
  return {
    id: `activity-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    label,
    detail,
    time: "Just now",
  }
}

function deriveStats(state: TestGenAIState): AppStats {
  const sourceTests =
    (state.generatedTests.data?.summary.unitTestsGenerated ?? 0) +
    (state.generatedTests.data?.summary.edgeTestsGenerated ?? 0)
  const userStoryTests =
    (state.userStoryTests.data?.positiveCases.length ?? 0) +
    (state.userStoryTests.data?.negativeCases.length ?? 0) +
    (state.userStoryTests.data?.edgeCases.length ?? 0)
  const testsGenerated = state.inputMode === "user-story" ? userStoryTests : sourceTests
  const passedTests = state.execution.data?.passedTests ?? 0
  const failedTests = state.execution.data?.failedTests ?? 0

  return {
    filesUploaded: state.uploadedFiles.length,
    functionsDetected: state.analysis.data?.functions.length ?? 0,
    testsGenerated,
    passedTests,
    failedTests,
    passRate: state.execution.data?.passRate ?? 0,
    executionTime: state.execution.data?.executionTime ?? "0.00s",
    coveragePercentage: state.coverage.data?.coveragePercent ?? 0,
  }
}

type TestGenAIContextValue = {
  state: TestGenAIState
  stats: AppStats
  selectedFile: UploadedSourceFile | null
  userStoryWordCount: number
  setInputMode: (mode: InputMode) => void
  setSelectedFileId: (id: string | null) => void
  setUserStoryInput: (value: string) => void
  uploadFiles: (files: FileList | File[] | null) => Promise<void>
  removeFile: (id: string) => void
  analyzeWorkspace: () => Promise<void>
  generateSourceCodeTests: () => Promise<void>
  generateStoryTests: () => Promise<void>
  runWorkspaceTests: () => Promise<void>
  refreshCoverage: () => Promise<void>
}

const TestGenAIContext = createContext<TestGenAIContextValue | null>(null)

export function TestGenAIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      const [workspace, evaluationResults] = await Promise.all([
        getDemoWorkspace(),
        getEvaluationResults(),
      ])

      if (!mounted) return

      dispatch({
        type: "BOOTSTRAP",
        payload: {
          uploadedFiles: workspace.files,
          selectedFileId: workspace.files[0]?.id ?? null,
          userStoryInput: workspace.userStoryInput,
          analysis: createAsyncSlice(workspace.analysis, "success"),
          generatedTests: createAsyncSlice(workspace.generatedTests, "success"),
          userStoryTests: createAsyncSlice(workspace.userStoryTests, "success"),
          execution: createAsyncSlice(workspace.execution, "success"),
          coverage: createAsyncSlice(workspace.coverage, "success"),
          evaluationResults,
          activity: workspace.activity,
        },
      })
    }

    void bootstrap()

    return () => {
      mounted = false
    }
  }, [])

  const selectedFile =
    state.uploadedFiles.find((file) => file.id === state.selectedFileId) ?? null
  const userStoryWordCount = getWordCount(state.userStoryInput)
  const stats = deriveStats(state)

  const setInputMode = (mode: InputMode) => {
    startTransition(() => {
      dispatch({ type: "SET_INPUT_MODE", payload: mode })
    })
  }

  const setSelectedFileId = (id: string | null) => {
    dispatch({ type: "SET_SELECTED_FILE", payload: id })
  }

  const setUserStoryInput = (value: string) => {
    dispatch({ type: "SET_USER_STORY_INPUT", payload: value })
  }

  const uploadFilesAction = async (files: FileList | File[] | null) => {
    const list = files ? Array.from(files) : []
    if (list.length === 0) return

    const optimisticFiles = list.map((file, index) => ({
      id: `local-${Date.now()}-${index}`,
      language: "Detecting",
      name: file.name,
      repository: "local-workspace",
      sizeBytes: file.size,
      sizeLabel: `${file.size} B`,
      source: "local" as const,
      status: "Uploading" as const,
      uploadedAt: new Date().toISOString(),
    }))

    dispatch({ type: "UPLOAD_START", payload: optimisticFiles })

    try {
      const uploaded = await uploadFile(
        list.map((file, index) => Object.assign(file, { id: optimisticFiles[index]?.id })),
      )
      const normalized = uploaded.map((file, index) => ({
        ...file,
        id: optimisticFiles[index]?.id ?? file.id,
      }))
      dispatch({ type: "UPLOAD_SUCCESS", payload: normalized })
      dispatch({
        type: "PUSH_ACTIVITY",
        payload: createActivityItem("upload", "Source Files Uploaded", `${normalized.length} new files staged`),
      })
    } catch (error) {
      dispatch({
        type: "UPLOAD_ERROR",
        payload: error instanceof Error ? error.message : "Upload failed.",
      })
    }
  }

  const removeFile = (id: string) => {
    dispatch({ type: "REMOVE_FILE", payload: id })
  }

  const analyzeWorkspace = async () => {
    if (state.uploadedFiles.length === 0) return

    dispatch({ type: "ANALYSIS_START" })
    try {
      const analysis = await analyzeCode(state.uploadedFiles)
      dispatch({ type: "ANALYSIS_SUCCESS", payload: analysis })
      dispatch({
        type: "PUSH_ACTIVITY",
        payload: createActivityItem(
          "analysis",
          "AST Analysis Ready",
          `${analysis.functions.length} functions and ${analysis.classes.length} classes detected`,
        ),
      })
    } catch (error) {
      dispatch({
        type: "ANALYSIS_ERROR",
        payload: error instanceof Error ? error.message : "Analysis failed.",
      })
    }
  }

  const generateSourceCodeTestsAction = async () => {
    if (state.uploadedFiles.length === 0) return

    dispatch({ type: "TESTS_START" })
    try {
      const tests = await generateTests(state.uploadedFiles)
      dispatch({ type: "TESTS_SUCCESS", payload: tests })
      dispatch({
        type: "PUSH_ACTIVITY",
        payload: createActivityItem(
          "generation",
          "Tests Generated",
          `${tests.summary.unitTestsGenerated + tests.summary.edgeTestsGenerated} source-code tests prepared`,
        ),
      })
    } catch (error) {
      dispatch({
        type: "TESTS_ERROR",
        payload: error instanceof Error ? error.message : "Test generation failed.",
      })
    }
  }

  const generateStoryTestsAction = async () => {
    if (!state.userStoryInput.trim()) return

    dispatch({ type: "USER_STORY_TESTS_START" })
    try {
      const suite = await generateUserStoryTests(state.userStoryInput)
      dispatch({ type: "USER_STORY_TESTS_SUCCESS", payload: suite })
      dispatch({
        type: "PUSH_ACTIVITY",
        payload: createActivityItem(
          "generation",
          "User Story Cases Generated",
          `${suite.positiveCases.length + suite.negativeCases.length + suite.edgeCases.length} scenarios created`,
        ),
      })
    } catch (error) {
      dispatch({
        type: "USER_STORY_TESTS_ERROR",
        payload: error instanceof Error ? error.message : "User story generation failed.",
      })
    }
  }

  const runWorkspaceTests = async () => {
    dispatch({ type: "EXECUTION_START" })
    try {
      const execution = await runTests(state.inputMode)
      dispatch({ type: "EXECUTION_SUCCESS", payload: execution })
      dispatch({
        type: "PUSH_ACTIVITY",
        payload: createActivityItem(
          "execution",
          "Test Run Completed",
          `${execution.passedTests} passed and ${execution.failedTests} failed in ${execution.executionTime}`,
        ),
      })
    } catch (error) {
      dispatch({
        type: "EXECUTION_ERROR",
        payload: error instanceof Error ? error.message : "Execution failed.",
      })
    }
  }

  const refreshCoverage = async () => {
    dispatch({ type: "COVERAGE_START" })
    try {
      const coverage = await getCoverage()
      dispatch({ type: "COVERAGE_SUCCESS", payload: coverage })
      dispatch({
        type: "PUSH_ACTIVITY",
        payload: createActivityItem(
          "coverage",
          "Coverage Calculated",
          `${coverage.coveragePercent}% coverage across ${coverage.byFile.length} files`,
        ),
      })
    } catch (error) {
      dispatch({
        type: "COVERAGE_ERROR",
        payload: error instanceof Error ? error.message : "Coverage collection failed.",
      })
    }
  }

  return (
    <TestGenAIContext.Provider
      value={{
        state,
        stats,
        selectedFile,
        userStoryWordCount,
        setInputMode,
        setSelectedFileId,
        setUserStoryInput,
        uploadFiles: uploadFilesAction,
        removeFile,
        analyzeWorkspace,
        generateSourceCodeTests: generateSourceCodeTestsAction,
        generateStoryTests: generateStoryTestsAction,
        runWorkspaceTests,
        refreshCoverage,
      }}
    >
      {children}
    </TestGenAIContext.Provider>
  )
}

export function useTestGenAI() {
  const context = useContext(TestGenAIContext)
  if (!context) {
    throw new Error("useTestGenAI must be used within TestGenAIProvider.")
  }
  return context
}
