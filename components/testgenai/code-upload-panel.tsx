"use client"

import { useRef, useState } from "react"
import { CheckCircle2, Clock3, FileCode2, Loader2, ScanLine, Trash2, UploadCloud } from "lucide-react"
import { BrutalButton, Panel } from "@/components/page-primitives"
import { StateBlock } from "@/components/testgenai/state-block"
import { useTestGenAI } from "@/components/testgenai-provider"
import { SOURCE_CODE_ACCEPT } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { UploadStatus } from "@/lib/testgenai-types"

const STATUS_ICON: Record<UploadStatus, typeof Clock3> = {
  Queued: Clock3,
  Uploading: Loader2,
  Uploaded: CheckCircle2,
  Analyzing: Loader2,
  Analyzed: CheckCircle2,
  Failed: Clock3,
}

const STATUS_STYLE: Record<UploadStatus, string> = {
  Queued: "text-muted-foreground",
  Uploading: "text-[#ea580c]",
  Uploaded: "text-[#ea580c]",
  Analyzing: "text-[#ea580c]",
  Analyzed: "text-[#ea580c]",
  Failed: "text-destructive",
}

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp))
}

export function CodeUploadPanel() {
  const { state, selectedFile, uploadFiles, removeFile, setSelectedFileId, analyzeWorkspace } = useTestGenAI()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleUpload = async (files: FileList | null) => {
    await uploadFiles(files)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            void handleUpload(event.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-14 text-center transition-colors duration-150",
            dragging ? "border-[#ea580c] bg-[#ea580c]/5" : "border-foreground/30 hover:border-foreground/50",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={SOURCE_CODE_ACCEPT}
            multiple
            className="hidden"
            onChange={(event) => void handleUpload(event.target.files)}
          />
          <UploadCloud size={28} strokeWidth={1.5} className="text-[#ea580c]" />
          <span className="text-sm font-mono uppercase tracking-wider text-foreground">
            Drag and drop source files
          </span>
          <span className="text-[11px] tracking-wider text-muted-foreground">
            Click to browse and prepare a future POST /upload integration.
          </span>
        </div>

        <Panel
          label="code.upload.panel"
          meta={state.uploadStatus === "loading" ? "UPLOADING" : `${state.uploadedFiles.length} FILES`}
        >
          {state.uploadedFiles.length === 0 ? (
            <StateBlock
              title="No source code uploaded."
              message="Upload Python, TypeScript, JavaScript, Java, Go, or other supported files to begin analysis."
            />
          ) : (
            <>
              <div className="grid grid-cols-12 gap-2 border-b border-border px-4 py-2.5">
                <span className="col-span-4 text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                  File Name
                </span>
                <span className="col-span-2 text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                  Language
                </span>
                <span className="col-span-2 text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                  Size
                </span>
                <span className="col-span-2 text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                  Uploaded
                </span>
                <span className="col-span-2 text-right text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                  Status
                </span>
              </div>
              <div className="flex flex-col">
                {state.uploadedFiles.map((file) => {
                  const StatusIcon = STATUS_ICON[file.status]
                  return (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      className={cn(
                        "grid grid-cols-12 items-center gap-2 border-b border-border px-4 py-3 text-left transition-colors duration-150 last:border-none hover:bg-foreground/5",
                        selectedFile?.id === file.id && "bg-foreground/5",
                      )}
                    >
                      <div className="col-span-4 flex items-center gap-2">
                        <FileCode2 size={14} strokeWidth={1.5} className="shrink-0 text-muted-foreground" />
                        <span className="truncate text-xs font-mono text-foreground">{file.name}</span>
                      </div>
                      <span className="col-span-2 text-xs font-mono text-muted-foreground">{file.language}</span>
                      <span className="col-span-2 text-xs font-mono text-muted-foreground">{file.sizeLabel}</span>
                      <span className="col-span-2 text-xs font-mono text-muted-foreground">{formatTimestamp(file.uploadedAt)}</span>
                      <span className="col-span-2 flex items-center justify-end gap-2">
                        <StatusIcon
                          size={13}
                          strokeWidth={1.5}
                          className={cn(STATUS_STYLE[file.status], file.status === "Uploading" || file.status === "Analyzing" ? "animate-spin" : "")}
                        />
                        <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{file.status}</span>
                        <span
                          onClick={(event) => {
                            event.stopPropagation()
                            removeFile(file.id)
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </Panel>
      </div>

      <Panel label="file.metadata" meta={selectedFile ? selectedFile.language : "READY"}>
        {selectedFile ? (
          <div className="flex h-full flex-col justify-between">
            <div className="flex flex-col">
              {[
                { label: "File Name", value: selectedFile.name },
                { label: "Language Detected", value: selectedFile.language },
                { label: "Upload Timestamp", value: formatTimestamp(selectedFile.uploadedAt) },
                { label: "File Size", value: selectedFile.sizeLabel },
                { label: "Repository", value: selectedFile.repository },
                { label: "Upload Status", value: selectedFile.status },
              ].map((row) => (
                <div key={row.label} className="flex flex-col gap-1 border-b border-border px-4 py-4 last:border-none">
                  <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground">{row.label}</span>
                  <span className="text-sm font-mono text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-4">
              <BrutalButton
                variant="accent"
                icon={<ScanLine size={14} strokeWidth={1.5} />}
                onClick={() => void analyzeWorkspace()}
                disabled={state.uploadedFiles.length === 0 || state.analysis.status === "loading"}
              >
                {state.analysis.status === "loading" ? "Analyzing Code..." : "Analyze Workspace"}
              </BrutalButton>
            </div>
          </div>
        ) : (
          <StateBlock
            title="No file selected."
            message="Select an uploaded file to review metadata, then launch the next analysis step."
          />
        )}
      </Panel>
    </div>
  )
}
