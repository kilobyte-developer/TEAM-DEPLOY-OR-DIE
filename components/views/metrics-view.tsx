"use client"

import { PageHeader } from "@/components/page-primitives"
import { DemoBadge } from "@/components/testgenai/demo-badge"
import { EvaluationResults } from "@/components/testgenai/evaluation-results"
import { InputModeSelector } from "@/components/testgenai/input-mode-selector"
import { useTestGenAI } from "@/components/testgenai-provider"

export function MetricsView() {
  const { state } = useTestGenAI()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Evaluation"
        subtitle={
          state.inputMode === "source-code"
            ? "Compare generated suite quality across repositories and files"
            : "Review generated case quality and execution readiness"
        }
        actions={<DemoBadge />}
      />

      <InputModeSelector />
      <EvaluationResults />
    </div>
  )
}
