"use client"

import { useState } from "react"
import { RefreshCw, Wand2 } from "lucide-react"
import { CodeViewer } from "@/components/code-viewer"
import { BrutalButton, Panel } from "@/components/page-primitives"
import { StateBlock } from "@/components/testgenai/state-block"
import { useTestGenAI } from "@/components/testgenai-provider"
import { cn } from "@/lib/utils"

export function TestViewer() {
  const { state, generateSourceCodeTests } = useTestGenAI()
  const suite = state.generatedTests

  if (state.analysis.status === "loading") {
    return (
      <Panel label="test.viewer" meta="WAITING">
        <StateBlock
          title="Analyzing Code..."
          message="Test generation will unlock as soon as function signatures and dependencies are ready."
          tone="loading"
        />
      </Panel>
    )
  }

  if (state.analysis.status !== "success") {
    return (
      <Panel label="test.viewer" meta="READY">
        <StateBlock
          title="No tests generated yet."
          message="Run code analysis first, then generate unit and edge-case suites from detected functions."
        />
      </Panel>
    )
  }

  return <TestViewerContent onGenerate={generateSourceCodeTests} />
}

function TestViewerContent({ onGenerate }: { onGenerate: () => Promise<void> }) {
  const { state } = useTestGenAI()
  const suite = state.generatedTests
  const artifacts = suite.data
  const [tab, setTab] = useState<"unit" | "edge">("unit")
  const currentArtifact = tab === "unit" ? artifacts?.unitTests[0] : artifacts?.edgeCaseTests[0]

  return (
    <Panel
      label="test.viewer"
      meta={artifacts ? `${artifacts.summary.unitTestsGenerated + artifacts.summary.edgeTestsGenerated} TESTS` : "POST /generate-tests"}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4">
        <div className="flex items-center gap-2 border border-foreground/20">
          {[
            { key: "unit" as const, label: "Unit Tests" },
            { key: "edge" as const, label: "Edge Cases" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                "px-4 py-2 text-[10px] tracking-[0.18em] uppercase transition-colors duration-150",
                tab === item.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <BrutalButton
            variant="accent"
            icon={<Wand2 size={14} strokeWidth={1.5} />}
            onClick={() => void onGenerate()}
            disabled={suite.status === "loading"}
          >
            {suite.status === "loading" ? "Generating Tests..." : "Generate Tests"}
          </BrutalButton>
          <BrutalButton
            variant="outline"
            icon={<RefreshCw size={14} strokeWidth={1.5} />}
            onClick={() => void onGenerate()}
            disabled={suite.status === "loading"}
          >
            Regenerate
          </BrutalButton>
        </div>
      </div>

      {suite.status === "loading" ? (
        <StateBlock
          title="Generating Tests..."
          message="Synthesizing unit coverage, edge cases, and assertion structure from the latest analysis."
          tone="loading"
        />
      ) : suite.status === "error" ? (
        <StateBlock
          title="Generation failed."
          message={suite.error ?? "The generate-tests request could not be completed."}
          tone="error"
        />
      ) : currentArtifact ? (
        <div className="p-4">
          <CodeViewer
            code={currentArtifact.code}
            filename={currentArtifact.fileName}
            meta={`${currentArtifact.label} | ${currentArtifact.testCount} cases`}
          />
        </div>
      ) : (
        <StateBlock
          title="No tests generated yet."
          message="Generate Tests to populate the code viewer with unit and edge-case output."
        />
      )}
    </Panel>
  )
}
