/**
 * python-resolver.ts
 *
 * Resolves the correct Python executable for the backend venv, cross-platform.
 *
 * Why not bare 'python3'?
 *   On Ubuntu, 'python3' is /usr/bin/python3 (system Python, no venv packages).
 *   We must reference the venv interpreter explicitly.
 *
 * Why process.cwd() is safe here:
 *   Next.js always sets process.cwd() to the project root (where next.config.js
 *   lives), regardless of where `npm run dev` was invoked. This is a Next.js
 *   runtime guarantee for API routes.
 *
 * Cross-platform:
 *   Linux/macOS venv: backend/venv/bin/python
 *   Windows venv:     backend/venv/Scripts/python.exe
 */

import { existsSync } from 'fs'
import { join } from 'path'

// Next.js always sets process.cwd() to the project root.
export const PROJECT_ROOT = process.cwd()
export const BACKEND_DIR = join(PROJECT_ROOT, 'backend')

/**
 * Returns the absolute path to the venv Python executable, cross-platform.
 * Checks common venv locations in order, then falls back with a descriptive error.
 *
 * @throws Error with setup instructions if no venv python is found
 */
function resolveVenvPython(): string {
  const isWindows = process.platform === 'win32'

  const candidates = isWindows
    ? [
        join(BACKEND_DIR, 'venv', 'Scripts', 'python.exe'),
        join(BACKEND_DIR, '.venv', 'Scripts', 'python.exe'),
      ]
    : [
        join(BACKEND_DIR, 'venv', 'bin', 'python'),
        join(BACKEND_DIR, 'venv', 'bin', 'python3'),
        join(BACKEND_DIR, '.venv', 'bin', 'python'),
        join(BACKEND_DIR, '.venv', 'bin', 'python3'),
      ]

  const found = candidates.find(existsSync)

  if (!found) {
    // Throw a clear setup error rather than a cryptic spawn failure
    throw new Error(
      `[python-resolver] No venv Python interpreter found.\n` +
        `Searched:\n${candidates.map((c) => `  ${c}`).join('\n')}\n\n` +
        `Fix: cd backend && python3 -m venv venv && pip install -r requirements.txt\n` +
        `     (Windows: py -m venv venv && pip install -r requirements.txt)`,
    )
  }

  return found
}

export const VENV_PYTHON = resolveVenvPython()
