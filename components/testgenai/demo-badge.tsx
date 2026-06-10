"use client"

import { useTestGenAI } from "@/components/testgenai-provider"

export function DemoBadge() {
  const { state } = useTestGenAI()

  return (
    <span className="border border-foreground/20 px-3 py-2 text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
      {state.demoMode ? "Demo Mode Active" : "Live MVP Mode"}
    </span>
  )
}
