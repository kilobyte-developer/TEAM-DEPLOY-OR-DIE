import type {
  AnalysisFunction,
  CoverageReport,
  ExecutionResult,
  GeneratedTests,
  SemanticFunctionTestSuite,
  TestGenAIState,
  UploadedSourceFile,
  UserStoryTestCase,
  UserStoryTestSuite,
} from "@/lib/testgenai-types"

type ReportContext = {
  state: TestGenAIState
  selectedFile: UploadedSourceFile | null
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatTimestamp(value?: string) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return new Date().toLocaleString()
  return date.toLocaleString()
}

function reportFileName() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, "0")
  return `testgenai-report-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.html`
}

function providerLabel(provider?: { provider: string; model?: string }) {
  if (!provider) return "Local"
  const name = provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1)
  return provider.model ? `${name} / ${provider.model}` : name
}

function arrayValue(items: string[] | undefined) {
  if (!items || items.length === 0) return "None"
  return items.join(", ")
}

function metric(label: string, value: string | number) {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`
}

function section(title: string, body: string) {
  return `<section class="panel"><div class="panel-header"><span>${escapeHtml(title)}</span></div><div class="panel-body">${body}</div></section>`
}

function caseList(cases: UserStoryTestCase[]) {
  if (cases.length === 0) return `<p class="muted">No cases generated.</p>`

  return cases
    .map(
      (item) => `
        <article class="case">
          <div class="case-title">
            <span class="tag">${escapeHtml(item.id)}</span>
            <span class="tag accent">${escapeHtml(item.priority)}</span>
            <strong>${escapeHtml(item.scenario)}</strong>
          </div>
          <div class="two-col">
            <div>
              <h4>Steps</h4>
              <ol>${item.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
            </div>
            <div>
              <h4>Expected Result</h4>
              <p>${escapeHtml(item.expectedResult)}</p>
            </div>
          </div>
        </article>
      `,
    )
    .join("")
}

function semanticCases(title: string, cases: SemanticFunctionTestSuite[keyof Pick<SemanticFunctionTestSuite, "unitTests" | "negativeTests" | "edgeCases" | "boundaryCases">]) {
  if (!cases || cases.length === 0) return ""

  return `
    <div class="semantic-group">
      <h4>${escapeHtml(title)}</h4>
      ${cases
        .map(
          (item) => `
            <div class="semantic-case">
              <div class="case-title">
                <span class="tag">${escapeHtml(item.id)}</span>
                <strong>${escapeHtml(item.title)}</strong>
              </div>
              <div class="two-col compact">
                <div><h4>Input</h4><pre>${escapeHtml(item.input)}</pre></div>
                <div><h4>Expected</h4><pre>${escapeHtml(item.expected)}</pre></div>
              </div>
            </div>
          `,
        )
        .join("")}
    </div>
  `
}

function functionSignature(item: AnalysisFunction) {
  const params = item.parameters.map((parameter) => parameter.name).join(", ")
  const owner = item.className ? `${item.className}.` : ""
  return `${owner}${item.name}(${params})`
}

function sourceHumanReadableTests(tests?: GeneratedTests | null, functions: AnalysisFunction[] = []) {
  const suites = tests?.semanticSuites ?? []
  if (suites.length === 0) return `<p class="muted">No human-readable test cases are available.</p>`

  return suites
    .map((suite) => {
      const fn = functions.find((item) => item.name === suite.functionName && item.className === suite.className)
      const signature = fn ? functionSignature(fn) : suite.className ? `${suite.className}.${suite.functionName}` : suite.functionName
      const issues = suite.potentialLogicIssues?.length
        ? `<div class="issue"><h4>Potential Logic Issues</h4>${suite.potentialLogicIssues
            .map((issue) => `<p>${escapeHtml(issue.message)} <strong>Confidence: ${escapeHtml(issue.confidence)}</strong></p>`)
            .join("")}</div>`
        : ""

      return `
        <article class="function-block">
          <div class="function-heading">
            <span>Function</span>
            <strong>${escapeHtml(signature)}</strong>
          </div>
          ${issues}
          ${semanticCases("Unit Tests", suite.unitTests)}
          ${semanticCases("Negative Tests", suite.negativeTests)}
          ${semanticCases("Edge Cases", suite.edgeCases)}
          ${semanticCases("Boundary Cases", suite.boundaryCases)}
        </article>
      `
    })
    .join("")
}

function generatedArtifacts(tests?: GeneratedTests | null) {
  if (!tests) return `<p class="muted">No generated pytest artifacts are available.</p>`

  const artifacts = [...tests.unitTests, ...tests.edgeCaseTests]
  return artifacts
    .map(
      (artifact) => `
        <details class="artifact" open>
          <summary>${escapeHtml(artifact.fileName)} / ${escapeHtml(artifact.testCount)} cases</summary>
          <pre><code>${escapeHtml(artifact.code)}</code></pre>
        </details>
      `,
    )
    .join("")
}

function executionSummary(execution?: ExecutionResult | null) {
  if (!execution) {
    return `<div class="metrics">${metric("Status", "Not run")}${metric("Passed", 0)}${metric("Failed", 0)}${metric("Pass Rate", "0%")}${metric("Execution Time", "0.00s")}</div>`
  }

  return `
    <div class="metrics">
      ${metric("Status", execution.status)}
      ${metric("Passed", execution.passedTests)}
      ${metric("Failed", execution.failedTests)}
      ${metric("Pass Rate", `${execution.passRate.toFixed(1)}%`)}
      ${metric("Execution Time", execution.executionTime)}
    </div>
  `
}

function coverageSummary(coverage?: CoverageReport | null) {
  if (!coverage) {
    return `<div class="metrics">${metric("Coverage", "Not calculated")}${metric("Functions Covered", 0)}${metric("Missing Coverage", 0)}</div><p class="muted">Coverage has not been refreshed for this report.</p>`
  }

  return `
    <div class="metrics">
      ${metric("Coverage", `${coverage.coveragePercent}%`)}
      ${metric("Functions Covered", coverage.functionsCovered)}
      ${metric("Missing Coverage", coverage.functionsMissingCoverage.length)}
      ${metric("Edge Cases Covered", coverage.edgeCasesCovered)}
    </div>
    <p>${escapeHtml(coverage.summary)}</p>
    <div class="chips">
      ${coverage.functionsMissingCoverage.length ? coverage.functionsMissingCoverage.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("") : `<span class="tag">No missing functions reported</span>`}
    </div>
  `
}

function executionLogs(execution?: ExecutionResult | null) {
  const logs = execution?.logs ?? []
  if (logs.length === 0) return `<p class="muted">No execution logs are available.</p>`

  return `
    <div class="logs">
      ${logs.map((log) => `<div><span>${escapeHtml(log.timestamp)}</span><strong class="${escapeHtml(log.level)}">${escapeHtml(log.message)}</strong></div>`).join("")}
    </div>
  `
}

function extractAcceptanceCriteria(story: string) {
  const criteriaSection = story.split(/acceptance\s+criteria\s*:/i)[1] ?? ""
  if (!criteriaSection.trim()) return []

  return criteriaSection
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s*/, "").replace(/^\d+[.)]\s*/, "").trim())
    .filter(Boolean)
}

function businessRules(criteria: string[]) {
  return criteria.map((criterion) => {
    const cleaned = criterion.replace(/\.$/, "")
    const numbers = Array.from(cleaned.matchAll(/₹?\s*\d[\d,]*(?:\.\d+)?%?/g)).map((match) => match[0].replace(/\s+/g, ""))
    if (numbers.length === 0) return cleaned
    return `${cleaned} (${numbers.join(", ")})`
  })
}

function baseHtml(title: string, generatedAt: string, body: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --background: #eee9df;
      --foreground: #0a0a0a;
      --muted: #6b6b6b;
      --border: #bfbdb5;
      --accent: #ea580c;
      --panel: #eee9df;
      --code: #0a0a0a;
      --code-text: #eee9df;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--background);
      color: var(--foreground);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      background-image: radial-gradient(circle, #c4c2b8 1px, transparent 1px);
      background-size: 24px 24px;
    }
    main { max-width: 1180px; margin: 0 auto; padding: 32px 20px 48px; }
    header { border-bottom: 1px solid rgba(10, 10, 10, 0.2); padding-bottom: 24px; margin-bottom: 24px; }
    .eyebrow, .panel-header span, h4, .metric span, .function-heading span {
      color: var(--muted);
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .eyebrow { color: var(--accent); }
    h1 { margin: 8px 0; font-size: 44px; line-height: 1; letter-spacing: 0; text-transform: uppercase; }
    h2 { margin: 0; font-size: 18px; text-transform: uppercase; }
    p, li { font-size: 12px; line-height: 1.7; }
    .subtitle { color: var(--muted); text-transform: uppercase; letter-spacing: 0.12em; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid var(--border); border-bottom: 0; border-right: 0; margin-bottom: 18px; }
    .metric { min-height: 92px; padding: 16px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); background: var(--panel); }
    .metric strong { display: block; margin-top: 12px; font-size: 22px; overflow-wrap: anywhere; }
    .panel { border: 1px solid rgba(10, 10, 10, 0.2); background: var(--panel); margin: 18px 0; }
    .panel-header { display: flex; justify-content: space-between; border-bottom: 2px solid var(--foreground); padding: 10px 16px; }
    .panel-body { padding: 16px; }
    .case, .function-block, .semantic-case, .artifact { border: 1px solid var(--border); margin: 12px 0; background: rgba(255, 255, 255, 0.14); }
    .case, .semantic-case { padding: 14px; }
    .case-title { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .tag { display: inline-flex; border: 1px solid rgba(10, 10, 10, 0.2); padding: 5px 8px; color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; }
    .tag.accent { color: var(--accent); }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .compact { gap: 12px; }
    .function-heading { border-bottom: 1px solid var(--border); padding: 14px; display: grid; gap: 8px; }
    .function-heading strong { font-size: 16px; }
    .semantic-group { padding: 0 14px 14px; }
    .issue { margin: 14px; padding: 12px; border: 1px solid var(--accent); }
    pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 1.6; }
    .artifact summary { cursor: pointer; padding: 14px; border-bottom: 1px solid var(--border); font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; }
    .artifact pre, .logs { background: var(--code); color: var(--code-text); padding: 16px; max-height: 520px; overflow: auto; }
    .logs { display: grid; gap: 6px; }
    .logs div { display: grid; grid-template-columns: 84px 1fr; gap: 10px; font-size: 12px; }
    .logs span { color: rgba(238, 233, 223, 0.45); }
    .pass { color: #4ade80; }
    .fail { color: #f87171; }
    .warn { color: #fbbf24; }
    .info { color: rgba(238, 233, 223, 0.75); }
    .muted { color: var(--muted); }
    footer { margin-top: 28px; border-top: 2px solid var(--foreground); padding-top: 18px; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; }
    @media (max-width: 820px) {
      h1 { font-size: 32px; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .two-col { grid-template-columns: 1fr; }
    }
    @media print {
      body { background-image: none; }
      main { max-width: none; padding: 18px; }
      .artifact pre, .logs { max-height: none; overflow: visible; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="eyebrow">// TESTGENAI</div>
      <h1>${escapeHtml(title)}</h1>
      <p class="subtitle">Generated ${escapeHtml(formatTimestamp(generatedAt))}</p>
    </header>
    ${body}
    <footer>
      Generated by TestGenAI<br />
      Capgemini AgentifAI Buildathon 2026<br />
      Team Deploy or Die
    </footer>
  </main>
</body>
</html>`
}

function sourceReport({ state, selectedFile }: ReportContext) {
  const analysis = state.analysis.data
  const tests = state.generatedTests.data
  const execution = state.execution.data
  const coverage = state.coverage.data
  const file = selectedFile ?? state.uploadedFiles[0] ?? null
  const generatedAt = coverage?.generatedAt ?? execution?.generatedAt ?? tests?.generatedAt ?? analysis?.generatedAt

  const headerMetrics = `
    <div class="grid">
      ${metric("Repository", tests?.repository ?? file?.repository ?? "local-workspace")}
      ${metric("File Name", file?.name ?? analysis?.functions[0]?.fileName ?? "Not available")}
      ${metric("Language", file?.language ?? "Python")}
      ${metric("Provider Used", "Local")}
    </div>
  `

  const analysisSummary = `
    <div class="metrics grid">
      ${metric("Functions Detected", analysis?.functions.length ?? 0)}
      ${metric("Classes Detected", analysis?.classes.length ?? 0)}
      ${metric("Imports Detected", analysis?.imports.length ?? 0)}
      ${metric("Dependencies Detected", analysis?.dependencies.length ?? 0)}
    </div>
    <p><strong>Imports:</strong> ${escapeHtml(arrayValue(analysis?.imports))}</p>
    <p><strong>Dependencies:</strong> ${escapeHtml(arrayValue(analysis?.dependencies))}</p>
  `

  return baseHtml(
    "Automated Test Report",
    generatedAt ?? new Date().toISOString(),
    `
      ${headerMetrics}
      ${section("Analysis Summary", analysisSummary)}
      ${section("Human Readable Test Cases", sourceHumanReadableTests(tests, analysis?.functions ?? []))}
      ${section("Generated Technical Test Artifact", generatedArtifacts(tests))}
      ${section("Execution Summary", executionSummary(execution))}
      ${section("Coverage Summary", coverageSummary(coverage))}
      ${section("Execution Logs", executionLogs(execution))}
    `,
  )
}

function userStoryReport({ state }: ReportContext) {
  const suite = state.userStoryTests.data as UserStoryTestSuite | null
  const story = suite?.story ?? state.userStoryInput
  const criteria = extractAcceptanceCriteria(story)
  const rules = businessRules(criteria)

  const metadata = `
    <div class="grid">
      ${metric("Provider", providerLabel(suite?.provider))}
      ${metric("Model", suite?.provider?.model ?? "Not applicable")}
      ${metric("Generation Time", formatTimestamp(suite?.generatedAt))}
      ${metric("Total Cases", (suite?.positiveCases.length ?? 0) + (suite?.negativeCases.length ?? 0) + (suite?.edgeCases.length ?? 0))}
    </div>
  `

  return baseHtml(
    "User Story Test Report",
    suite?.generatedAt ?? new Date().toISOString(),
    `
      ${section("User Story", `<p style="white-space: pre-line">${escapeHtml(story || "No user story supplied.")}</p>`)}
      ${section("Acceptance Criteria", criteria.length ? `<ol>${criteria.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>` : `<p class="muted">No explicit acceptance criteria were found.</p>`)}
      ${section("Positive Test Cases", caseList(suite?.positiveCases ?? []))}
      ${section("Negative Test Cases", caseList(suite?.negativeCases ?? []))}
      ${section("Edge Cases", caseList(suite?.edgeCases ?? []))}
      ${section("Business Rules Extracted", rules.length ? `<div class="chips">${rules.map((rule) => `<span class="tag">${escapeHtml(rule)}</span>`).join("")}</div>` : `<p class="muted">No explicit business rules were extracted.</p>`)}
      ${section("Generation Metadata", metadata)}
    `,
  )
}

export function canDownloadReport(state: TestGenAIState) {
  if (state.inputMode === "user-story") {
    return Boolean(state.userStoryTests.data)
  }
  return Boolean(state.analysis.data || state.generatedTests.data || state.execution.data || state.coverage.data)
}

export function downloadTestGenAIReport(context: ReportContext) {
  const html = context.state.inputMode === "user-story" ? userStoryReport(context) : sourceReport(context)
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = reportFileName()
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
