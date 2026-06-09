"use client"

import { PageHeader } from "@/components/page-primitives"
import { DemoBadge } from "@/components/testgenai/demo-badge"
import { ExecutionCenter } from "@/components/testgenai/execution-center"
import { InputModeSelector } from "@/components/testgenai/input-mode-selector"
import { LogViewer } from "@/components/testgenai/log-viewer"
import { useTestGenAI } from "@/components/testgenai-provider"

export function ExecutionView() {
  const { state } = useTestGenAI()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Execution"
        subtitle={
          state.inputMode === "source-code"
            ? "Run generated code tests and inspect console output"
            : "Validate generated story cases and inspect execution logs"
        }
        actions={<DemoBadge />}
      />

      <InputModeSelector />
      <ExecutionCenter />
      <LogViewer />
    </div>
  )
}
