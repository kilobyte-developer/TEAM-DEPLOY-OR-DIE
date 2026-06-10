# HTML Report Feature Report

## Files Modified

- `lib/report/html-report.ts`
- `components/testgenai/download-report-button.tsx`
- `components/views/results-view.tsx`
- `components/views/execution-view.tsx`
- `components/views/generate-view.tsx`

## Architecture

The report feature is fully client-side and additive.

No database, PDF engine, backend route, or external dependency was introduced. The report generator reads the existing `TestGenAIProvider` state and builds a standalone HTML document with inline CSS.

Supported report modes:

- Source code automated test report
- User story test report

The HTML styling mirrors the current TestGenAI UI:

- Warm background
- Dot-grid page texture
- Black foreground panels
- Orange accent
- Mono typography
- Bordered card/panel structure
- Scrollable execution log and code sections

## Report Generation Flow

### Source Code Flow

1. User uploads source code.
2. User runs analysis.
3. User generates tests.
4. User runs execution.
5. User refreshes coverage.
6. User clicks `Download Report`.
7. Browser downloads a standalone HTML file.

The source report includes:

- Header metadata
- Repository, file name, language, provider
- Analysis summary
- Human-readable test cases by function
- Potential logic issues when present
- Generated pytest artifacts in collapsible sections
- Execution summary
- Coverage summary
- Execution logs
- Footer branding

### User Story Flow

1. User enters a user story.
2. User generates story test cases.
3. User clicks `Download Report`.
4. Browser downloads a standalone HTML file.

The user story report includes:

- Full user story
- Parsed acceptance criteria
- Positive test cases
- Negative test cases
- Edge cases
- Extracted business rules
- Provider/model metadata
- Footer branding

## Download Locations

The `Download Report` button was added to existing header action areas:

- Results page
- Execution page
- Generator page

The button is disabled until the current mode has reportable data.

## Output Path

Reports are downloaded by the browser using this naming format:

```text
testgenai-report-YYYYMMDD-HHMM.html
```

Example:

```text
testgenai-report-20260610-1815.html
```

The actual destination is the browser's configured downloads folder.

## Verification

TypeScript validation passed:

```bash
pnpm.cmd exec tsc --noEmit --incremental false
```

## Limitations

- The feature generates HTML only, not PDF.
- Source-code provider displays `Local` because the current source-code generation path is deterministic/local in the frontend state.
- The report reflects the currently loaded frontend state; it does not persist historical sessions.
- Screenshots are not embedded in the report.

## Future Improvements

- Add optional PDF export through browser print styles.
- Add downloadable report previews before saving.
- Persist report snapshots for historical comparison.
- Include charts for coverage and pass/fail trends.
- Add richer business-rule extraction metadata from the user-story generator response.
