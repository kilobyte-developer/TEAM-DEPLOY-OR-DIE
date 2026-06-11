# TESTGENAI Code Snippet Reference

## Project Overview

TESTGENAI is a hackathon-ready test generation platform that accepts Python source code or user stories, analyzes intent, generates human-readable and executable test cases, runs pytest, calculates coverage, and produces exportable reports. Its core implementation combines deterministic AST analysis with semantic heuristics so judges can see how the system moves from source understanding to real validation instead of only producing static text.

# Feature 1: AST Analysis

Purpose:
TESTGENAI parses uploaded Python files with Python's AST module to discover functions, classes, parameters, return types, docstrings, and dependencies. This structured representation becomes the foundation for analysis panels, test generation, coverage summaries, and reports.

Primary File: `backend/mvp_engine.py`

Main Function/Class: `analyze_python_source`

What It Does: Converts Python source code into normalized metadata for functions, classes, and imports.

Key Code Snippet:

```python
def analyze_python_source(source_code: str, file_name: str, repository: str = "local-workspace") -> dict[str, Any]:
    tree = ast.parse(source_code)
    imports = normalize_imports(tree)
    functions: list[dict[str, Any]] = []
    classes: list[dict[str, Any]] = []

    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            functions.append(
                {
                    "id": f"fn-{len(functions) + 1}",
                    "name": node.name,
                    "fileName": file_name,
                    "parameters": [
                        {"name": arg.arg, "type": annotation_to_string(arg.annotation)}
                        for arg in node.args.args
                    ],
                    "returnType": annotation_to_string(node.returns),
                    "dependencies": imports,
                    "description": doc_summary(node, f"Function {node.name} extracted from uploaded source."),
                }
            )
```

Why This Snippet Matters:
This is where unstructured uploaded code becomes a machine-readable model. Every later feature depends on this extracted metadata.

---

# Feature 2: Intent-Based Test Generation

Purpose:
Instead of trusting implementation behavior blindly, the engine reads function names such as `is_even` or `is_odd` as a statement of intent. It then creates semantic expectations that represent what the function should do.

Primary File: `backend/mvp_engine.py`

Main Function/Class: `infer_even_odd_intent_cases`

What It Does: Infers test cases from function naming intent and representative numeric inputs.

Key Code Snippet:

```python
def infer_even_odd_intent_cases(node: ast.FunctionDef, function: dict[str, Any]) -> dict[str, Any] | None:
    words = split_identifier(function["name"])
    is_even_intent = "even" in words
    is_odd_intent = "odd" in words

    if not is_even_intent and not is_odd_intent:
        return None

    parameters = function["parameters"]
    parameter_name = first_business_parameter(parameters)
    details = modulo_return_details(node)
    issues: list[dict[str, str]] = []

    true_value = 2 if is_even_intent else 3
    false_value = 3 if is_even_intent else 2
    negative_value = -2 if is_even_intent else -3
    subject = "even" if is_even_intent else "odd"
    opposite = "odd" if is_even_intent else "even"
    true_expected = append_issue_to_expected(f"True because {true_value} is {subject}.", issues)
```

Why This Snippet Matters:
The code shows the project's semantic approach: expected behavior comes from user-visible intent, not only from the current implementation.

---

# Feature 3: Logic Issue Detection

Purpose:
The engine inspects implementation patterns to detect when source logic contradicts inferred intent. For example, a function named `is_even` that checks for odd remainders is reported as suspicious.

Primary File: `backend/mvp_engine.py`

Main Function/Class: `infer_even_odd_intent_cases`

What It Does: Flags contradictions between function names and modulo-based boolean logic.

Key Code Snippet:

```python
if details and details["divisor"] == 2:
    matches_intent = implementation_matches_even_intent(details) if is_even_intent else implementation_matches_odd_intent(details)
    if not matches_intent:
        expected_kind = "even" if is_even_intent else "odd"
        actual_kind = "odd" if is_even_intent else "even"
        issues.append(
            semantic_issue(
                f"Function name suggests checking {expected_kind} numbers but implementation appears to return True for {actual_kind} numbers."
            )
        )
```

Why This Snippet Matters:
This is the core logic-defect signal. It gives judges a concrete example of TESTGENAI finding bugs from semantic mismatch rather than shallow syntax checks.

---

# Feature 4: Human Readable Test Generation

Purpose:
TESTGENAI builds semantic test suites with unit, negative, edge, and boundary cases. These are shown to users as readable QA scenarios before executable pytest files are run.

Primary File: `backend/mvp_engine.py`

Main Function/Class: `build_semantic_test_suites`

What It Does: Converts each discovered function into a structured semantic test suite.

Key Code Snippet:

```python
cases = (
    infer_even_odd_intent_cases(node, function)
    or infer_discount_intent_cases(node, function)
    or infer_modulo_boolean_cases(node, function)
    or build_generic_semantic_cases(node, function)
)
suite_index = len(suites) + 1
suites.append(
    {
        "id": f"semantic-{suite_index}",
        "functionName": function["name"],
        "fileName": file_path.name,
        **({"className": class_name} if class_name else {}),
        "potentialLogicIssues": cases.get("potentialLogicIssues", []),
        "unitTests": [
            {**item, "id": f"TC-{suite_index}-UNIT-{index + 1:03d}"}
            for index, item in enumerate(cases["unitTests"])
        ],
    }
)
```

Why This Snippet Matters:
It shows how specialized semantic inference and generic fallback cases are unified into one judge-friendly test format.

---

# Feature 5: Executable Pytest Generation

Purpose:
The platform does not stop at suggested test descriptions. It writes executable pytest files and a manifest so the generated tests can be run against the uploaded source code.

Primary File: `backend/mvp_engine.py`

Main Function/Class: `generate_tests_for_file`

What It Does: Generates unit, edge, and combined pytest artifacts for one uploaded source file.

Key Code Snippet:

```python
def generate_tests_for_file(file_path: Path, generated_dir: Path) -> dict[str, Any]:
    source_code = file_path.read_text(encoding="utf-8")
    analysis = analyze_python_source(source_code, file_path.name)
    semantic_suites = build_semantic_test_suites(source_code, file_path)
    unit_code, unit_count = build_unit_tests(source_code, file_path, semantic_suites)
    edge_code, edge_count = build_edge_tests(source_code, file_path)

    generated_dir.mkdir(parents=True, exist_ok=True)

    unit_file_path = generated_dir / f"test_{file_path.stem}_unit.py"
    edge_file_path = generated_dir / f"test_{file_path.stem}_edge.py"
    combined_file_path = generated_dir / "test_generated.py"

    unit_file_path.write_text(unit_code, encoding="utf-8")
    edge_file_path.write_text(edge_code, encoding="utf-8")
    combined_file_path.write_text(f"{unit_code}\n\n{edge_code}", encoding="utf-8")
```

Why This Snippet Matters:
This is the handoff from semantic reasoning to real artifacts. It proves the generated output is executable and not just documentation.

---

# Feature 6: Semantic Validation

Purpose:
Semantic validation turns human-readable expectations into concrete assertions. When a semantic case has parseable inputs and expected behavior, the system generates pytest assertions that can fail on faulty code.

Primary File: `backend/mvp_engine.py`

Main Function/Class: `build_semantic_assertion_tests`

What It Does: Converts semantic cases into executable assertion test functions.

Key Code Snippet:

```python
for item in semantic_cases:
    values = parse_semantic_input(item.get("input", ""))
    assertion = semantic_assertion_kind(item.get("expected", ""))
    if values is None or assertion is None:
        continue

    call_arguments = render_call_arguments(function["parameters"], values)
    if call_arguments == "" and function["parameters"]:
        continue

    expected_text = item.get("expected", "").split("Potential Logic Issue:")[0].strip()
    input_text = item.get("input", "")
    kind, expected_value = assertion

    lines.append(f"def {test_name}():")
    lines.append("    module = load_module()")
    lines.append(f'    actual = getattr(module, "{function_name}")({call_arguments})')
    lines.append(f"    input_under_test = {input_text!r}")
    lines.append(f"    expected_description = {expected_text!r}")
```

Why This Snippet Matters:
It bridges readable test design and executable validation. This is how semantic expectations become pytest code.

---

# Feature 7: Real Pytest Execution

Purpose:
Generated tests are executed through a real pytest subprocess, and the result is parsed into pass/fail metrics. This gives the UI and report a real validation outcome.

Primary File: `app/api/run-tests/route.ts`

Main Function/Class: `POST`

What It Does: Runs generated pytest files and stores structured execution results.

Key Code Snippet:

```typescript
const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf-8')) as Manifest
const started = performance.now()
const result = spawnSync(
  PYTHON_CMD,
  ['-m', 'pytest', manifest.unitTestFilePath, manifest.edgeTestFilePath, '-v', '--tb=short'],
  {
    cwd: BACKEND_DIR,
    encoding: 'utf-8',
    timeout: 60000,
  },
)
const duration = (performance.now() - started) / 1000

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim()
const collected = parseSummaryCount(/collected\s+(\d+)\s+items/, output)
const passed = parseSummaryCount(/(\d+)\s+passed/, output)
const failed = parseSummaryCount(/(\d+)\s+failed/, output)
const total = collected || passed + failed
```

Why This Snippet Matters:
This confirms the system performs actual test execution, not simulated scoring. The parsed metrics drive the execution dashboard and report.

---

# Feature 8: Coverage Analysis

Purpose:
The FastAPI backend runs pytest with coverage enabled, reads the generated JSON report, and summarizes coverage by source file and function. This gives users an implementation-quality signal beyond pass/fail counts.

Primary File: `backend/main.py`

Main Function/Class: `get_coverage`

What It Does: Runs pytest-cov against generated tests and returns coverage metrics.

Key Code Snippet:

```python
command = [
    "pytest",
    str(unit_test_path),
    str(edge_test_path),
    f"--cov={module_name}",
    f"--cov-report=json:{str(COVERAGE_JSON_PATH)}",
    "--cov-report=term-missing",
    "-q",
]

subprocess.run(
    command,
    capture_output=True,
    text=True,
    timeout=60,
    cwd=str(BASE_DIR),
    check=False,
)

coverage_payload = json.loads(COVERAGE_JSON_PATH.read_text(encoding="utf-8"))
_, source_entry = resolve_source_coverage_entry(coverage_payload, source_file_path)
```

Why This Snippet Matters:
Coverage is calculated from the same generated tests users execute. That makes the report traceable from generated test cases to measured code coverage.

---

# Feature 9: User Story AI Generation

Purpose:
TESTGENAI can also generate tests from user stories. It tries configured LLM providers first, then falls back to a deterministic local generator so the demo remains reliable without API keys.

Primary File: `app/api/generate-userstory-tests/route.ts`

Main Function/Class: `generateWithProviders`

What It Does: Chooses OpenAI or Gemini by priority, then falls back to local user-story parsing.

Key Code Snippet:

```typescript
async function generateWithProviders(story: string) {
  const priority = (process.env.LLM_PROVIDER_PRIORITY || 'openai').toLowerCase()
  const providers = priority === 'gemini'
    ? [generateWithGemini, generateWithOpenAI]
    : [generateWithOpenAI, generateWithGemini]

  for (const provider of providers) {
    try {
      return await provider(story)
    } catch {
      continue
    }
  }

  return localGenerateUserStoryTests(story)
}
```

Why This Snippet Matters:
It shows the product is resilient during demos. AI generation is supported, but local fallback keeps test generation available even when external providers fail.

---

# Feature 10: HTML Report Generation

Purpose:
TESTGENAI creates standalone HTML reports containing source analysis, semantic test cases, generated pytest artifacts, execution results, coverage, and logs. These reports are suitable for hackathon submission and later PDF export.

Primary File: `lib/report/html-report.ts`

Main Function/Class: `sourceReport`

What It Does: Composes the source-code workflow state into a complete downloadable report.

Key Code Snippet:

```typescript
return reportShell({
  title: "TESTGENAI Source Code Report",
  subtitle: `${fileName} / ${analysis?.repository ?? "local-workspace"}`,
  generatedAt,
  body: `
    ${section("Executive Summary", `
      <div class="metrics">
        ${metric("Functions", analysis?.functions.length ?? 0)}
        ${metric("Classes", analysis?.classes.length ?? 0)}
        ${metric("Semantic Suites", tests?.semanticSuites.length ?? 0)}
        ${metric("Generated Pytests", generatedCount)}
      </div>
    `)}
    ${section("Source Analysis", analysisSummary(analysis))}
    ${section("Semantic Test Cases", semanticSuites(tests, analysis))}
    ${section("Generated Pytest Artifacts", generatedArtifacts(tests))}
    ${section("Execution Summary", executionSummary(execution))}
    ${section("Coverage Summary", coverageSummary(coverage))}
    ${section("Execution Logs", executionLogs(execution))}
  `,
})
```

Why This Snippet Matters:
The report pulls together every major workflow result. It is the final artifact judges can inspect without opening the application.

---

# Repository Structure

```text
backend/      Python AST analysis, semantic generation, pytest artifact creation, FastAPI coverage endpoints.
app/          Next.js pages and API routes for upload, analysis, generation, execution, results, and user stories.
components/   React UI components for workflow state, upload, test display, execution, coverage, and reports.
lib/          Shared TypeScript types, service wrappers, mock data, utilities, and HTML report generation.
tests/        Local sample files and validation inputs used during development and testing.
```

# Key Innovation

TESTGENAI's strongest innovation is the connection between intent-based testing, logic issue detection, and executable semantic validation. A function named `is_even` expresses a clear business intent: even numbers should return `True`, odd numbers should return `False`, and `0` should be handled correctly. The engine compares that intent with the implementation pattern, detects contradictions such as `n % 2 == 1`, records a potential logic issue, then converts the semantic expectation into pytest assertions. This turns natural code meaning into failing executable tests, giving users both an explanation of the defect and proof through real test execution.
