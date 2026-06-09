"use client"

import { CheckCircle2, PlayCircle, RotateCcw, TimerReset, XCircle } from "lucide-react"
import { BrutalButton, Panel } from "@/components/page-primitives"
import { StateBlock } from "@/components/testgenai/state-block"
import { useTestGenAI } from "@/components/testgenai-provider"
import { cn } from "@/lib/utils"

export function ExecutionCenter() {
  const { state, runWorkspaceTests } = useTestGenAI()
  const execution = state.execution

  return (
    <Panel label="execution.center" meta="POST /run-tests">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Execution Status</span>
          <span className="text-xs font-mono uppercase tracking-[0.18em] text-foreground">
            {execution.status === "loading" ? "Running Tests" : execution.data?.status ?? "idle"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <BrutalButton
            variant="accent"
            icon={<PlayCircle size={14} strokeWidth={1.5} />}
            onClick={() => void runWorkspaceTests()}
            disabled={execution.status === "loading"}
          >
            {execution.status === "loading" ? "Running Tests..." : "Run Tests"}
          </BrutalButton>
          <BrutalButton
            variant="outline"
            icon={<RotateCcw size={14} strokeWidth={1.5} />}
            onClick={() => void runWorkspaceTests()}
            disabled={execution.status === "loading"}
          >
            Re-run Tests
          </BrutalButton>
        </div>
      </div>

      {execution.status === "loading" ? (
        <StateBlock
          title="Running Tests..."
          message="Executing the latest generated suite and collecting logs, pass rates, and runtime metrics."
          tone="loading"
        />
      ) : execution.status === "error" ? (
        <StateBlock
          title="Execution failed."
          message={execution.error ?? "The test run could not be completed."}
          tone="error"
        />
      ) : execution.data ? (
        <div className="grid grid-cols-2 gap-0 md:grid-cols-5">
          {[
            { label: "Execution Status", value: execution.data.status, icon: TimerReset, accent: false },
            { label: "Passed Tests", value: String(execution.data.passedTests), icon: CheckCircle2, accent: true },
            { label: "Failed Tests", value: String(execution.data.failedTests), icon: XCircle, accent: false },
            { label: "Execution Time", value: execution.data.executionTime, icon: TimerReset, accent: false },
            { label: "Pass Rate", value: `${execution.data.passRate.toFixed(1)}%`, icon: CheckCircle2, accent: true },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className={cn(
                  "border-b border-border px-4 py-4",
                  index % 2 === 0 ? "md:border-r" : "",
                  index >= 2 ? "md:border-r" : "",
                  index === 4 ? "md:border-r-0" : "",
                )}
              >
                <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">{item.label}</span>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-lg font-mono font-bold uppercase text-foreground">{item.value}</span>
                  <Icon size={16} strokeWidth={1.5} className={item.accent ? "text-[#ea580c]" : "text-foreground"} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <StateBlock
          title="No execution results available."
          message="Run the generated suite to populate pass/fail counts, runtime, and execution status."
        />
      )}
    </Panel>
  )
}
