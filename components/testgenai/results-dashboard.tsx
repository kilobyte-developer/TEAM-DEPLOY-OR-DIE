"use client"

import {
  CheckCircle2,
  Clock3,
  FileCode2,
  FlaskConical,
  FunctionSquare,
  Gauge,
  Percent,
  XCircle,
} from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { useTestGenAI } from "@/components/testgenai-provider"

export function ResultsDashboard() {
  const { stats } = useTestGenAI()

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
      <StatCard label="Files Uploaded" value={stats.filesUploaded} icon={FileCode2} index={0} />
      <StatCard label="Functions Detected" value={stats.functionsDetected} icon={FunctionSquare} index={1} />
      <StatCard label="Tests Generated" value={stats.testsGenerated} icon={FlaskConical} index={2} />
      <StatCard label="Passed Tests" value={stats.passedTests} icon={CheckCircle2} accent index={3} />
      <StatCard label="Failed Tests" value={stats.failedTests} icon={XCircle} index={4} />
      <StatCard label="Pass Rate" value={stats.passRate.toFixed(1)} suffix="%" icon={Percent} accent index={5} />
      <StatCard label="Execution Time" value={stats.executionTime} icon={Clock3} index={6} />
      <StatCard label="Coverage" value={stats.coveragePercentage.toFixed(1)} suffix="%" icon={Gauge} accent index={7} />
    </div>
  )
}
