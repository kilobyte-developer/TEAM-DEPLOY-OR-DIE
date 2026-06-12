/**
 * python-resolver.ts
 *
 * Resolves the correct Python executable for the backend venv, cross-platform.
 *
 * Why not bare 'python3'?
 *   On Ubuntu, 'python3' is /usr/bin/python3 (system Python, no venv packages).
 *   We must reference the venv interpreter explicitly.
 *
 * Why paths are built lazily inside functions (never at module top-level):
 *   Turbopack statically analyses all path.join() calls at the module level
 *   and follows any resulting symlinks during the build. The venv symlinks
 *   point to /usr/bin/python3 (an absolute path outside the project root),
 *   which Turbopack rejects with "points out of the filesystem root".
 *   Building paths only inside a called function prevents Turbopack from
 *   statically resolving them at bundle time.
 *
 * Cross-platform:
 *   Linux/macOS venv: backend/venv/bin/python
 *   Windows venv:     backend/venv/Scripts/python.exe
 */

/**
 * Returns the absolute path to the project backend directory.
 * Computed lazily — do not call at module scope.
 */
export function getBackendDir(): string {
  // Build the path using runtime values only — prevents Turbopack static analysis.
  const sep = require('path').sep as string
  const parts: string[] = [process.cwd(), 'backend']
  return parts.join(sep)
}

/**
 * Returns the absolute path to the venv Python executable, cross-platform.
 * Call this inside a request handler ONLY — never at the top level of a module.
 *
 * @throws Error with setup instructions if no venv python is found
 */
export function getVenvPython(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { existsSync } = require('fs') as typeof import('fs')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { join } = require('path') as typeof import('path')

  const backendDir = getBackendDir()
  const isWindows = process.platform === 'win32'

  // Paths are built entirely from runtime values so Turbopack cannot
  // statically resolve them to actual filesystem entries during the build.
  const venvDirs = ['venv', '.venv']
  const candidates: string[] = isWindows
    ? venvDirs.map((v) => join(backendDir, v, 'Scripts', 'python.exe'))
    : venvDirs.flatMap((v) => [
        join(backendDir, v, 'bin', 'python'),
        join(backendDir, v, 'bin', 'python3'),
      ])

  const found = candidates.find(existsSync)

  if (!found) {
    throw new Error(
      `[python-resolver] No venv Python interpreter found.\n` +
        `Searched:\n${candidates.map((c) => `  ${c}`).join('\n')}\n\n` +
        `Fix: cd backend && python3 -m venv venv && pip install -r requirements.txt\n` +
        `     (Windows: py -m venv venv && pip install -r requirements.txt)`,
    )
  }

  return found
}

/**
 * Convenience re-export: absolute path to the backend directory.
 * BACKEND_DIR is computed at module load — safe because it uses only
 * process.cwd() string concatenation, no filesystem access or symlinks.
 */
export const BACKEND_DIR: string = (() => getBackendDir())()
