"use client"

import { PageHeader } from "@/components/page-primitives"
import { CoveragePanel } from "@/components/testgenai/coverage-panel"
import { DemoBadge } from "@/components/testgenai/demo-badge"
import { InputModeSelector } from "@/components/testgenai/input-mode-selector"
import { ResultsDashboard } from "@/components/testgenai/results-dashboard"
import { useTestGenAI } from "@/components/testgenai-provider"

export function ResultsView() {
  const { state } = useTestGenAI()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Coverage"
        subtitle={
          state.inputMode === "source-code"
            ? "Inspect runtime outcomes, coverage, and remaining blind spots"
            : "Track how generated story cases translate into validation coverage"
        }
        actions={<DemoBadge />}
      />

      <InputModeSelector />
      <ResultsDashboard />
      <CoveragePanel />
    </div>
  )
}
