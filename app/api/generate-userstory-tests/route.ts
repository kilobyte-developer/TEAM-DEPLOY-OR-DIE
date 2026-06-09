import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

interface GenerateUserstoryTestsRequest {
  user_story: string;
}

interface GenerateUserstoryTestsResponse {
  test_cases: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateUserstoryTestsRequest = await request.json();

    if (!body.user_story || typeof body.user_story !== 'string') {
      return NextResponse.json(
        { error: 'user_story is required and must be a string' },
        { status: 400 }
      );
    }

    if (!body.user_story.trim()) {
      return NextResponse.json(
        { error: 'user_story cannot be empty' },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GROQ_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey: geminiApiKey });

    const prompt = `You are a QA engineer. Given the following user story, generate a structured list of test cases.

Rules:
- Output valid JSON only — no markdown fences, no explanation
- Return exactly this shape: { "test_cases": ["test case 1", "test case 2", ...] }
- Include: functional test cases (happy path), negative test cases (invalid inputs, wrong state), and edge cases (empty fields, boundary values, concurrent actions)
- Each test case should be a single descriptive sentence starting with a verb, e.g. "Verify that a valid email triggers a password reset email"

User story:
${body.user_story}`;

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = result.choices[0].message.content;

    let response: GenerateUserstoryTestsResponse;
    try {
      response = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse Gemini response' },
        { status: 500 }
      );
    }

    if (!response.test_cases || !Array.isArray(response.test_cases)) {
      return NextResponse.json(
        { error: 'Invalid response structure from Gemini' },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: 'User story test generation failed' },
      { status: 500 }
    );
  }
}
