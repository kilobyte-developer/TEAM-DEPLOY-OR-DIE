import { spawnSync } from 'child_process'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { testgenaiDatabase } from '@/database/services/TestGenAIDatabaseService'
import type { GeneratedTests, PotentialLogicIssue, SemanticFunctionTestSuite, TestArtifact } from '@/lib/testgenai-types'
import { VENV_PYTHON, BACKEND_DIR } from '@/lib/python-resolver'

export const runtime = 'nodejs'

const ENGINE_PATH = join(BACKEND_DIR, 'mvp_engine.py')
const GENERATED_TESTS_DIR = '/tmp/testgenai_generated_tests'
const UPLOADS_DIR = '/tmp/testgenai_uploads'
const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const AI_FIX_MODEL = 'gemini-2.5-flash-lite'

type Manifest = {
  sourceFileName: string
  sourceFilePath: string
  moduleName: string
  unitTestFilePath: string
  edgeTestFilePath: string
  combinedTestFilePath: string
  analysis: unknown
  semanticSuites: SemanticFunctionTestSuite[]
  summary: GeneratedTests['summary']
}

type GeminiSourcePayload = {
  semanticSuites?: SemanticFunctionTestSuite[]
  unitTestCode?: string
  edgeTestCode?: string
}

type FixSuggestion = NonNullable<PotentialLogicIssue['fixSuggestion']>

function extractJsonObject(text: string) {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed
  const match = trimmed.match(/\{[\s\S]*\}/)
  return match ? match[0] : trimmed
}

function cleanCodeBlock(value: unknown) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/^```(?:python|py)?\s*/i, '')
    .replace(/```$/i, '')
    .trim() + '\n'
}

function countPytestFunctions(code: string) {
  return (code.match(/^def test_[\w_]+\(/gm) ?? []).length
}

function existingHarness(code: string) {
  const index = code.search(/^def test_/m)
  return index >= 0 ? code.slice(0, index).trim() : code
}

function semanticAssertionBlocks(code: string) {
  const blocks: string[] = []
  const matches = Array.from(code.matchAll(/^def test_[\w_]+_semantic_behavior(?:_\d+)?\(\):/gm))

  matches.forEach((match, index) => {
    const start = match.index ?? 0
    const next = matches[index + 1]?.index ?? code.length
    blocks.push(code.slice(start, next).trim())
  })

  return blocks
}

function preserveBaselineSemanticAssertions(candidateCode: string, baselineCode: string) {
  const missingBlocks = semanticAssertionBlocks(baselineCode).filter((block) => {
    const name = block.match(/^def (test_[\w_]+)\(/)?.[1]
    return name ? !candidateCode.includes(`def ${name}(`) : false
  })

  if (!missingBlocks.length) return candidateCode
  return `${candidateCode.trim()}\n\n# Preserved executable semantic assertions from local intent analysis.\n\n${missingBlocks.join('\n\n')}\n`
}

function buildGeminiSourcePrompt(sourceCode: string, baseline: GeneratedTests) {
  return `You are TestGenAI, a senior Python QA engineer.

Generate source-code tests from semantic intent, not by copying implementation behavior when intent conflicts.

Return strict JSON only. No markdown.

Required JSON shape:
{
  "semanticSuites": [
    {
      "id": "semantic-1",
      "functionName": "function_name",
      "fileName": "uploaded.py",
      "className": "OptionalClassName",
      "potentialLogicIssues": [{"message":"...", "confidence":"High"}],
      "unitTests": [{"id":"TC-1-UNIT-001","title":"...","category":"unit","input":"x = 1","expected":"..."}],
      "negativeTests": [{"id":"TC-1-NEG-001","title":"...","category":"negative","input":"...","expected":"..."}],
      "edgeCases": [{"id":"TC-1-EDGE-001","title":"...","category":"edge","input":"...","expected":"..."}],
      "boundaryCases": [{"id":"TC-1-BOUND-001","title":"...","category":"boundary","input":"...","expected":"..."}]
    }
  ],
  "unitTestCode": "complete pytest Python code",
  "edgeTestCode": "complete pytest Python code"
}

Requirements:
- Generate unit tests, negative tests, edge cases, boundary cases, potential logic issues, and reasoning in expected text.
- Keep expected outputs aligned with function names, docstrings, parameter names, and business intent.
- Include executable pytest code that imports the uploaded module from UPLOAD_DIR and can run without internet.
- Use this exact import harness at the top of both code strings, adapted only by preserving the provided values:
${existingHarness(baseline.unitTests[0]?.code ?? '')}
- Do not include markdown fences in code strings.

Baseline AST analysis and local semantic context:
${JSON.stringify({ summary: baseline.summary, semanticSuites: baseline.semanticSuites ?? [] }, null, 2)}

Uploaded Python source:
${sourceCode}`
}

function normalizeGeminiSourcePayload(raw: unknown, baseline: GeneratedTests): GeneratedTests {
  const payload = raw as GeminiSourcePayload
  if (!Array.isArray(payload.semanticSuites) || payload.semanticSuites.length === 0) {
    throw new Error('Gemini source-code response did not include semantic suites.')
  }

  const unitCode = preserveBaselineSemanticAssertions(
    cleanCodeBlock(payload.unitTestCode),
    baseline.unitTests[0]?.code ?? '',
  )
  const edgeCode = cleanCodeBlock(payload.edgeTestCode)
  if (!unitCode.includes('def test_') || !edgeCode.includes('def test_')) {
    throw new Error('Gemini source-code response did not include executable pytest functions.')
  }

  const unitArtifact: TestArtifact = {
    ...baseline.unitTests[0],
    code: unitCode,
    testCount: countPytestFunctions(unitCode),
  }
  const edgeArtifact: TestArtifact = {
    ...baseline.edgeCaseTests[0],
    code: edgeCode,
    testCount: countPytestFunctions(edgeCode),
  }

  return {
    ...baseline,
    generatedAt: new Date().toISOString(),
    provider: { provider: 'gemini', model: GEMINI_MODEL },
    semanticSuites: payload.semanticSuites,
    unitTests: [unitArtifact],
    edgeCaseTests: [edgeArtifact],
    summary: {
      ...baseline.summary,
      unitTestsGenerated: unitArtifact.testCount,
      edgeTestsGenerated: edgeArtifact.testCount,
    },
  }
}

async function callGemini(apiKey: string, prompt: string, model = GEMINI_MODEL) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}.`)
  const data = await response.json()
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content || typeof content !== 'string') throw new Error('Gemini returned an empty response.')
  return JSON.parse(extractJsonObject(content))
}

function buildFixPrompt(sourceCode: string, suite: SemanticFunctionTestSuite, issue: PotentialLogicIssue) {
  return `You are TestGenAI Fixations, a senior Python debugging assistant.

Analyze the potential logic issue and suggest a precise fix. Reason from source code and semantic intent. Do not use deterministic string replacement.

Return strict JSON only:
{
  "issueSummary": "...",
  "currentCode": "exact current line or minimal snippet",
  "suggestedCode": "replacement line or minimal snippet",
  "explanation": "...",
  "confidence": 95,
  "severity": "High",
  "potentialImpact": "..."
}

Function: ${suite.className ? `${suite.className}.` : ''}${suite.functionName}
Issue: ${issue.message}
Existing confidence: ${issue.confidence}

Full source:
${sourceCode}`
}

function unavailableFix(): FixSuggestion {
  return {
    status: 'unavailable',
    issueSummary: 'AI Fix Suggestion Unavailable',
    explanation: 'AI Fix Suggestion Unavailable',
    provider: 'gemini',
    model: AI_FIX_MODEL,
    generatedAt: new Date().toISOString(),
  }
}

function normalizeFixSuggestion(payload: unknown): FixSuggestion {
  const candidate = payload as Partial<FixSuggestion>
  if (!candidate.issueSummary || !candidate.suggestedCode || !candidate.explanation) {
    throw new Error('Gemini fix response was incomplete.')
  }

  return {
    status: 'available',
    issueSummary: String(candidate.issueSummary),
    currentCode: candidate.currentCode ? String(candidate.currentCode) : '',
    suggestedCode: String(candidate.suggestedCode),
    explanation: String(candidate.explanation),
    confidence: candidate.confidence ?? 90,
    severity: candidate.severity ?? 'High',
    potentialImpact: candidate.potentialImpact ? String(candidate.potentialImpact) : 'Could cause behavior that contradicts the intended business rule.',
    provider: 'gemini',
    model: AI_FIX_MODEL,
    generatedAt: new Date().toISOString(),
  }
}

async function enrichFixSuggestions(sourceCode: string, tests: GeneratedTests): Promise<GeneratedTests> {
  const apiKey = process.env.GEMINI_AI_FIXATIONS_API_KEY
  const semanticSuites = tests.semanticSuites ?? []
  if (!semanticSuites.some((suite) => (suite.potentialLogicIssues ?? []).length > 0)) return tests

  const enrichedSuites: SemanticFunctionTestSuite[] = []

  for (const suite of semanticSuites) {
    const issues = suite.potentialLogicIssues ?? []
    if (!issues.length) {
      enrichedSuites.push(suite)
      continue
    }

    const enrichedIssues: PotentialLogicIssue[] = []
    for (const issue of issues) {
      if (!apiKey) {
        enrichedIssues.push({ ...issue, severity: 'High', fixSuggestion: unavailableFix() })
        continue
      }

      try {
        const suggestion = normalizeFixSuggestion(await callGemini(apiKey, buildFixPrompt(sourceCode, suite, issue), AI_FIX_MODEL))
        enrichedIssues.push({
          ...issue,
          severity: suggestion.severity,
          confidence: suggestion.confidence ?? issue.confidence,
          fixSuggestion: suggestion,
        })
      } catch {
        enrichedIssues.push({ ...issue, severity: 'High', fixSuggestion: unavailableFix() })
      }
    }

    enrichedSuites.push({ ...suite, potentialLogicIssues: enrichedIssues })
  }

  return { ...tests, semanticSuites: enrichedSuites }
}

async function writeGeneratedArtifacts(filePath: string, tests: GeneratedTests, baselineManifest: Manifest) {
  const unitFilePath = join(GENERATED_TESTS_DIR, `test_${baselineManifest.moduleName}_unit.py`)
  const edgeFilePath = join(GENERATED_TESTS_DIR, `test_${baselineManifest.moduleName}_edge.py`)
  const combinedFilePath = join(GENERATED_TESTS_DIR, 'test_generated.py')
  const unitCode = tests.unitTests[0]?.code ?? ''
  const edgeCode = tests.edgeCaseTests[0]?.code ?? ''

  await mkdir(GENERATED_TESTS_DIR, { recursive: true })
  await writeFile(unitFilePath, unitCode, 'utf-8')
  await writeFile(edgeFilePath, edgeCode, 'utf-8')
  await writeFile(combinedFilePath, `${unitCode}\n\n${edgeCode}`, 'utf-8')
  await writeFile(
    join(GENERATED_TESTS_DIR, 'manifest.json'),
    JSON.stringify({
      ...baselineManifest,
      sourceFilePath: filePath,
      unitTestFilePath: unitFilePath,
      edgeTestFilePath: edgeFilePath,
      combinedTestFilePath: combinedFilePath,
      semanticSuites: tests.semanticSuites ?? [],
      summary: tests.summary,
    }, null, 2),
    'utf-8',
  )
}

async function tryGenerateWithGemini(filePath: string, baseline: GeneratedTests): Promise<GeneratedTests> {
  const apiKey = process.env.GEMINI_SOURCE_CODE_TESTS_API_KEY
  if (!apiKey) return { ...baseline, provider: { provider: 'local', model: 'mvp_engine', fallbackReason: 'GEMINI_SOURCE_CODE_TESTS_API_KEY is not configured.' } }

  try {
    const sourceCode = await readFile(filePath, 'utf-8')
    return normalizeGeminiSourcePayload(
      await callGemini(apiKey, buildGeminiSourcePrompt(sourceCode, baseline)),
      baseline,
    )
  } catch (error) {
    return {
      ...baseline,
      provider: {
        provider: 'local',
        model: 'mvp_engine',
        fallbackReason: error instanceof Error ? error.message : 'Gemini source-code generation failed.',
      },
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const fileName = body.file_name ?? body.fileName

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'file_name is required and must be a string.' }, { status: 400 })
    }

    const filePath = join(UPLOADS_DIR, fileName)
    const result = spawnSync(VENV_PYTHON, [ENGINE_PATH, 'generate-tests', filePath, GENERATED_TESTS_DIR], {
      cwd: BACKEND_DIR,
      encoding: 'utf-8',
    })

    if (result.status !== 0) {
      const errorMessage = result.stderr.trim() || 'Test generation failed.'
      const status = errorMessage.includes('File not found') ? 404 : 500
      return NextResponse.json({ error: errorMessage }, { status })
    }

    const baselinePayload = JSON.parse(result.stdout) as GeneratedTests
    const manifest = JSON.parse(await readFile(join(GENERATED_TESTS_DIR, 'manifest.json'), 'utf-8')) as Manifest
    const geminiPayload = await tryGenerateWithGemini(filePath, baselinePayload)
    const sourceCode = await readFile(filePath, 'utf-8')
    const payload = await enrichFixSuggestions(sourceCode, geminiPayload)
    await writeGeneratedArtifacts(filePath, payload, manifest)
    await testgenaiDatabase.recordGeneratedTests(fileName, payload)

    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ error: 'Test generation failed' }, { status: 500 })
  }
}
