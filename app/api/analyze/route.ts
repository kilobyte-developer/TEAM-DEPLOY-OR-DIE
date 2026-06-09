import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import Groq from 'groq-sdk';

const UPLOADS_DIR = join(process.cwd(), 'backend', 'uploads');

interface AnalysisRequest {
  file_name: string;
}

interface FunctionInfo {
  name: string;
  parameters: string[];
}

interface AnalysisResponse {
  functions: FunctionInfo[];
  classes: string[];
  imports: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();

    if (!body.file_name || typeof body.file_name !== 'string') {
      return NextResponse.json(
        { error: 'file_name is required and must be a string' },
        { status: 400 }
      );
    }

    const filePath = join(UPLOADS_DIR, body.file_name);
    const sourceCode = await readFile(filePath, 'utf-8');

    if (!sourceCode.trim()) {
      return NextResponse.json(
        { error: 'File is empty' },
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

    const prompt = `Analyze the following Python code and extract all functions, classes, and imports. Return ONLY a valid JSON object with no markdown fences, no additional text, no code block markers.

Python code:
\`\`\`python
${sourceCode}
\`\`\`

Return JSON in this exact format:
{
  "functions": [{"name": "function_name", "parameters": ["param1", "param2"]}, ...],
  "classes": ["ClassName1", "ClassName2", ...],
  "imports": ["import_name1", "import_name2", ...]
}`;

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = result.choices[0].message.content;

    let analysis: AnalysisResponse;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse Gemini response' },
        { status: 500 }
      );
    }

    if (!analysis.functions || !analysis.classes || !analysis.imports) {
      return NextResponse.json(
        { error: 'Invalid response structure from Gemini' },
        { status: 500 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
