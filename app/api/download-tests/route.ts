import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const GENERATED_TESTS_DIR = '/tmp/testgenai_generated_tests';

export async function GET() {
  try {
    const testFilePath = join(GENERATED_TESTS_DIR, 'test_generated.py');
    const fileContent = await readFile(testFilePath, 'utf-8');

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/x-python',
        'Content-Disposition': 'attachment; filename="test_generated.py"',
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return NextResponse.json(
        { error: 'No generated tests found. Run test generation first.' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to download tests' },
      { status: 500 }
    );
  }
}
