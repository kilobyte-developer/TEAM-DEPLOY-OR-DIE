/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Prevent Next.js output tracing from following backend/venv symlinks.
  // The venv is only needed at runtime (local dev / Render), never during Vercel's build step.
  // On Vercel, backend/venv is gitignored so it never exists and the build passes cleanly.
  outputFileTracingExcludes: {
    '*': [
      './backend/venv/**',
      './backend/.venv/**',
    ],
  },
}

export default nextConfig
