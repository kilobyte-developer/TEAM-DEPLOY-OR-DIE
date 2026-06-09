"use client"

import { ArrowDown, ScanLine, Upload, Wand2, PlayCircle, Gauge, ClipboardList } from "lucide-react"
import { Panel } from "@/components/page-primitives"

const STEPS = [
  { label: "Upload Code", description: "Ingest repository files or prepared source modules.", icon: Upload },
  { label: "Analyze AST", description: "Detect functions, classes, parameters, and dependencies.", icon: ScanLine },
  { label: "Generate Tests", description: "Produce unit suites and targeted edge-case coverage.", icon: Wand2 },
  { label: "Run Tests", description: "Execute generated suites and stream runtime logs.", icon: PlayCircle },
  { label: "Coverage Report", description: "Summarize coverage percentage and missing function paths.", icon: Gauge },
  { label: "Evaluation Results", description: "Compare generated output quality across repositories.", icon: ClipboardList },
]

export function WorkflowVisualization() {
  return (
    <Panel label="agent.workflow" meta="MVP FLOW">
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-6">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isLast = index === STEPS.length - 1

          return (
            <div key={step.label} className="relative border-b border-border px-4 py-5 last:border-b-0 lg:border-b-0 lg:border-r last:lg:border-r-0">
              <div className="flex flex-col gap-3">
                <span className="flex h-10 w-10 items-center justify-center border border-foreground/20">
                  <Icon size={16} strokeWidth={1.5} className="text-[#ea580c]" />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-foreground">{step.label}</span>
                  <span className="text-[11px] leading-5 text-muted-foreground">{step.description}</span>
                </div>
              </div>
              {!isLast ? (
                <span className="mt-4 flex items-center gap-2 text-[9px] tracking-[0.18em] uppercase text-muted-foreground lg:absolute lg:right-3 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2">
                  <ArrowDown size={12} strokeWidth={1.5} className="lg:hidden" />
                  <span className="hidden lg:block">Next</span>
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
