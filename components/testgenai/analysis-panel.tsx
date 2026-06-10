"use client"

import { Boxes, FunctionSquare, Layers3, Link2 } from "lucide-react"
import { BrutalButton, Panel } from "@/components/page-primitives"
import { StateBlock } from "@/components/testgenai/state-block"
import { useTestGenAI } from "@/components/testgenai-provider"

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

export function AnalysisPanel() {
  const { state, analyzeWorkspace } = useTestGenAI()
  const analysis = state.analysis

  if (state.uploadedFiles.length === 0) {
    return (
      <Panel label="analysis.panel" meta="WAITING">
        <StateBlock
          title="No source code uploaded."
          message="Upload source code before triggering AST analysis and dependency detection."
        />
      </Panel>
    )
  }

  if (analysis.status === "loading") {
    return (
      <Panel label="analysis.panel" meta="ANALYZING">
        <StateBlock
          title="Analyzing Code..."
          message="Detecting functions, parameters, return types, dependencies, and classes from the uploaded files."
          tone="loading"
        />
      </Panel>
    )
  }

  if (analysis.status === "error") {
    return (
      <Panel label="analysis.panel" meta="ERROR">
        <StateBlock
          title="Analysis failed."
          message={analysis.error ?? "The analysis request could not be completed."}
          tone="error"
        />
      </Panel>
    )
  }

  if (!analysis.data) {
    return (
      <Panel label="analysis.panel" meta="READY">
        <StateBlock
          title="No analysis results yet."
          message="Run analysis to populate functions, classes, and dependencies from the current workspace."
        />
        <div className="border-t border-border p-4">
          <BrutalButton variant="accent" onClick={() => void analyzeWorkspace()}>
            Analyze Code
          </BrutalButton>
        </div>
      </Panel>
    )
  }

  return (
    <Panel label="analysis.panel" meta={`${analysis.data.repository} | ${formatGeneratedAt(analysis.data.generatedAt)}`}>
      <div className="grid grid-cols-1 gap-0 border-b border-border md:grid-cols-3">
        <div className="border-b border-border px-4 py-4 md:border-b-0 md:border-r">
          <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Functions Detected</span>
          <div className="mt-3 flex items-center gap-2">
            <FunctionSquare size={16} strokeWidth={1.5} className="text-[#ea580c]" />
            <span className="text-2xl font-mono font-bold text-foreground">{analysis.data.functions.length}</span>
          </div>
        </div>
        <div className="border-b border-border px-4 py-4 md:border-b-0 md:border-r">
          <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Classes</span>
          <div className="mt-3 flex items-center gap-2">
            <Boxes size={16} strokeWidth={1.5} className="text-[#ea580c]" />
            <span className="text-2xl font-mono font-bold text-foreground">{analysis.data.classes.length}</span>
          </div>
        </div>
        <div className="px-4 py-4">
          <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Dependencies</span>
          <div className="mt-3 flex items-center gap-2">
            <Link2 size={16} strokeWidth={1.5} className="text-[#ea580c]" />
            <span className="text-2xl font-mono font-bold text-foreground">{analysis.data.dependencies.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.5fr_1fr]">
        <div className="border-b border-border lg:border-b-0 lg:border-r">
          <div className="border-b border-border px-4 py-3">
            <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Functions and Parameters</span>
          </div>
          <div className="flex flex-col">
            {analysis.data.functions.map((item) => (
              <div key={item.id} className="border-b border-border px-4 py-4 last:border-none">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-foreground">{item.name}</span>
                  <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{item.fileName}</span>
                  {item.className ? (
                    <span className="border border-foreground/20 px-2 py-0.5 text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                      {item.className}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{item.description}</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Parameters</span>
                    <div className="mt-2 flex flex-col gap-1">
                      {item.parameters.map((parameter) => (
                        <span key={parameter.name} className="text-[11px] font-mono text-foreground">
                          {parameter.name}: <span className="text-muted-foreground">{parameter.type}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Return Type</span>
                    <div className="mt-2 text-[11px] font-mono text-foreground">{item.returnType}</div>
                  </div>
                  <div>
                    <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Dependencies</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.dependencies.map((dependency) => (
                        <span
                          key={dependency}
                          className="border border-foreground/20 px-2 py-1 text-[9px] tracking-[0.15em] uppercase text-muted-foreground"
                        >
                          {dependency}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="border-b border-border px-4 py-3">
            <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Classes and Dependencies</span>
          </div>
          <div className="flex flex-col">
            {analysis.data.classes.map((item) => (
              <div key={item.id} className="border-b border-border px-4 py-4 last:border-none">
                <div className="flex items-center gap-2">
                  <Layers3 size={14} strokeWidth={1.5} className="text-[#ea580c]" />
                  <span className="text-xs font-mono font-bold text-foreground">{item.name}</span>
                </div>
                <span className="mt-2 block text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{item.fileName}</span>
                <div className="mt-3">
                  <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Methods</span>
                  <div className="mt-2 flex flex-col gap-1">
                    {item.methods.map((method) => (
                      <span key={method} className="text-[11px] font-mono text-foreground">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Dependencies</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.dependencies.map((dependency) => (
                      <span
                        key={dependency}
                        className="border border-foreground/20 px-2 py-1 text-[9px] tracking-[0.15em] uppercase text-muted-foreground"
                      >
                        {dependency}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t border-border px-4 py-4">
              <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Imports</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {analysis.data.imports.length > 0 ? (
                  analysis.data.imports.map((item) => (
                    <span
                      key={item}
                      className="border border-foreground/20 px-2 py-1 text-[9px] tracking-[0.15em] uppercase text-muted-foreground"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-muted-foreground">No imports detected.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}
