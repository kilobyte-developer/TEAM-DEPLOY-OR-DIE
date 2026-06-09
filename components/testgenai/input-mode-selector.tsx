"use client"

import { FileCode2, ScrollText } from "lucide-react"
import { Panel } from "@/components/page-primitives"
import { useTestGenAI } from "@/components/testgenai-provider"
import { cn } from "@/lib/utils"
import type { InputMode } from "@/lib/testgenai-types"

const OPTIONS: Array<{
  mode: InputMode
  title: string
  description: string
  icon: typeof FileCode2
}> = [
  {
    mode: "source-code",
    title: "Source Code",
    description: "Upload files, analyze functions, generate unit and edge tests, then run coverage.",
    icon: FileCode2,
  },
  {
    mode: "user-story",
    title: "User Story",
    description: "Paste a story, generate scenario-driven cases, and validate negative and edge flows.",
    icon: ScrollText,
  },
]

export function InputModeSelector() {
  const { state, setInputMode } = useTestGenAI()

  return (
    <Panel label="input.mode" meta={state.inputMode === "source-code" ? "SOURCE FLOW" : "STORY FLOW"}>
      <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
        {OPTIONS.map((option) => {
          const Icon = option.icon
          const active = state.inputMode === option.mode
          return (
            <button
              key={option.mode}
              onClick={() => setInputMode(option.mode)}
              className={cn(
                "flex flex-col gap-3 border-b border-border px-5 py-5 text-left transition-colors duration-150 md:border-b-0 md:first:border-r",
                active ? "bg-foreground text-background" : "hover:bg-foreground/5",
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn("flex h-10 w-10 items-center justify-center border", active ? "border-background/20" : "border-foreground/20")}>
                  <Icon size={16} strokeWidth={1.5} className={active ? "text-[#f8c29d]" : "text-[#ea580c]"} />
                </span>
                <div className="flex flex-col">
                  <span className={cn("text-xs font-mono uppercase tracking-[0.18em]", active ? "text-background" : "text-foreground")}>
                    {option.title}
                  </span>
                  <span className={cn("text-[10px] tracking-[0.15em] uppercase", active ? "text-background/60" : "text-muted-foreground")}>
                    {option.mode === "source-code" ? "POST /upload, /analyze, /generate-tests" : "POST /generate-userstory-tests"}
                  </span>
                </div>
              </div>
              <p className={cn("max-w-xl text-[11px] leading-5", active ? "text-background/75" : "text-muted-foreground")}>
                {option.description}
              </p>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
