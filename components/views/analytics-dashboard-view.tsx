"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FileCode2,
  Gauge,
  ScrollText,
  TestTube2,
  Upload,
  XCircle,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { PageHeader, Panel } from "@/components/page-primitives"
import { StatCard } from "@/components/stat-card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { getAnalyticsDashboard } from "@/lib/services/testgenai"
import type { AnalyticsDashboardData } from "@/lib/testgenai-types"

const chartConfig = {
  passed: { label: "Passed", color: "#16a34a" },
  failed: { label: "Failed", color: "#dc2626" },
  coverage: { label: "Coverage", color: "#ea580c" },
  executions: { label: "Executions", color: "#0a0a0a" },
  issues: { label: "Logic Issues", color: "#b45309" },
  value: { label: "Count", color: "#ea580c" },
} satisfies ChartConfig

const activityIcons = {
  upload: Upload,
  generation: TestTube2,
  execution: CheckCircle2,
  coverage: Gauge,
  story: ScrollText,
}

function number(value: number | undefined) {
  return Number(value ?? 0).toLocaleString()
}

function percent(value: number | undefined) {
  return `${Number(value ?? 0).toFixed(1)}%`
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <Panel label={label}>
      <div className="flex h-64 items-center justify-center px-4 text-center text-xs uppercase tracking-wider text-muted-foreground">
        No Supabase data available for this chart.
      </div>
    </Panel>
  )
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-none">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <strong className="text-right text-xs text-foreground">{value}</strong>
    </div>
  )
}

export function AnalyticsDashboardView() {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getAnalyticsDashboard()
      .then((payload) => {
        setData(payload)
        setError(payload.error ?? null)
      })
      .catch((dashboardError) => setError(dashboardError instanceof Error ? dashboardError.message : "Unable to load dashboard."))
      .finally(() => setLoading(false))
  }, [])

  const kpis = data?.kpis

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        subtitle="Enterprise analytics from Supabase history"
      />

      {error ? (
        <div className="border border-red-500/40 px-4 py-3 text-xs uppercase tracking-wider text-red-500">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Files Uploaded" value={loading ? "..." : number(kpis?.totalFilesUploaded)} icon={FileCode2} accent index={0} />
        <StatCard label="Total Executions" value={loading ? "..." : number(kpis?.totalExecutions)} icon={Activity} index={1} />
        <StatCard label="Total Tests Generated" value={loading ? "..." : number(kpis?.totalTestsGenerated)} icon={TestTube2} index={2} />
        <StatCard label="Total Tests Passed" value={loading ? "..." : number(kpis?.totalTestsPassed)} icon={CheckCircle2} accent index={3} />
        <StatCard label="Total Tests Failed" value={loading ? "..." : number(kpis?.totalTestsFailed)} icon={XCircle} index={4} />
        <StatCard label="Average Pass Rate" value={loading ? "..." : percent(kpis?.averagePassRate)} icon={Gauge} index={5} />
        <StatCard label="Average Coverage" value={loading ? "..." : percent(kpis?.averageCoverage)} icon={BarChart3} accent index={6} />
        <StatCard label="User Stories Processed" value={loading ? "..." : number(kpis?.userStoriesProcessed)} icon={ScrollText} index={7} />
        <StatCard label="Logic Issues Detected" value={loading ? "..." : number(kpis?.logicIssuesDetected)} icon={AlertTriangle} index={8} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {data?.charts.passFail.length ? (
          <Panel label="pass.vs.fail" meta="Pie">
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie data={data.charts.passFail} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92}>
                  {data.charts.passFail.map((entry) => (
                    <Cell key={entry.name} fill={entry.name === "Passed" ? "#16a34a" : "#dc2626"} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </Panel>
        ) : <EmptyPanel label="pass.vs.fail" />}

        {data?.charts.coverageTrend.length ? (
          <Panel label="coverage.trend" meta="Line">
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <LineChart data={data.charts.coverageTrend} margin={{ left: 12, right: 12, top: 20, bottom: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="coverage" stroke="#ea580c" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </Panel>
        ) : <EmptyPanel label="coverage.trend" />}

        {data?.charts.executionsOverTime.length ? (
          <Panel label="executions.over.time" meta="Daily">
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={data.charts.executionsOverTime} margin={{ left: 12, right: 12, top: 20, bottom: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="executions" fill="#0a0a0a" radius={0} />
              </BarChart>
            </ChartContainer>
          </Panel>
        ) : <EmptyPanel label="executions.over.time" />}

        {data?.charts.providerUsage.length ? (
          <Panel label="provider.usage" meta="Counts">
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={data.charts.providerUsage} margin={{ left: 12, right: 12, top: 20, bottom: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#ea580c" radius={0} />
              </BarChart>
            </ChartContainer>
          </Panel>
        ) : <EmptyPanel label="provider.usage" />}

        <div className="xl:col-span-2">
          {data?.charts.logicIssuesTrend.length ? (
            <Panel label="logic.issues.trend" meta="Daily">
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <LineChart data={data.charts.logicIssuesTrend} margin={{ left: 12, right: 12, top: 20, bottom: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="issues" stroke="#b45309" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </Panel>
          ) : <EmptyPanel label="logic.issues.trend" />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel label="insights" className="xl:col-span-1">
          <div>
            <InsightRow label="Most Tested File" value={data?.insights.mostTestedFile ?? "Not available"} />
            <InsightRow label="Highest Coverage File" value={`${data?.insights.highestCoverageFile ?? "Not available"} / ${percent(data?.insights.highestCoverage)}`} />
            <InsightRow label="Lowest Coverage File" value={`${data?.insights.lowestCoverageFile ?? "Not available"} / ${percent(data?.insights.lowestCoverage)}`} />
            <InsightRow label="Best Pass Rate" value={`${data?.insights.bestPassRateFile ?? "Not available"} / ${percent(data?.insights.bestPassRate)}`} />
            <InsightRow label="Worst Pass Rate" value={`${data?.insights.worstPassRateFile ?? "Not available"} / ${percent(data?.insights.worstPassRate)}`} />
            <InsightRow label="Most Recent Execution" value={data?.insights.mostRecentExecution ?? "Not available"} />
            <InsightRow label="Historical Coverage Average" value={percent(data?.insights.totalHistoricalCoverageAverage)} />
          </div>
        </Panel>

        <Panel label="top.10.most.tested.files" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b-2 border-foreground text-[10px] uppercase tracking-widest text-muted-foreground">
                  {["File Name", "Executions", "Pass Rate", "Coverage"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-normal">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.leaderboard.length ? data.leaderboard.map((row) => (
                  <tr key={row.fileName} className="border-b border-border">
                    <td className="px-4 py-3 text-xs font-semibold">{row.fileName}</td>
                    <td className="px-4 py-3 text-xs">{row.executions}</td>
                    <td className="px-4 py-3 text-xs">{percent(row.passRate)}</td>
                    <td className="px-4 py-3 text-xs">{percent(row.coverage)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-xs uppercase tracking-wider text-muted-foreground">No leaderboard data available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel label="recent.activity" meta="Newest First">
        <div className="flex flex-col">
          {data?.activity.length ? data.activity.map((item) => {
            const Icon = activityIcons[item.type]
            return (
              <div key={item.id} className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-none">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-foreground/20">
                  <Icon size={16} strokeWidth={1.5} className="text-[#ea580c]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs uppercase tracking-wider text-foreground">{item.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{item.detail}</p>
                </div>
                <span className="text-right text-[10px] uppercase tracking-widest text-muted-foreground">{item.displayTime}</span>
              </div>
            )
          }) : (
            <div className="px-4 py-8 text-center text-xs uppercase tracking-wider text-muted-foreground">
              No recent Supabase activity available.
            </div>
          )}
        </div>
      </Panel>
    </div>
  )
}
