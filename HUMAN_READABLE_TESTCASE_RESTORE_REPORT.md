# Human-Readable Testcase Restore Report

## 1. Root Cause Found

Source-code test generation was producing and returning only executable test artifacts:

- `unitTests`
- `edgeCaseTests`
- `summary`

The frontend `GeneratedTests` type had no semantic QA testcase field, and `components/testgenai/test-viewer.tsx` rendered only the selected generated code artifact through `CodeViewer`.

The semantic/human-readable cases were therefore not reaching frontend state and could not render. This was not an OpenAI or Gemini provider issue in the current code path.

The execution failure came from `lib/services/testgenai.ts` calling `http://127.0.0.1:8000/run-tests` directly from the browser. Upload, analyze, and generate use same-origin Next API routes, but execution depended on the browser reaching FastAPI directly. That can surface as `Failed to fetch`.

## 2. Files Modified

- `backend/mvp_engine.py`
- `lib/testgenai-types.ts`
- `components/testgenai/test-viewer.tsx`
- `lib/services/testgenai.ts`
- `app/api/run-tests/route.ts`
- `HUMAN_READABLE_TESTCASE_RESTORE_REPORT.md`

## 3. Data Flow Explanation

Source code mode now flows like this:

1. User uploads a Python file through `/api/upload`.
2. User analyzes it through `/api/analyze`.
3. User generates tests through `/api/generate-tests`.
4. The Next route invokes `backend/mvp_engine.py generate-tests`.
5. The engine analyzes AST data, writes executable pytest files, writes `manifest.json`, and now also builds `semanticSuites`.
6. The response keeps existing executable artifacts and adds semantic suites.
7. `TestGenAIProvider` stores the full `GeneratedTests` payload.
8. `TestViewer` renders human-readable semantic cases first.
9. The existing generated executable test code remains visible below.

Execution now flows through same-origin `/api/run-tests`, which reads the generated manifest and runs pytest from the Next route instead of requiring the browser to call FastAPI directly.

## 4. Semantic Response Sample

For:

```python
def is_even(n):
    return n % 2 == 0
```

The generator now returns:

```json
{
  "semanticSuites": [
    {
      "functionName": "is_even",
      "unitTests": [
        {
          "title": "Even Number",
          "input": "n = 2",
          "expected": "True"
        },
        {
          "title": "Odd Number",
          "input": "n = 3",
          "expected": "False"
        }
      ],
      "edgeCases": [
        {
          "title": "Zero",
          "input": "n = 0",
          "expected": "True"
        },
        {
          "title": "Negative Even Number",
          "input": "n = -2",
          "expected": "True"
        }
      ]
    }
  ],
  "unitTests": ["existing executable unit test artifact"],
  "edgeCaseTests": ["existing executable edge test artifact"]
}
```

## 5. UI Rendering Fix Summary

`components/testgenai/test-viewer.tsx` now renders:

1. Human-readable test cases
2. Function sections
3. Unit tests, negative tests, edge cases, and boundary cases
4. Generated test code below the semantic cases

The existing unit/edge generated-code tab behavior remains intact.

## 6. Verification Steps Performed

- Ran semantic generation for `backend/uploads/test2.py`.
- Confirmed response includes human-readable cases for `is_even`.
- Confirmed response still includes executable `unitTests` and `edgeCaseTests`.
- Ran TypeScript verification:

```bash
pnpm.cmd exec tsc --noEmit
```

- Ran generated pytest artifacts:

```bash
python -m pytest backend\generated_tests\test_test2_unit.py backend\generated_tests\test_test2_edge.py -v --tb=short
```

Result: `3 passed`.

- Started the Next dev server and verified the same-origin execution route used by the UI:

```bash
Invoke-RestMethod -Uri http://localhost:3000/api/run-tests -Method Post -ContentType "application/json" -Body '{"mode":"source-code"}'
```

Result: `completed`, `3 passed`, `0 failed`, `100%` pass rate.

## 7. Screenshots Or Paths

No screenshot was captured in this pass. Relevant paths:

- UI renderer: `components/testgenai/test-viewer.tsx`
- Semantic generator: `backend/mvp_engine.py`
- Execution route: `app/api/run-tests/route.ts`
- Generated manifest sample: `backend/generated_tests/manifest.json`
