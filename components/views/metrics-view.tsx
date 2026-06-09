"use client"

import { motion } from "framer-motion"
import { PageHeader, Panel } from "@/components/page-primitives"
import { evaluationMetrics, evaluationTable, type TestRow } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const ease = [0.22, 1, 0.36, 1] as const

function RadialMetric({ label, value, index }: { label: string; value: number; index: number }) {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease }}
      className="flex flex-col items-center gap-3 border border-foreground/20 bg-background p-6"
    >
      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="#ea580c"
            strokeWidth="6"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, delay: index * 0.06, ease }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-mono font-bold text-foreground">
          {value}%
        </span>
      </div>
      <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground text-center">{label}</span>
    </motion.div>
  )
}

const STATUS_STYLES: Record<TestRow["status"], string> = {
  PASS: "border-[#ea580c] text-[#ea580c]",
  PARTIAL: "border-foreground/40 text-foreground",
  FAIL: "border-destructive text-destructive",
}

export function MetricsView() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Evaluation Metrics" subtitle="Agent performance & per-file evaluation" />

      {/* Radial metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {evaluationMetrics.map((m, i) => (
          <RadialMetric key={m.label} label={m.label} value={m.value} index={i} />
        ))}
      </div>

      {/* Evaluation table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease }}
      >
        <Panel label="evaluation.table" meta={`${evaluationTable.length} FILES`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border">
                  {["Repository / File", "Tests Generated", "Tests Passed", "Coverage %", "Execution Status"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-3 text-[9px] tracking-[0.15em] uppercase text-muted-foreground",
                          i === 0 ? "text-left" : "text-right",
                          i === 4 && "text-center",
                        )}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {evaluationTable.map((row) => (
                  <tr key={row.file} className="border-b border-border last:border-none hover:bg-foreground/5">
                    <td className="px-4 py-3.5 text-left text-xs font-mono text-foreground">{row.file}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-mono text-muted-foreground">{row.generated}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-mono text-muted-foreground">{row.passed}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-mono text-foreground">{row.coverage}%</td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={cn(
                          "inline-block border px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase",
                          STATUS_STYLES[row.status],
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </motion.div>
    </div>
  )
}
