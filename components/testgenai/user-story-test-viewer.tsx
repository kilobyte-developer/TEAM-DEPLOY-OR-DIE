"use client"

import { Panel } from "@/components/page-primitives"
import { StateBlock } from "@/components/testgenai/state-block"
import { useTestGenAI } from "@/components/testgenai-provider"
import type { UserStoryTestCase } from "@/lib/testgenai-types"

function Section({
  title,
  cases,
}: {
  title: string
  cases: UserStoryTestCase[]
}) {
  return (
    <div className="border-b border-border last:border-none">
      <div className="border-b border-border px-4 py-3">
        <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">{title}</span>
      </div>
      <div className="flex flex-col">
        {cases.map((item) => (
          <div key={item.id} className="border-b border-border px-4 py-4 last:border-none">
            <div className="flex flex-wrap items-center gap-2">
              <span className="border border-foreground/20 px-2 py-1 text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                {item.id}
              </span>
              <span className="border border-foreground/20 px-2 py-1 text-[9px] tracking-[0.15em] uppercase text-[#ea580c]">
                {item.priority}
              </span>
              <span className="text-xs font-mono font-bold text-foreground">{item.scenario}</span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
              <div>
                <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Steps</span>
                <ol className="mt-2 flex list-decimal flex-col gap-1 pl-4">
                  {item.steps.map((step) => (
                    <li key={step} className="text-[11px] leading-5 text-foreground">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Expected Result</span>
                <p className="mt-2 text-[11px] leading-5 text-foreground">{item.expectedResult}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function UserStoryTestViewer() {
  const { state } = useTestGenAI()
  const suite = state.userStoryTests

  return (
    <Panel
      label="user.story.test.viewer"
      meta={suite.data ? `${suite.data.positiveCases.length + suite.data.negativeCases.length + suite.data.edgeCases.length} CASES` : "POST /generate-userstory-tests"}
    >
      {suite.status === "loading" ? (
        <StateBlock
          title="Generating Tests..."
          message="Transforming the story into positive scenarios, negative cases, and edge coverage."
          tone="loading"
        />
      ) : suite.status === "error" ? (
        <StateBlock
          title="Generation failed."
          message={suite.error ?? "The user story request could not be completed."}
          tone="error"
        />
      ) : suite.data ? (
        <div className="flex flex-col">
          <div className="border-b border-border px-4 py-4">
            <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">Story Status</span>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono font-bold text-foreground">{suite.data.status}</span>
              <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                {suite.data.wordCount} words
              </span>
              <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                Generated {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(suite.data.generatedAt))}
              </span>
            </div>
          </div>
          <Section title="Positive Test Cases" cases={suite.data.positiveCases} />
          <Section title="Negative Test Cases" cases={suite.data.negativeCases} />
          <Section title="Edge Cases" cases={suite.data.edgeCases} />
        </div>
      ) : (
        <StateBlock
          title="No user story submitted."
          message="Generate a user story suite to inspect structured scenarios and expected outcomes."
        />
      )}
    </Panel>
  )
}
