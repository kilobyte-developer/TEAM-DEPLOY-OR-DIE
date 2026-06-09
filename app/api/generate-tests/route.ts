import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import Groq from 'groq-sdk';

const GENERATED_TESTS_DIR = join(process.cwd(), 'backend', 'generated_tests');

interface GenerateTestsRequest {
  source_code: string;
}

interface GenerateTestsResponse {
  generated_tests: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateTestsRequest = await request.json();

    if (!body.source_code || typeof body.source_code !== 'string') {
      return NextResponse.json(
        { error: 'source_code is required and must be a string' },
        { status: 400 }
      );
    }

    if (!body.source_code.trim()) {
      return NextResponse.json(
        { error: 'source_code cannot be empty' },
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

    const prompt = `You are a Python testing expert. Given the following Python source code, generate comprehensive pytest test cases.

Rules:
- Output raw Python code only — no markdown fences, no explanation, no comments outside the test code
- Cover all functions with at least one happy path unit test
- Include edge cases: empty inputs, None values, boundary values, type mismatches where relevant
- Use descriptive test function names like test_add_returns_correct_sum
- Import the module under test correctly at the top

Source code:
${body.source_code}`;

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    });

    const generatedTests = result.choices[0].message.content;

    if (!generatedTests.trim()) {
      return NextResponse.json(
        { error: 'Gemini did not generate any test code' },
        { status: 500 }
      );
    }

    await mkdir(GENERATED_TESTS_DIR, { recursive: true });
    const testFilePath = join(GENERATED_TESTS_DIR, 'test_generated.py');
    await writeFile(testFilePath, generatedTests, 'utf-8');

    const response: GenerateTestsResponse = {
      generated_tests: generatedTests,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: 'Test generation failed' },
      { status: 500 }
    );
  }
}
