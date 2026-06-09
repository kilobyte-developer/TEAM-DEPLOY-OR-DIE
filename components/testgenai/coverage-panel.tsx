"use client"

import { Gauge, ShieldCheck } from "lucide-react"
import { BrutalButton, Panel } from "@/components/page-primitives"
import { StateBlock } from "@/components/testgenai/state-block"
import { useTestGenAI } from "@/components/testgenai-provider"
import { cn } from "@/lib/utils"

export function CoveragePanel() {
  const { state, refreshCoverage } = useTestGenAI()
  const coverage = state.coverage

  return (
    <Panel label="coverage.panel" meta="GET /coverage">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Coverage Summary</span>
          <span className="text-xs font-mono uppercase tracking-[0.18em] text-foreground">
            {coverage.data ? `${coverage.data.coveragePercent}% total coverage` : "READY"}
          </span>
        </div>
        <BrutalButton
          variant="accent"
          icon={<Gauge size={14} strokeWidth={1.5} />}
          onClick={() => void refreshCoverage()}
          disabled={coverage.status === "loading"}
        >
          {coverage.status === "loading" ? "Calculating Coverage..." : "Refresh Coverage"}
        </BrutalButton>
      </div>

      {coverage.status === "loading" ? (
        <StateBlock
          title="Calculating Coverage..."
          message="Collecting file-level coverage, uncovered functions, and edge-case completeness."
          tone="loading"
        />
      ) : coverage.status === "error" ? (
        <StateBlock
          title="Coverage failed."
          message={coverage.error ?? "Coverage reporting could not be completed."}
          tone="error"
        />
      ) : coverage.data ? (
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-border lg:border-b-0 lg:border-r">
            <div className="grid grid-cols-2 gap-0 border-b border-border">
              {[
                { label: "Coverage %", value: `${coverage.data.coveragePercent}%` },
                { label: "Functions Covered", value: String(coverage.data.functionsCovered) },
                { label: "Missing Coverage", value: String(coverage.data.functionsMissingCoverage.length) },
                { label: "Edge Cases Covered", value: String(coverage.data.edgeCasesCovered) },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className={cn("border-b border-border px-4 py-4", index % 2 === 0 ? "border-r" : "", index > 1 ? "border-b-0" : "")}
                >
                  <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">{item.label}</span>
                  <div className="mt-3 text-2xl font-mono font-bold text-foreground">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="border-b border-border px-4 py-4">
              <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Coverage Summary</span>
              <p className="mt-3 max-w-3xl text-[11px] leading-5 text-foreground">{coverage.data.summary}</p>
            </div>
            <div className="flex flex-col">
              {coverage.data.byFile.map((item) => (
                <div key={item.fileName} className="border-b border-border px-4 py-4 last:border-none">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-mono text-foreground">{item.fileName}</span>
                    <span className="text-xs font-mono text-muted-foreground">{item.coveragePercent}%</span>
                  </div>
                  <div className="mt-3 h-2.5 w-full border border-foreground">
                    <div className="h-full bg-foreground" style={{ width: `${item.coveragePercent}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="border border-foreground/20 px-2 py-1 text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                      {item.coveredFunctions} functions covered
                    </span>
                    {item.missingFunctions.map((missing) => (
                      <span
                        key={missing}
                        className="border border-foreground/20 px-2 py-1 text-[9px] tracking-[0.15em] uppercase text-muted-foreground"
                      >
                        {missing}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="border-b border-border px-4 py-3">
              <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Functions Missing Coverage</span>
            </div>
            <div className="flex flex-col">
              {coverage.data.functionsMissingCoverage.map((item) => (
                <div key={item} className="flex items-center gap-2 border-b border-border px-4 py-4 last:border-none">
                  <ShieldCheck size={14} strokeWidth={1.5} className="text-[#ea580c]" />
                  <span className="text-[11px] font-mono text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <StateBlock
          title="No coverage data available."
          message="Run tests or request coverage to populate file-level and function-level reporting."
        />
      )}
    </Panel>
  )
}
