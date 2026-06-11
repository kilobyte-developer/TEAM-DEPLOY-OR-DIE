import type {
  AnalysisResult,
  AnalyticsDashboardData,
  CoverageReport,
  ExecutionResult,
  InputMode,
  GeneratedTests,
  PastRecordDetails,
  PastRecordSummary,
  UploadedSourceFile,
  UserStoryTestSuite,
} from '@/lib/testgenai-types'

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL ?? 'https://team-deploy-or-die.onrender.com'

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

export async function getPastRecords(): Promise<PastRecordSummary[]> {
  const response = await fetch('/api/history', { cache: 'no-store' })
  const payload = await parseJsonResponse<{ records: PastRecordSummary[] }>(response)
  return payload.records
}

export async function getPastRecordDetails(id: string): Promise<PastRecordDetails> {
  const response = await fetch(`/api/history/${encodeURIComponent(id)}`, { cache: 'no-store' })
  return parseJsonResponse<PastRecordDetails>(response)
}

export async function deletePastRecords(password: string, count: number): Promise<{ deleted: number; requested: number }> {
  const response = await fetch('/api/history', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password, count }),
  })

  return parseJsonResponse<{ deleted: number; requested: number }>(response)
}

export async function getAnalyticsDashboard(): Promise<AnalyticsDashboardData> {
  const response = await fetch('/api/dashboard', { cache: 'no-store' })
  return parseJsonResponse<AnalyticsDashboardData>(response)
}
