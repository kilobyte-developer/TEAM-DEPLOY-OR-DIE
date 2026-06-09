"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UploadCloud, FileCode, Trash2, ScanLine, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { PageHeader, Panel, BrutalButton } from "@/components/page-primitives"
import { uploadedFiles as seedFiles, type UploadedFile } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const ease = [0.22, 1, 0.36, 1] as const

const LANG_MAP: Record<string, string> = {
  py: "Python",
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  java: "Java",
  go: "Go",
  rb: "Ruby",
  cpp: "C++",
  c: "C",
  cs: "C#",
  rs: "Rust",
}

function detectLanguage(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  return LANG_MAP[ext] ?? "Unknown"
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STATUS_META: Record<UploadedFile["status"], { color: string; icon: typeof Clock }> = {
  Uploaded: { color: "text-muted-foreground", icon: Clock },
  Analyzing: { color: "text-[#ea580c]", icon: Loader2 },
  Analyzed: { color: "text-[#ea580c]", icon: CheckCircle2 },
  Failed: { color: "text-destructive", icon: Clock },
}

export function UploadView() {
  const [files, setFiles] = useState<UploadedFile[]>(seedFiles)
  const [selectedId, setSelectedId] = useState<string | null>(seedFiles[0]?.id ?? null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return
    const next: UploadedFile[] = Array.from(fileList).map((f, i) => ({
      id: `u${Date.now()}-${i}`,
      name: f.name,
      language: detectLanguage(f.name),
      size: formatSize(f.size),
      status: "Uploaded",
    }))
    setFiles((prev) => [...next, ...prev])
    if (next[0]) setSelectedId(next[0].id)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const runAnalysis = () => {
    setFiles((prev) => prev.map((f) => ({ ...f, status: "Analyzed" })))
  }

  const selected = files.find((f) => f.id === selectedId) ?? null

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Code Upload"
        subtitle="Upload source files for analysis"
        actions={
          <BrutalButton variant="accent" icon={<ScanLine size={14} strokeWidth={2} />} onClick={runAnalysis}>
            Generate Analysis
          </BrutalButton>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Dropzone + file list */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-14 text-center transition-colors duration-150",
              dragging ? "border-[#ea580c] bg-[#ea580c]/5" : "border-foreground/30 hover:border-foreground/50",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <UploadCloud size={28} strokeWidth={1.5} className="text-[#ea580c]" />
            <span className="text-sm font-mono uppercase tracking-wider text-foreground">
              Drag &amp; drop source files
            </span>
            <span className="text-[11px] tracking-wider text-muted-foreground">
              or click to browse — .py .ts .js .java .go .rb
            </span>
          </div>

          <Panel label="uploaded.files" meta={`${files.length} FILES`}>
            {/* table header */}
            <div className="grid grid-cols-12 gap-2 border-b border-border px-4 py-2.5">
              <span className="col-span-5 text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                File Name
              </span>
              <span className="col-span-3 text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                Language
              </span>
              <span className="col-span-2 text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                Size
              </span>
              <span className="col-span-2 text-[9px] tracking-[0.15em] uppercase text-muted-foreground text-right">
                Status
              </span>
            </div>
            <AnimatePresence initial={false}>
              {files.map((file) => {
                const StatusIcon = STATUS_META[file.status].icon
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease }}
                    onClick={() => setSelectedId(file.id)}
                    className={cn(
                      "grid cursor-pointer grid-cols-12 items-center gap-2 border-b border-border px-4 py-3 last:border-none hover:bg-foreground/5",
                      selectedId === file.id && "bg-foreground/5",
                    )}
                  >
                    <div className="col-span-5 flex items-center gap-2">
                      <FileCode size={14} strokeWidth={1.5} className="shrink-0 text-muted-foreground" />
                      <span className="truncate text-xs font-mono text-foreground">{file.name}</span>
                    </div>
                    <span className="col-span-3 text-xs font-mono text-muted-foreground">{file.language}</span>
                    <span className="col-span-2 text-xs font-mono text-muted-foreground">{file.size}</span>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <StatusIcon
                        size={13}
                        strokeWidth={1.5}
                        className={cn(STATUS_META[file.status].color, file.status === "Analyzing" && "animate-spin")}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(file.id)
                        }}
                        aria-label={`Remove ${file.name}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </Panel>
        </div>

        {/* File details */}
        <Panel label="file.details">
          {selected ? (
            <div className="flex flex-col">
              {[
                { k: "File Name", v: selected.name },
                { k: "Language Detected", v: selected.language },
                { k: "File Size", v: selected.size },
                { k: "Upload Status", v: selected.status },
              ].map((row) => (
                <div key={row.k} className="flex flex-col gap-1 border-b border-border px-4 py-4 last:border-none">
                  <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">{row.k}</span>
                  <span className="text-sm font-mono text-foreground">{row.v}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-40 items-center justify-center p-6">
              <span className="text-[11px] tracking-wider uppercase text-muted-foreground">
                Select a file to view details
              </span>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
