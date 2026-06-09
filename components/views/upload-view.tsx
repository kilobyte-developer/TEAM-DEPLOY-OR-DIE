"use client"

import { PageHeader } from "@/components/page-primitives"
import { CodeUploadPanel } from "@/components/testgenai/code-upload-panel"
import { DemoBadge } from "@/components/testgenai/demo-badge"
import { InputModeSelector } from "@/components/testgenai/input-mode-selector"
import { UserStoryPanel } from "@/components/testgenai/user-story-panel"
import { useTestGenAI } from "@/components/testgenai-provider"

export function UploadView() {
  const { state } = useTestGenAI()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Input Workspace"
        subtitle={
          state.inputMode === "source-code"
            ? "Upload source files and prepare the analysis pipeline"
            : "Draft the user story that will drive generated test cases"
        }
        actions={<DemoBadge />}
      />

      <InputModeSelector />
      {state.inputMode === "source-code" ? <CodeUploadPanel /> : <UserStoryPanel />}
    </div>
  )
}
