import { NextRequest, NextResponse } from 'next/server'

function getWordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0
}

function createCase(
  id: string,
  priority: 'Low' | 'Medium' | 'High' | 'Critical',
  scenario: string,
  steps: string[],
  expectedResult: string,
) {
  return {
    id,
    priority,
    scenario,
    steps,
    expectedResult,
  }
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

    const firstSentence = trimmedStory.split(/[.!?]\s/)[0]?.trim() || trimmedStory
    const actionPhrase = firstSentence.replace(/^As\s+a?n?\s+/i, '').trim()

    return NextResponse.json({
      story: trimmedStory,
      status: 'Generated',
      wordCount: getWordCount(trimmedStory),
      generatedAt: new Date().toISOString(),
      positiveCases: [
        createCase(
          'TC-US-001',
          'High',
          `Validate the primary happy path for: ${actionPhrase}`,
          ['Open the workflow described in the user story.', 'Provide valid required input.', 'Submit the request.'],
          'The system completes the requested action successfully.',
        ),
        createCase(
          'TC-US-002',
          'High',
          `Verify a valid user can complete the flow without validation errors for: ${actionPhrase}`,
          ['Navigate to the related screen.', 'Enter valid data for all required fields.', 'Confirm the action.'],
          'The feature accepts the valid request and produces the expected success outcome.',
        ),
      ],
      negativeCases: [
        createCase(
          'TC-US-NEG-001',
          'Critical',
          `Reject incomplete or invalid input for: ${actionPhrase}`,
          ['Open the workflow described in the story.', 'Leave a required field empty or provide invalid data.', 'Submit the request.'],
          'The system blocks the action and shows a clear validation message.',
        ),
        createCase(
          'TC-US-NEG-002',
          'High',
          `Prevent unauthorized or invalid state transitions for: ${actionPhrase}`,
          ['Reach the feature in a non-permitted state.', 'Attempt to perform the story action.', 'Observe the response.'],
          'The system denies the request safely and preserves application state.',
        ),
      ],
      edgeCases: [
        createCase(
          'TC-US-EDGE-001',
          'Medium',
          `Handle boundary input safely for: ${actionPhrase}`,
          ['Open the feature workflow.', 'Submit boundary-length, optional, or near-limit values.', 'Observe processing.'],
          'The system handles boundary values without crashing and returns a consistent result.',
        ),
        createCase(
          'TC-US-EDGE-002',
          'Medium',
          `Handle repeated or rapid submissions for: ${actionPhrase}`,
          ['Open the workflow.', 'Submit the same request multiple times quickly.', 'Observe duplicate handling.'],
          'The system remains stable and handles repeated submissions predictably.',
        ),
      ],
    })
  } catch {
    return NextResponse.json({ error: 'User story test generation failed' }, { status: 500 })
  }
}
