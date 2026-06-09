"use client"

import { Wand2 } from "lucide-react"
import { BrutalButton, Panel } from "@/components/page-primitives"
import { StateBlock } from "@/components/testgenai/state-block"
import { useTestGenAI } from "@/components/testgenai-provider"
import { USER_STORY_PLACEHOLDER } from "@/lib/mock-data"

export function UserStoryPanel() {
  const { state, userStoryWordCount, setUserStoryInput, generateStoryTests } = useTestGenAI()

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Panel label="user.story.panel" meta="POST /generate-userstory-tests" className="lg:col-span-2">
        <div className="border-b border-border px-4 py-4">
          <textarea
            value={state.userStoryInput}
            onChange={(event) => setUserStoryInput(event.target.value)}
            placeholder={USER_STORY_PLACEHOLDER}
            className="min-h-[260px] w-full resize-none border border-foreground/20 bg-background px-4 py-4 text-sm font-mono leading-6 text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
              Story Status: {state.userStoryTests.status === "loading" ? "Generating" : state.userStoryTests.data?.status ?? "Draft"}
            </span>
            <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
              Word Count: {userStoryWordCount}
            </span>
          </div>
          <BrutalButton
            variant="accent"
            icon={<Wand2 size={14} strokeWidth={1.5} />}
            onClick={() => void generateStoryTests()}
            disabled={!state.userStoryInput.trim() || state.userStoryTests.status === "loading"}
          >
            {state.userStoryTests.status === "loading" ? "Generating Tests..." : "Generate Test Cases"}
          </BrutalButton>
        </div>
      </Panel>

      <Panel label="story.status" meta={state.userStoryTests.status.toUpperCase()}>
        {state.userStoryInput.trim() ? (
          <div className="flex flex-col">
            {[
              { label: "Mode", value: "User Story" },
              { label: "Story Status", value: state.userStoryTests.data?.status ?? "Ready" },
              { label: "Word Count", value: String(userStoryWordCount) },
              { label: "Positive Cases", value: String(state.userStoryTests.data?.positiveCases.length ?? 0) },
              { label: "Negative Cases", value: String(state.userStoryTests.data?.negativeCases.length ?? 0) },
              { label: "Edge Cases", value: String(state.userStoryTests.data?.edgeCases.length ?? 0) },
            ].map((row) => (
              <div key={row.label} className="flex flex-col gap-1 border-b border-border px-4 py-4 last:border-none">
                <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">{row.label}</span>
                <span className="text-sm font-mono text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <StateBlock
            title="No user story submitted."
            message="Paste a user story to generate structured scenarios, negative tests, and edge cases."
          />
        )}
      </Panel>
    </div>
  )
}
