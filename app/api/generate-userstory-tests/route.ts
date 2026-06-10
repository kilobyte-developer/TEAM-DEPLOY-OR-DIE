import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type Priority = 'Low' | 'Medium' | 'High' | 'Critical'

type ProviderMetadata = {
  provider: 'openai' | 'gemini' | 'local'
  model?: string
}

type UserStoryCase = {
  id: string
  priority: Priority
  scenario: string
  steps: string[]
  expectedResult: string
}

type UserStorySuite = {
  story: string
  status: 'Generated'
  wordCount: number
  generatedAt: string
  provider: ProviderMetadata
  positiveCases: UserStoryCase[]
  negativeCases: UserStoryCase[]
  edgeCases: UserStoryCase[]
}

type ParsedRule = {
  raw: string
  subject: string
  action: string
  value?: number
  secondaryValue?: number
  unit?: string
  comparator?: '>' | '>=' | '<' | '<=' | '=' | 'between' | 'above' | 'below' | 'within'
  category:
    | 'amount-minimum'
    | 'daily-limit'
    | 'otp-threshold'
    | 'otp-expiry'
    | 'existence'
    | 'balance'
    | 'range'
    | 'minimum'
    | 'maximum'
    | 'percentage-limit'
    | 'document-required'
    | 'duplicate-window'
    | 'outcome'
    | 'generic-required'
}

const OPENAI_MODEL = 'gpt-4.1-mini'
const GEMINI_MODEL = 'gemini-2.5-flash-lite'

function getWordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0
}

function createCase(
  id: string,
  priority: Priority,
  scenario: string,
  steps: string[],
  expectedResult: string,
): UserStoryCase {
  return {
    id,
    priority,
    scenario,
    steps,
    expectedResult,
  }
}

function normalizeCurrencyValue(value: string) {
  return Number(value.replace(/[₹,\s]/g, ''))
}

function formatValue(value: number | undefined, unit?: string) {
  if (value === undefined) return 'the required value'
  if (unit === 'currency') return `₹${value.toLocaleString('en-IN')}`
  if (unit === 'percent') return `${value}%`
  if (unit === 'minutes') return `${value} minutes`
  if (unit === 'days') return `${value} days`
  return String(value)
}

function extractAcceptanceCriteria(story: string) {
  const criteriaSection = story.split(/acceptance\s+criteria\s*:/i)[1] ?? story
  const lines = criteriaSection
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const numbered = lines
    .map((line) => line.replace(/^[-*]\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter((line) => line.length > 0)

  if (numbered.length > 1 || /acceptance\s+criteria\s*:/i.test(story)) {
    return numbered
  }

  return story
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.trim().replace(/[.!?]$/, ''))
    .filter((sentence) => /\b(must|should|required|require|limit|cannot|between|above|below|greater|less|exceed|expire|exist|sufficient)\b/i.test(sentence))
}

function extractNumbers(text: string) {
  return Array.from(text.matchAll(/₹?\s*\d[\d,]*(?:\.\d+)?/g)).map((match) => normalizeCurrencyValue(match[0]))
}

function detectUnit(text: string): ParsedRule['unit'] {
  if (/₹|amount|balance|income|emi|loan|transfer|payment|price|salary/i.test(text)) return 'currency'
  if (/%|percent|percentage/i.test(text)) return 'percent'
  if (/minute/i.test(text)) return 'minutes'
  if (/day/i.test(text)) return 'days'
  return undefined
}

function subjectFromCriterion(text: string) {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  const beforeMust = cleaned.split(/\s+(?:must|should|cannot|can't|requires?|is|required|expires?|exceed|be)\b/i)[0]
  return (beforeMust || cleaned).replace(/^the\s+/i, '').trim()
}

function parseCriterion(raw: string): ParsedRule {
  const text = raw.trim().replace(/\.$/, '')
  const numbers = extractNumbers(text)
  const unit = detectUnit(text)
  const base = {
    raw: text,
    subject: subjectFromCriterion(text),
    action: text,
    value: numbers[0],
    secondaryValue: numbers[1],
    unit,
  }

  if (/\botp\b/i.test(text) && /above|greater than|>|exceed/i.test(text)) {
    return { ...base, category: 'otp-threshold', comparator: 'above' }
  }

  if (/\botp\b/i.test(text) && /expire/i.test(text)) {
    return { ...base, category: 'otp-expiry', comparator: 'within' }
  }

  if (/daily|per day|day/i.test(text) && /limit|maximum|cannot exceed|=|<=|not exceed/i.test(text)) {
    return { ...base, category: 'daily-limit', comparator: '<=' }
  }

  if (/amount/i.test(text) && /(>\s*0|greater than\s+0|positive)/i.test(text)) {
    return { ...base, category: 'amount-minimum', comparator: '>' }
  }

  if (/between/i.test(text) && numbers.length >= 2) {
    return { ...base, category: 'range', comparator: 'between' }
  }

  if (/credit score/i.test(text) && /above|greater than|>/i.test(text)) {
    return { ...base, category: 'minimum', comparator: 'above', unit: undefined }
  }

  if (/greater than|above|>\s*/i.test(text)) {
    return { ...base, category: 'minimum', comparator: '>' }
  }

  if (/cannot exceed|must not exceed|not exceed|less than|below|<=|maximum/i.test(text) && /%|percent|percentage/i.test(text)) {
    return { ...base, category: 'percentage-limit', comparator: '<=' }
  }

  if (/cannot exceed|must not exceed|not exceed|less than|below|<=|maximum|limit/i.test(text)) {
    return { ...base, category: 'maximum', comparator: '<=' }
  }

  if (/recipient|account|user|customer|record/i.test(text) && /exist/i.test(text)) {
    return { ...base, category: 'existence' }
  }

  if (/sufficient balance|balance required|available balance/i.test(text)) {
    return { ...base, category: 'balance' }
  }

  if (/document|kyc|proof|upload/i.test(text) && /required|must|before/i.test(text)) {
    return { ...base, category: 'document-required' }
  }

  if (/duplicate|repeat/i.test(text) && /day|hour|minute/i.test(text)) {
    return { ...base, category: 'duplicate-window', comparator: 'within' }
  }

  if (/approval|rejection|summary|reason|display|notify/i.test(text)) {
    return { ...base, category: 'outcome' }
  }

  return { ...base, category: 'generic-required' }
}

function priorityFor(rule: ParsedRule): Priority {
  if (['otp-threshold', 'otp-expiry', 'daily-limit', 'balance'].includes(rule.category)) return 'Critical'
  if (['amount-minimum', 'existence', 'range', 'minimum', 'maximum', 'percentage-limit'].includes(rule.category)) return 'High'
  return 'Medium'
}

function stepSubject(rule: ParsedRule) {
  return rule.subject || 'the business rule'
}

function positiveScenario(rule: ParsedRule) {
  const value = rule.value
  const second = rule.secondaryValue

  switch (rule.category) {
    case 'amount-minimum':
      return {
        scenario: `Accept transfer amount above the minimum: ${rule.raw}`,
        steps: ['Open the payment transfer flow.', 'Enter amount ₹1 with a valid recipient and sufficient balance.', 'Submit the transfer request.'],
        expected: 'Transfer is accepted because the amount is greater than 0.',
      }
    case 'daily-limit':
      return {
        scenario: `Allow usage below the daily limit: ${rule.raw}`,
        steps: ['Open the transfer flow.', `Enter cumulative daily transfers of ${formatValue(value ? value - 1 : undefined, rule.unit)}.`, 'Submit the transfer.'],
        expected: `Transfer succeeds because the daily total remains below ${formatValue(value, rule.unit)}.`,
      }
    case 'otp-threshold':
      return {
        scenario: `Require and accept valid OTP above threshold: ${rule.raw}`,
        steps: ['Open the transfer flow.', `Enter transfer amount ${formatValue(value ? value + 5000 : undefined, rule.unit)}.`, 'Submit a valid OTP and confirm the transfer.'],
        expected: 'Transfer succeeds only after valid OTP verification.',
      }
    case 'otp-expiry':
      return {
        scenario: `Accept OTP before expiry: ${rule.raw}`,
        steps: ['Generate an OTP for the transaction.', `Enter the OTP within ${formatValue(value, rule.unit)}.`, 'Confirm the secured action.'],
        expected: `OTP is accepted because it is used before the ${formatValue(value, rule.unit)} expiry window closes.`,
      }
    case 'existence':
      return {
        scenario: `Accept request when ${stepSubject(rule)} exists`,
        steps: ['Open the workflow.', `Select an existing ${stepSubject(rule)}.`, 'Submit the request.'],
        expected: `The system accepts the request because ${stepSubject(rule)} exists.`,
      }
    case 'balance':
      return {
        scenario: 'Allow transaction when sufficient balance is available',
        steps: ['Open the transfer flow.', 'Enter an amount lower than the available balance.', 'Submit the transfer request.'],
        expected: 'Transfer succeeds because the account has sufficient balance.',
      }
    case 'range':
      return {
        scenario: `Accept value inside allowed range: ${rule.raw}`,
        steps: ['Open the workflow.', `Enter ${stepSubject(rule)} as ${formatValue(value, rule.unit)} to ${formatValue(second, rule.unit)} compliant data.`, 'Submit the request.'],
        expected: `The system accepts values inside ${formatValue(value, rule.unit)} and ${formatValue(second, rule.unit)}.`,
      }
    case 'minimum':
      return {
        scenario: `Accept value above minimum threshold: ${rule.raw}`,
        steps: ['Open the workflow.', `Enter ${stepSubject(rule)} above ${formatValue(value, rule.unit)}.`, 'Submit the request.'],
        expected: `The request is accepted because ${stepSubject(rule)} is above ${formatValue(value, rule.unit)}.`,
      }
    case 'maximum':
    case 'percentage-limit':
      return {
        scenario: `Accept value within maximum limit: ${rule.raw}`,
        steps: ['Open the workflow.', `Enter ${stepSubject(rule)} below ${formatValue(value, rule.unit)}.`, 'Submit the request.'],
        expected: `The request is accepted because ${stepSubject(rule)} does not exceed ${formatValue(value, rule.unit)}.`,
      }
    case 'document-required':
      return {
        scenario: `Accept submission with required documents: ${rule.raw}`,
        steps: ['Open the application workflow.', 'Upload every required document.', 'Submit the application.'],
        expected: 'Submission succeeds because all required documents are present.',
      }
    case 'duplicate-window':
      return {
        scenario: `Allow non-duplicate request outside restricted window: ${rule.raw}`,
        steps: ['Open the workflow.', `Submit a request after ${formatValue(value, rule.unit)} have elapsed since any previous matching request.`, 'Confirm submission.'],
        expected: 'The system accepts the request because it is outside the duplicate rejection window.',
      }
    case 'outcome':
      return {
        scenario: `Display required outcome: ${rule.raw}`,
        steps: ['Complete the workflow with data that reaches this outcome.', 'Submit the request.', 'Review the response shown to the user.'],
        expected: `The system presents the required outcome for: ${rule.raw}.`,
      }
    default:
      return {
        scenario: `Satisfy business rule: ${rule.raw}`,
        steps: ['Open the workflow.', `Provide valid data satisfying: ${rule.raw}.`, 'Submit the request.'],
        expected: 'The system accepts the request because the business rule is satisfied.',
      }
  }
}

function negativeScenario(rule: ParsedRule) {
  const value = rule.value
  const second = rule.secondaryValue

  switch (rule.category) {
    case 'amount-minimum':
      return {
        scenario: `Reject zero or negative amount: ${rule.raw}`,
        steps: ['Open the payment transfer flow.', 'Enter amount ₹0.', 'Submit the transfer request.'],
        expected: 'Transfer is rejected because the amount must be greater than 0.',
      }
    case 'daily-limit':
      return {
        scenario: `Reject usage above the daily limit: ${rule.raw}`,
        steps: ['Open the transfer flow.', `Enter cumulative daily transfers of ${formatValue(value ? value + 1 : undefined, rule.unit)}.`, 'Submit the transfer.'],
        expected: `Transfer is rejected because the daily total exceeds ${formatValue(value, rule.unit)}.`,
      }
    case 'otp-threshold':
      return {
        scenario: `Reject above-threshold transfer without OTP: ${rule.raw}`,
        steps: ['Open the transfer flow.', `Enter transfer amount ${formatValue(value ? value + 5000 : undefined, rule.unit)}.`, 'Submit without providing an OTP.'],
        expected: 'Transfer is rejected because OTP verification is required above the threshold.',
      }
    case 'otp-expiry':
      return {
        scenario: `Reject expired OTP: ${rule.raw}`,
        steps: ['Generate an OTP for the transaction.', `Wait longer than ${formatValue(value, rule.unit)}.`, 'Enter the expired OTP and submit.'],
        expected: `OTP is rejected because the ${formatValue(value, rule.unit)} expiry window has passed.`,
      }
    case 'existence':
      return {
        scenario: `Reject request when ${stepSubject(rule)} does not exist`,
        steps: ['Open the workflow.', `Enter or select a non-existent ${stepSubject(rule)}.`, 'Submit the request.'],
        expected: `The system rejects the request because ${stepSubject(rule)} must exist.`,
      }
    case 'balance':
      return {
        scenario: 'Reject transaction when balance is insufficient',
        steps: ['Open the transfer flow.', 'Enter an amount greater than the available balance.', 'Submit the transfer request.'],
        expected: 'Transfer is rejected and the account balance is not debited.',
      }
    case 'range':
      return {
        scenario: `Reject value outside allowed range: ${rule.raw}`,
        steps: ['Open the workflow.', `Enter ${stepSubject(rule)} below ${formatValue(value, rule.unit)} or above ${formatValue(second, rule.unit)}.`, 'Submit the request.'],
        expected: `The system rejects values outside ${formatValue(value, rule.unit)} to ${formatValue(second, rule.unit)}.`,
      }
    case 'minimum':
      return {
        scenario: `Reject value below minimum threshold: ${rule.raw}`,
        steps: ['Open the workflow.', `Enter ${stepSubject(rule)} below ${formatValue(value, rule.unit)}.`, 'Submit the request.'],
        expected: `The request is rejected because ${stepSubject(rule)} is not above ${formatValue(value, rule.unit)}.`,
      }
    case 'maximum':
    case 'percentage-limit':
      return {
        scenario: `Reject value above maximum limit: ${rule.raw}`,
        steps: ['Open the workflow.', `Enter ${stepSubject(rule)} above ${formatValue(value, rule.unit)}.`, 'Submit the request.'],
        expected: `The request is rejected because ${stepSubject(rule)} exceeds ${formatValue(value, rule.unit)}.`,
      }
    case 'document-required':
      return {
        scenario: `Reject submission with missing documents: ${rule.raw}`,
        steps: ['Open the application workflow.', 'Omit one required document.', 'Submit the application.'],
        expected: 'Submission is rejected until every required document is uploaded.',
      }
    case 'duplicate-window':
      return {
        scenario: `Reject duplicate request inside restricted window: ${rule.raw}`,
        steps: ['Submit a valid request.', `Submit a duplicate request within ${formatValue(value, rule.unit)}.`, 'Review the response.'],
        expected: 'The duplicate request is rejected and the original request remains unchanged.',
      }
    case 'outcome':
      return {
        scenario: `Do not hide required outcome: ${rule.raw}`,
        steps: ['Complete the workflow with data that reaches this outcome.', 'Submit the request.', 'Review the response.'],
        expected: `The system must not complete silently; it shows the required outcome for: ${rule.raw}.`,
      }
    default:
      return {
        scenario: `Reject violation of business rule: ${rule.raw}`,
        steps: ['Open the workflow.', `Provide data that violates: ${rule.raw}.`, 'Submit the request.'],
        expected: 'The system rejects the request with a clear business-rule validation message.',
      }
  }
}

function boundaryScenario(rule: ParsedRule) {
  const value = rule.value
  const second = rule.secondaryValue

  switch (rule.category) {
    case 'amount-minimum':
      return {
        scenario: 'Boundary amount exactly at ₹0',
        steps: ['Open the payment transfer flow.', 'Enter amount ₹0.', 'Submit the transfer request.'],
        expected: 'Transfer is rejected because the rule requires amount greater than 0.',
      }
    case 'daily-limit':
      return {
        scenario: `Boundary daily total exactly ${formatValue(value, rule.unit)}`,
        steps: ['Open the transfer flow.', `Set cumulative daily transfers to exactly ${formatValue(value, rule.unit)}.`, 'Submit the transfer.'],
        expected: `The system applies the configured policy at exactly ${formatValue(value, rule.unit)}; if the limit is inclusive, the transfer is allowed.`,
      }
    case 'otp-threshold':
      return {
        scenario: `Boundary transfer exactly ${formatValue(value, rule.unit)}`,
        steps: ['Open the transfer flow.', `Enter transfer amount exactly ${formatValue(value, rule.unit)}.`, 'Submit the transfer and observe OTP handling.'],
        expected: 'OTP validation is triggered according to the exact threshold policy.',
      }
    case 'otp-expiry':
      return {
        scenario: `Boundary OTP use exactly at ${formatValue(value, rule.unit)}`,
        steps: ['Generate an OTP for the transaction.', `Enter the OTP exactly at ${formatValue(value, rule.unit)}.`, 'Submit the secured action.'],
        expected: 'The system applies the exact expiry policy consistently at the boundary.',
      }
    case 'range':
      return {
        scenario: `Boundary values exactly ${formatValue(value, rule.unit)} and ${formatValue(second, rule.unit)}`,
        steps: ['Open the workflow.', `Enter ${stepSubject(rule)} exactly at the lower and upper limits.`, 'Submit the request.'],
        expected: `The system handles both inclusive boundaries ${formatValue(value, rule.unit)} and ${formatValue(second, rule.unit)} according to policy.`,
      }
    case 'minimum':
      return {
        scenario: `Boundary value exactly ${formatValue(value, rule.unit)}`,
        steps: ['Open the workflow.', `Enter ${stepSubject(rule)} exactly ${formatValue(value, rule.unit)}.`, 'Submit the request.'],
        expected: 'The system applies the exact threshold policy consistently at the boundary.',
      }
    case 'maximum':
    case 'percentage-limit':
      return {
        scenario: `Boundary value exactly ${formatValue(value, rule.unit)}`,
        steps: ['Open the workflow.', `Enter ${stepSubject(rule)} exactly ${formatValue(value, rule.unit)}.`, 'Submit the request.'],
        expected: `The system allows the value if the maximum limit is inclusive and rejects it if policy defines a strict less-than rule.`,
      }
    case 'duplicate-window':
      return {
        scenario: `Boundary duplicate exactly at ${formatValue(value, rule.unit)}`,
        steps: ['Submit a valid request.', `Submit a matching request exactly after ${formatValue(value, rule.unit)}.`, 'Review duplicate handling.'],
        expected: 'The system applies duplicate-window policy consistently at the exact boundary.',
      }
    default:
      return null
  }
}

function localGenerateUserStoryTests(story: string, provider: ProviderMetadata = { provider: 'local' }): UserStorySuite {
  const criteria = extractAcceptanceCriteria(story)
  const rules = (criteria.length ? criteria : [story]).map(parseCriterion)
  const positiveCases: UserStoryCase[] = []
  const negativeCases: UserStoryCase[] = []
  const edgeCases: UserStoryCase[] = []

  rules.forEach((rule, index) => {
    const positive = positiveScenario(rule)
    const negative = negativeScenario(rule)
    const boundary = boundaryScenario(rule)
    const padded = String(index + 1).padStart(3, '0')

    positiveCases.push(
      createCase(`TC-US-${padded}`, priorityFor(rule), positive.scenario, positive.steps, positive.expected),
    )
    negativeCases.push(
      createCase(`TC-US-NEG-${padded}`, priorityFor(rule), negative.scenario, negative.steps, negative.expected),
    )
    if (boundary) {
      edgeCases.push(
        createCase(`TC-US-EDGE-${padded}`, priorityFor(rule), boundary.scenario, boundary.steps, boundary.expected),
      )
    }
  })

  return {
    story,
    status: 'Generated',
    wordCount: getWordCount(story),
    generatedAt: new Date().toISOString(),
    provider,
    positiveCases,
    negativeCases,
    edgeCases,
  }
}

function buildPrompt(story: string) {
  return `You are TestGenAI, a senior QA test designer.

Generate a professional QA test suite from the user story and acceptance criteria.

Rules:
- Parse every acceptance criterion individually.
- Extract business rules, numeric thresholds, time limits, validation rules, security requirements, required fields, role restrictions, monetary limits, age limits, credit score limits, OTP requirements, and rate limits.
- For every acceptance criterion generate one positive test, one negative test, and one boundary/edge test when applicable.
- Do not generate generic QA templates such as "validate happy path" or "reject invalid input" unless tied to a concrete business rule.
- Implementation behavior must not determine expected outputs when semantic intent conflicts with implementation.
- Generate tests according to intended behavior.
- Implementation analysis is used only for bug detection.

Return strict JSON with this shape and no markdown:
{
  "positiveCases": [{"id":"TC-US-001","priority":"High","scenario":"...","steps":["..."],"expectedResult":"..."}],
  "negativeCases": [{"id":"TC-US-NEG-001","priority":"High","scenario":"...","steps":["..."],"expectedResult":"..."}],
  "edgeCases": [{"id":"TC-US-EDGE-001","priority":"Medium","scenario":"...","steps":["..."],"expectedResult":"..."}]
}

User story:
${story}`
}

function extractJsonObject(text: string) {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed
  const match = trimmed.match(/\{[\s\S]*\}/)
  return match ? match[0] : trimmed
}

function normalizeLlmSuite(story: string, provider: ProviderMetadata, payload: unknown): UserStorySuite {
  const candidate = payload as Partial<UserStorySuite>
  if (!Array.isArray(candidate.positiveCases) || !Array.isArray(candidate.negativeCases) || !Array.isArray(candidate.edgeCases)) {
    throw new Error('LLM response did not include required test case arrays.')
  }

  return {
    story,
    status: 'Generated',
    wordCount: getWordCount(story),
    generatedAt: new Date().toISOString(),
    provider,
    positiveCases: candidate.positiveCases,
    negativeCases: candidate.negativeCases,
    edgeCases: candidate.edgeCases,
  }
}

async function generateWithOpenAI(story: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured.')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You generate strict JSON QA test suites from user stories.' },
        { role: 'user', content: buildPrompt(story) },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') throw new Error('OpenAI returned an empty response.')

  return normalizeLlmSuite(
    story,
    { provider: 'openai', model: OPENAI_MODEL },
    JSON.parse(extractJsonObject(content)),
  )
}

async function generateWithGemini(story: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(story) }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}.`)
  }

  const data = await response.json()
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content || typeof content !== 'string') throw new Error('Gemini returned an empty response.')

  return normalizeLlmSuite(
    story,
    { provider: 'gemini', model: GEMINI_MODEL },
    JSON.parse(extractJsonObject(content)),
  )
}

async function generateWithProviders(story: string) {
  const priority = (process.env.LLM_PROVIDER_PRIORITY || 'openai').toLowerCase()
  const providers = priority === 'gemini'
    ? [generateWithGemini, generateWithOpenAI]
    : [generateWithOpenAI, generateWithGemini]

  for (const provider of providers) {
    try {
      return await provider(story)
    } catch {
      continue
    }
  }

  return localGenerateUserStoryTests(story)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const story = body.user_story

    if (!story || typeof story !== 'string') {
      return NextResponse.json({ error: 'user_story is required and must be a string.' }, { status: 400 })
    }

    const trimmedStory = story.trim()
    if (!trimmedStory) {
      return NextResponse.json({ error: 'user_story cannot be empty.' }, { status: 400 })
    }

    return NextResponse.json(await generateWithProviders(trimmedStory))
  } catch {
    return NextResponse.json(localGenerateUserStoryTests('The submitted user story could not be parsed exactly, but local fallback generated a safe suite.'))
  }
}
