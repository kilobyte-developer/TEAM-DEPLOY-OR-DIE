# AI Configuration Setup

1. Create Gemini key for source-code tests

Create a Gemini API key dedicated to generating source-code semantic suites and executable pytest artifacts.

2. Create Gemini key for AI fix suggestions

Create a separate Gemini API key dedicated to AI fix suggestion generation.

3. Add variables to `.env`

```env
GEMINI_SOURCE_CODE_TESTS_API_KEY=
GEMINI_AI_FIXATIONS_API_KEY=
```

4. Restart services

Restart the Next.js app and any backend service processes so the new environment variables are loaded.

5. Verify generation

Upload source-code examples such as `is_even`, `calculate_discount`, `can_withdraw`, and loan-rule files. Confirm source-code tests show Gemini provider output when the source-code key is configured.

6. Verify fix suggestions

Upload a file with a detectable logic issue. Confirm the UI shows `AI Fix Suggestion` directly below the potential logic issue and that historical records retain the stored suggestion.
