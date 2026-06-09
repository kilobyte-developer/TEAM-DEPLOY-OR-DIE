"use client"

import { PageHeader, Panel } from "@/components/page-primitives"
import { AnalysisPanel } from "@/components/testgenai/analysis-panel"
import { DemoBadge } from "@/components/testgenai/demo-badge"
import { InputModeSelector } from "@/components/testgenai/input-mode-selector"
import { TestViewer } from "@/components/testgenai/test-viewer"
import { UserStoryTestViewer } from "@/components/testgenai/user-story-test-viewer"
import { useTestGenAI } from "@/components/testgenai-provider"

export function GenerateView() {
  const { state } = useTestGenAI()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Generator"
        subtitle={
          state.inputMode === "source-code"
            ? "Generate unit and edge-case suites from uploaded source code"
            : "Review generated scenarios, negative flows, and edge cases from the story"
        }
        actions={<DemoBadge />}
      />

      <InputModeSelector />

      {state.inputMode === "source-code" ? (
        <div className="grid grid-cols-1 gap-6">
          <AnalysisPanel />
          <TestViewer />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Panel label="story.snapshot" meta="CURRENT INPUT">
            <div className="border-b border-border px-4 py-4">
              <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">User Story</span>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground">
                {state.userStoryInput || "No user story submitted."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-0">
              <div className="border-r border-border px-4 py-4">
                <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Story Status</span>
                <div className="mt-3 text-lg font-mono font-bold text-foreground">
                  {state.userStoryTests.data?.status ?? "Draft"}
                </div>
              </div>
              <div className="px-4 py-4">
                <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Generated Cases</span>
                <div className="mt-3 text-lg font-mono font-bold text-foreground">
                  {(state.userStoryTests.data?.positiveCases.length ?? 0) +
                    (state.userStoryTests.data?.negativeCases.length ?? 0) +
                    (state.userStoryTests.data?.edgeCases.length ?? 0)}
                </div>
              </div>
            </div>
          </Panel>
          <UserStoryTestViewer />
        </div>
      )}
    </div>
  )
}
