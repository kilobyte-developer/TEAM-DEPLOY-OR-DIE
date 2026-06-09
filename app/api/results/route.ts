import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const REPORTS_DIR = join(process.cwd(), 'backend', 'reports');

interface ResultsResponse {
  tests_generated: number;
  passed: number;
  failed: number;
  pass_rate: number;
}

export async function GET() {
  try {
    const resultsPath = join(REPORTS_DIR, 'results.json');
    const fileContent = await readFile(resultsPath, 'utf-8');
    const results: ResultsResponse = JSON.parse(fileContent);

    return NextResponse.json(results);
  } catch {
    // File doesn't exist or is malformed — return default empty results
    const defaultResults: ResultsResponse = {
      tests_generated: 0,
      passed: 0,
      failed: 0,
      pass_rate: 0,
    };

    return NextResponse.json(defaultResults);
  }
}
