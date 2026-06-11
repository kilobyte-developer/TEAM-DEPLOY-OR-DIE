"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { Download, Search, ShieldAlert, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { BrutalButton, PageHeader, Panel } from "@/components/page-primitives"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  deletePastRecords,
  getPastRecordDetails,
  getPastRecords,
} from "@/lib/services/testgenai"
import type { PastRecordDetails, PastRecordSummary } from "@/lib/testgenai-types"

const ease = [0.22, 1, 0.36, 1] as const

function formatDate(value?: string | null) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return "Not available"
  return date.toLocaleString()
}

function percent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`
}

function compactJson(value: unknown) {
  if (value === null || value === undefined) return "Not available"
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value)
  if (typeof value === "object" && "name" in value && typeof value.name === "string") return value.name
  if (typeof value === "object" && "message" in value && typeof value.message === "string") return value.message
  return JSON.stringify(value)
}

function ListBlock({ items, empty = "None" }: { items: unknown[]; empty?: string }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">{empty}</p>
  return (
    <ul className="grid gap-2">
      {items.map((item, index) => (
        <li key={`${compactJson(item)}-${index}`} className="border border-foreground/15 px-3 py-2 text-xs text-foreground">
          {compactJson(item)}
        </li>
      ))}
    </ul>
  )
}

function downloadHistoricalReport(details: PastRecordDetails) {
  const escapeHtml = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")

  const rows = [
    ["File Name", details.file.fileName],
    ["Language", details.file.language],
    ["Provider", details.provider.provider],
    ["Model", details.provider.model],
    ["Execution", formatDate(details.execution.executionTimestamp)],
    ["Pass Rate", percent(details.execution.passRate)],
    ["Coverage", percent(details.coverage.coveragePercent)],
  ]

  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>TestGenAI Historical Report</title>
  <style>body{font-family:monospace;background:#eee9df;color:#0a0a0a;padding:32px}.panel{border:1px solid #0a0a0a33;margin:18px 0;padding:16px}h1{text-transform:uppercase}pre{white-space:pre-wrap;background:#0a0a0a;color:#eee9df;padding:16px;overflow:auto}.metric{display:grid;grid-template-columns:220px 1fr;border-bottom:1px solid #0a0a0a22;padding:8px 0}</style></head><body>
  <h1>TestGenAI Historical Report</h1>
  <div class="panel">${rows.map(([label, value]) => `<div class="metric"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`).join("")}</div>
  <div class="panel"><h2>Analysis</h2><pre>${escapeHtml(JSON.stringify(details.analysis, null, 2))}</pre></div>
  <div class="panel"><h2>Semantic Tests</h2><pre>${escapeHtml(JSON.stringify(details.semanticTests, null, 2))}</pre></div>
  <div class="panel"><h2>Execution Logs</h2><pre>${escapeHtml(JSON.stringify(details.execution.logs, null, 2))}</pre></div>
  </body></html>`
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `testgenai-history-${details.file.fileName.replace(/\W+/g, "-")}.html`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-foreground/20">
      <div className="border-b border-foreground/20 px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="grid gap-4 p-4">{children}</div>
    </section>
  )
}

function MetricGrid({ items }: { items: Array<[string, string | number]> }) {
  return (
    <div className="grid grid-cols-1 border border-foreground/20 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="border-b border-r border-foreground/20 p-3 last:border-r-0">
          <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
          <strong className="mt-2 block text-sm text-foreground">{value}</strong>
        </div>
      ))}
    </div>
  )
}

export function PastRecordsView() {
  const [records, setRecords] = useState<PastRecordSummary[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [details, setDetails] = useState<PastRecordDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<"password" | "count" | "confirm">("password")
  const [password, setPassword] = useState("")
  const [deleteCount, setDeleteCount] = useState("1")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadRecords = async () => {
    setLoading(true)
    setError(null)
    try {
      setRecords(await getPastRecords())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load records.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRecords()
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setDetailsLoading(true)
    setDetails(null)
    void getPastRecordDetails(selectedId)
      .then(setDetails)
      .catch((detailError) => setError(detailError instanceof Error ? detailError.message : "Unable to load details."))
      .finally(() => setDetailsLoading(false))
  }, [selectedId])

  const filteredRecords = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return records
      .filter((record) => (needle ? record.fileName.toLowerCase().includes(needle) : true))
      .sort((left, right) => new Date(right.executionDate).getTime() - new Date(left.executionDate).getTime())
  }, [records, query])

  const resetDelete = () => {
    setDeleteStep("password")
    setPassword("")
    setDeleteCount("1")
    setDeleteError(null)
    setDeleting(false)
  }

  const closeDelete = () => {
    setDeleteOpen(false)
    resetDelete()
  }

  const verifyPassword = () => {
    if (password !== "iAmCaptialTeamDeployOrDie") {
      setDeleteError("Incorrect password.")
      return
    }
    setDeleteError(null)
    setDeleteStep("count")
  }

  const verifyCount = () => {
    const count = Number(deleteCount)
    if (!Number.isInteger(count) || count < 1) {
      setDeleteError("Enter a positive whole number.")
      return
    }
    setDeleteError(null)
    setDeleteStep("confirm")
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deletePastRecords(password, Number(deleteCount))
      closeDelete()
      await loadRecords()
    } catch (deleteFailure) {
      setDeleteError(deleteFailure instanceof Error ? deleteFailure.message : "Delete failed.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Past Records"
        subtitle="Persistent Supabase execution history"
        actions={
          <BrutalButton
            variant="outline"
            icon={<Trash2 size={14} strokeWidth={1.5} />}
            onClick={() => setDeleteOpen(true)}
          >
            Delete Records
          </BrutalButton>
        }
      />

      <Panel
        label="history.table"
        meta="Newest First"
      >
        <div className="border-b border-foreground/20 p-4">
          <div className="flex max-w-md items-center gap-2 border border-foreground/20 px-3 py-2">
            <Search size={15} strokeWidth={1.5} className="text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by file name"
              className="h-8 flex-1 bg-transparent text-xs uppercase tracking-wider outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {error ? <div className="border-b border-foreground/20 p-4 text-xs uppercase tracking-wider text-red-500">{error}</div> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-foreground text-[10px] uppercase tracking-widest text-muted-foreground">
                {["File Name", "Language", "Execution Date", "Total Tests", "Passed", "Failed", "Pass Rate", "Coverage %", "Provider Used", "Status"].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-normal">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-xs uppercase tracking-wider text-muted-foreground">Loading Supabase records...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-xs uppercase tracking-wider text-muted-foreground">No historical records found.</td></tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.2), ease }}
                    onClick={() => setSelectedId(record.id)}
                    className="cursor-pointer border-b border-border transition-colors hover:bg-foreground/5"
                  >
                    <td className="px-4 py-4 text-xs font-semibold text-foreground">{record.fileName}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{record.language}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{formatDate(record.executionDate)}</td>
                    <td className="px-4 py-4 text-xs">{record.totalTests}</td>
                    <td className="px-4 py-4 text-xs text-green-600">{record.passed}</td>
                    <td className="px-4 py-4 text-xs text-red-500">{record.failed}</td>
                    <td className="px-4 py-4 text-xs">{percent(record.passRate)}</td>
                    <td className="px-4 py-4 text-xs">{percent(record.coveragePercent)}</td>
                    <td className="px-4 py-4 text-xs uppercase">{record.providerUsed}</td>
                    <td className="px-4 py-4 text-xs uppercase">{record.status}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden rounded-none border-foreground/30 p-0">
          <DialogHeader className="border-b-2 border-foreground px-5 py-4">
            <DialogTitle className="font-mono text-sm uppercase tracking-widest">Record Details</DialogTitle>
            <DialogDescription>Supabase-backed execution, analysis, coverage, and semantic test history.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[78vh]">
            <div className="grid gap-5 p-5">
              {detailsLoading || !details ? (
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Loading record details...</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-bold uppercase tracking-tight">{details.file.fileName}</h2>
                    {details.hasHtmlReport ? (
                      <BrutalButton
                        variant="accent"
                        icon={<Download size={14} strokeWidth={1.5} />}
                        onClick={() => downloadHistoricalReport(details)}
                      >
                        HTML Report
                      </BrutalButton>
                    ) : null}
                  </div>

                  <MetricGrid items={[
                    ["Upload Timestamp", formatDate(details.file.uploadTimestamp)],
                    ["Execution Timestamp", formatDate(details.execution.executionTimestamp)],
                    ["Language", details.file.language],
                    ["Provider", details.provider.provider],
                    ["Model", details.provider.model],
                    ["Status", details.execution.status],
                  ]} />

                  <DetailSection title="Analysis Summary">
                    <MetricGrid items={[
                      ["Functions", details.analysis.functionCount],
                      ["Classes", details.analysis.classCount],
                      ["Imports", details.analysis.importCount],
                      ["Dependencies", details.analysis.dependencyCount],
                    ]} />
                    <div className="grid gap-4 lg:grid-cols-2">
                      <ListBlock items={details.analysis.functions} empty="No functions recorded." />
                      <ListBlock items={details.analysis.classes} empty="No classes recorded." />
                      <ListBlock items={details.analysis.imports} empty="No imports recorded." />
                      <ListBlock items={details.analysis.dependencies} empty="No dependencies recorded." />
                    </div>
                  </DetailSection>

                  <DetailSection title="Execution Summary">
                    <MetricGrid items={[
                      ["Total Tests", details.execution.totalTests],
                      ["Passed", details.execution.passed],
                      ["Failed", details.execution.failed],
                      ["Pass Rate", percent(details.execution.passRate)],
                      ["Execution Time", details.execution.executionTime],
                    ]} />
                  </DetailSection>

                  <DetailSection title="Coverage">
                    <MetricGrid items={[
                      ["Coverage", percent(details.coverage.coveragePercent)],
                      ["Functions Covered", details.coverage.functionsCovered],
                      ["Functions Missing", details.coverage.functionsMissing.length],
                    ]} />
                    <p className="text-xs leading-6 text-muted-foreground">{details.coverage.notes}</p>
                    <ListBlock items={details.coverage.functionsMissing} empty="No missing functions recorded." />
                  </DetailSection>

                  <DetailSection title="Human Readable Tests">
                    {details.semanticTests.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No semantic tests recorded.</p>
                    ) : (
                      details.semanticTests.map((suite) => (
                        <article key={`${suite.signature}-${suite.generatedAt}`} className="border border-foreground/20 p-4">
                          <h3 className="text-sm font-semibold uppercase">{suite.signature}</h3>
                          <div className="mt-3 grid gap-3">
                            <ListBlock items={[...suite.unitTests, ...suite.negativeTests, ...suite.edgeCases, ...suite.boundaryCases]} />
                          </div>
                        </article>
                      ))
                    )}
                  </DetailSection>

                  <DetailSection title="Potential Logic Issues">
                    <ListBlock
                      items={details.semanticTests.flatMap((suite) => suite.potentialLogicIssues)}
                      empty="No potential logic issues recorded."
                    />
                  </DetailSection>

                  <DetailSection title="Execution Logs">
                    <div className="max-h-80 overflow-auto bg-foreground p-4 text-background">
                      {details.execution.logs.length ? details.execution.logs.map((log, index) => (
                        <div key={`${log.timestamp}-${index}`} className="grid gap-1 border-b border-background/10 py-2 text-xs last:border-none">
                          <span className="text-background/50">{log.timestamp} / {log.level}</span>
                          <span>{log.message}</span>
                        </div>
                      )) : <p className="text-xs text-background/60">No execution logs recorded.</p>}
                    </div>
                  </DetailSection>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(open) => (open ? setDeleteOpen(true) : closeDelete())}>
        <DialogContent className="rounded-none border-foreground/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
              <ShieldAlert size={16} strokeWidth={1.5} className="text-[#ea580c]" />
              Delete Records
            </DialogTitle>
            <DialogDescription>Oldest execution records are deleted first. Newest records remain.</DialogDescription>
          </DialogHeader>

          {deleteStep === "password" ? (
            <div className="grid gap-4">
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
              {deleteError ? <p className="text-xs uppercase tracking-wider text-red-500">{deleteError}</p> : null}
              <BrutalButton variant="accent" onClick={verifyPassword}>Continue</BrutalButton>
            </div>
          ) : null}

          {deleteStep === "count" ? (
            <div className="grid gap-4">
              <Input type="number" min={1} value={deleteCount} onChange={(event) => setDeleteCount(event.target.value)} placeholder="Number of records" />
              {deleteError ? <p className="text-xs uppercase tracking-wider text-red-500">{deleteError}</p> : null}
              <BrutalButton variant="accent" onClick={verifyCount}>Review Delete</BrutalButton>
            </div>
          ) : null}

          {deleteStep === "confirm" ? (
            <div className="grid gap-4">
              <p className="text-sm">You are about to permanently delete {Number(deleteCount)} records.</p>
              {deleteError ? <p className="text-xs uppercase tracking-wider text-red-500">{deleteError}</p> : null}
              <div className="flex flex-wrap gap-3">
                <BrutalButton variant="accent" onClick={confirmDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Confirm"}
                </BrutalButton>
                <BrutalButton variant="outline" onClick={closeDelete} disabled={deleting}>Cancel</BrutalButton>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
