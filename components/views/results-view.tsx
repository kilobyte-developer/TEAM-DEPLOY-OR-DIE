"use client"

import { motion } from "framer-motion"
import { FlaskConical, CheckCircle2, XCircle, Percent, Gauge, AlertTriangle, ShieldCheck } from "lucide-react"
import { PageHeader, Panel } from "@/components/page-primitives"
import { StatCard } from "@/components/stat-card"
import { summaryStats, coverageByFile, failedTests, edgeCasesCovered } from "@/lib/mock-data"

const ease = [0.22, 1, 0.36, 1] as const

export function ResultsView() {
  const passRate = ((summaryStats.testsPassed / summaryStats.testsGenerated) * 100).toFixed(1)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Results & Coverage" subtitle="Aggregated test outcomes & coverage report" />

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Generated" value={summaryStats.testsGenerated} icon={FlaskConical} index={0} />
        <StatCard label="Passed" value={summaryStats.testsPassed} icon={CheckCircle2} accent index={1} />
        <StatCard label="Failed" value={summaryStats.testsFailed} icon={XCircle} index={2} />
        <StatCard label="Pass Rate" value={passRate} suffix="%" icon={Percent} accent index={3} />
        <StatCard label="Coverage" value={summaryStats.coverage} suffix="%" icon={Gauge} accent index={4} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Coverage summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          <Panel label="coverage.summary">
            <div className="flex flex-col gap-5 p-5">
              {coverageByFile.map((row) => (
                <div key={row.file} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-foreground">{row.file}</span>
                    <span className="text-xs font-mono text-muted-foreground">{row.coverage}%</span>
                  </div>
                  <div className="h-2.5 w-full border border-foreground">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${row.coverage}%` }}
                      transition={{ duration: 0.7, ease }}
                      className="h-full bg-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>

        {/* Edge cases covered */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease }}
        >
          <Panel label="edge_cases.covered" meta={`${edgeCasesCovered.length} TYPES`}>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {edgeCasesCovered.map((c) => (
                <div key={c} className="flex items-center gap-2 border-b border-border px-4 py-3.5">
                  <ShieldCheck size={14} strokeWidth={1.5} className="shrink-0 text-[#ea580c]" />
                  <span className="text-xs font-mono text-foreground">{c}</span>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>
      </div>

      {/* Failed test details */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease }}
      >
        <Panel label="failed_test.details" meta={`${failedTests.length} FAILURES`}>
          <div className="flex flex-col">
            {failedTests.map((t) => (
              <div key={t.name} className="flex items-start gap-3 border-b border-border px-4 py-4 last:border-none">
                <AlertTriangle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-destructive" />
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-foreground">{t.name}</span>
                    <span className="text-[10px] tracking-wider uppercase text-muted-foreground">{t.file}</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">{t.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </motion.div>
    </div>
  )
}
