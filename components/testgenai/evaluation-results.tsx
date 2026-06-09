"use client"

import { motion } from "framer-motion"
import { Panel } from "@/components/page-primitives"
import { useTestGenAI } from "@/components/testgenai-provider"
import { cn } from "@/lib/utils"

const ease = [0.22, 1, 0.36, 1] as const

const STATUS_STYLES = {
  PASS: "border-[#ea580c] text-[#ea580c]",
  PARTIAL: "border-foreground/40 text-foreground",
  FAIL: "border-destructive text-destructive",
}

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

export function EvaluationResults() {
  const { state } = useTestGenAI()
  const records = state.evaluationResults
  const totalGenerated = records.reduce((sum, record) => sum + record.testsGenerated, 0)
  const totalPassed = records.reduce((sum, record) => sum + record.passed, 0)
  const totalFailed = records.reduce((sum, record) => sum + record.failed, 0)
  const averageCoverage = records.length
    ? Math.round(records.reduce((sum, record) => sum + record.coverage, 0) / records.length)
    : 0
  const averagePassRate = totalGenerated ? Math.round((totalPassed / totalGenerated) * 100) : 0
  const repositorySuccessRate = records.length
    ? Math.round((records.filter((record) => record.status === "PASS").length / records.length) * 100)
    : 0
  const executionStability = totalGenerated
    ? Math.round(((totalGenerated - totalFailed) / totalGenerated) * 100)
    : 0

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Average Coverage", value: averageCoverage },
          { label: "Pass Rate", value: averagePassRate },
          { label: "Repository Success", value: repositorySuccessRate },
          { label: "Execution Stability", value: executionStability },
        ].map((item, index) => (
          <RadialMetric key={item.label} label={item.label} value={item.value} index={index} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease }}
      >
        <Panel label="evaluation.results" meta={`${records.length} RECORDS`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-border">
                  {["Repository", "Tests Generated", "Passed", "Failed", "Coverage", "Status"].map((heading, index) => (
                    <th
                      key={heading}
                      className={cn(
                        "px-4 py-3 text-[9px] tracking-[0.15em] uppercase text-muted-foreground",
                        index === 0 ? "text-left" : "text-right",
                        index === 5 && "text-center",
                      )}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.repository} className="border-b border-border last:border-none hover:bg-foreground/5">
                    <td className="px-4 py-3.5 text-left text-xs font-mono text-foreground">{record.repository}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-mono text-muted-foreground">{record.testsGenerated}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-mono text-muted-foreground">{record.passed}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-mono text-muted-foreground">{record.failed}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-mono text-foreground">{record.coverage}%</td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={cn(
                          "inline-block border px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase",
                          STATUS_STYLES[record.status],
                        )}
                      >
                        {record.status}
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
