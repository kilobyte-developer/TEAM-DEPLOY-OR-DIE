"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Panel } from "@/components/page-primitives"
import { StateBlock } from "@/components/testgenai/state-block"
import { useTestGenAI } from "@/components/testgenai-provider"
import { cn } from "@/lib/utils"

export function LogViewer() {
  const { state } = useTestGenAI()
  const logs = state.execution.data?.logs ?? []

  return (
    <Panel label="log.viewer" meta={`${logs.length} LINES`}>
      {logs.length === 0 ? (
        <StateBlock
          title="No execution results available."
          message="Execution logs, console output, warnings, and errors will appear here after a test run."
        />
      ) : (
        <ScrollArea className="h-[420px] bg-foreground">
          <div className="flex flex-col gap-1 p-4">
            {logs.map((log, index) => (
              <div key={`${log.timestamp}-${index}`} className="grid grid-cols-[80px_1fr] gap-3 text-xs font-mono">
                <span className="text-background/40">{log.timestamp}</span>
                <span
                  className={cn(
                    "leading-5",
                    log.level === "info" && "text-background/75",
                    log.level === "pass" && "text-[#4ade80]",
                    log.level === "warn" && "text-[#fbbf24]",
                    log.level === "fail" && "text-[#f87171]",
                  )}
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Panel>
  )
}
