"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { PlayCircle, RotateCcw, CheckCircle2, XCircle } from "lucide-react"
import { PageHeader, Panel, BrutalButton } from "@/components/page-primitives"
import { executionLogs } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const ease = [0.22, 1, 0.36, 1] as const

type RunStatus = "idle" | "running" | "done"

export function ExecutionView() {
  const [status, setStatus] = useState<RunStatus>("done")
  const [visibleLines, setVisibleLines] = useState(executionLogs.length)
  const logRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const shown = executionLogs.slice(0, visibleLines)
  const passed = shown.filter((l) => l.level === "pass").length
  const failed = shown.filter((l) => l.level === "fail").length

  const runTests = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setStatus("running")
    setVisibleLines(0)
    let i = 0
    timerRef.current = setInterval(() => {
      i += 1
      setVisibleLines(i)
      if (i >= executionLogs.length) {
        if (timerRef.current) clearInterval(timerRef.current)
        setStatus("done")
      }
    }, 280)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [visibleLines])

  const statusLabel = status === "running" ? "RUNNING" : status === "done" ? "COMPLETE" : "IDLE"

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Test Execution"
        subtitle="Run generated tests and inspect output"
        actions={
          <>
            <BrutalButton
              variant="accent"
              icon={<PlayCircle size={14} strokeWidth={2} />}
              onClick={runTests}
              disabled={status === "running"}
            >
              Run Tests
            </BrutalButton>
            <BrutalButton
              variant="outline"
              icon={<RotateCcw size={14} strokeWidth={1.5} />}
              onClick={runTests}
              disabled={status === "running"}
            >
              Re-run Tests
            </BrutalButton>
          </>
        }
      />

      {/* Status row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center justify-between border border-foreground/20 bg-background p-5"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">Run Status</span>
            <span className="text-lg font-mono font-bold uppercase text-foreground">{statusLabel}</span>
          </div>
          <span
            className={cn(
              "h-2.5 w-2.5",
              status === "running" ? "animate-pulse bg-[#ea580c]" : status === "done" ? "bg-[#ea580c]" : "bg-muted-foreground",
            )}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease }}
          className="flex items-center justify-between border border-foreground/20 bg-background p-5"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">Passed</span>
            <span className="text-lg font-mono font-bold text-foreground">{passed}</span>
          </div>
          <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#ea580c]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease }}
          className="flex items-center justify-between border border-foreground/20 bg-background p-5"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">Failed</span>
            <span className="text-lg font-mono font-bold text-foreground">{failed}</span>
          </div>
          <XCircle size={18} strokeWidth={1.5} className="text-destructive" />
        </motion.div>
      </div>

      {/* Execution logs */}
      <Panel label="execution.logs" meta={`${shown.length} LINES`}>
        <div ref={logRef} className="h-80 overflow-y-auto bg-foreground p-4">
          <div className="flex flex-col gap-1">
            {shown.map((log, i) => (
              <span
                key={i}
                className={cn(
                  "block text-xs font-mono",
                  log.level === "pass" && "text-[#4ade80]",
                  log.level === "fail" && "text-[#f87171]",
                  log.level === "info" && "text-background/70",
                )}
              >
                {log.line}
              </span>
            ))}
            {status === "running" && <span className="text-xs font-mono text-[#ea580c] animate-blink">{"_"}</span>}
          </div>
        </div>
      </Panel>
    </div>
  )
}
