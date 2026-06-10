import type {
  AnalysisResult,
  CoverageReport,
  ExecutionResult,
  InputMode,
  GeneratedTests,
  UploadedSourceFile,
  UserStoryTestSuite,
} from '@/lib/testgenai-types'

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL ?? 'http://127.0.0.1:8000'

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : payload && typeof payload === 'object' && 'detail' in payload
          ? String(payload.detail)
          : 'Request failed.'
    throw new Error(message)
  }

  return payload as T
}

export async function uploadFile(files: File[]): Promise<UploadedSourceFile[]> {
  const uploaded: UploadedSourceFile[] = []

  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    uploaded.push(await parseJsonResponse<UploadedSourceFile>(response))
  }

  return uploaded
}

export async function analyzeCode(file: UploadedSourceFile): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file_name: file.name }),
  })

  return parseJsonResponse<AnalysisResult>(response)
}

export async function generateTests(file: UploadedSourceFile): Promise<GeneratedTests> {
  const response = await fetch('/api/generate-tests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file_name: file.name }),
  })

  return parseJsonResponse<GeneratedTests>(response)
}

export async function generateUserStoryTests(story: string): Promise<UserStoryTestSuite> {
  const response = await fetch('/api/generate-userstory-tests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_story: story }),
  })

  return parseJsonResponse<UserStoryTestSuite>(response)
}

export async function runTests(mode: InputMode): Promise<ExecutionResult> {
  if (mode !== 'source-code') {
    throw new Error('Test execution is only available for source code mode in MVP.')
  }

  const response = await fetch('/api/run-tests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mode }),
  })

  return parseJsonResponse<ExecutionResult>(response)
}

export async function getCoverage(): Promise<CoverageReport> {
  const response = await fetch(`${FASTAPI_BASE_URL}/coverage`)
  return parseJsonResponse<CoverageReport>(response)
}
