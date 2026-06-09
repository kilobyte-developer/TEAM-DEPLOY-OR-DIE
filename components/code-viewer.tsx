"use client"

import { useState } from "react"
import { Check, Copy, Maximize2, X } from "lucide-react"

function CodeFrame({
  code,
  filename,
  copied,
  onCopy,
  onExpand,
  meta,
  expanded = false,
}: {
  code: string
  filename: string
  copied: boolean
  onCopy: () => void
  onExpand: () => void
  meta?: string
  expanded?: boolean
}) {
  const lines = code.split("\n")

  return (
    <div className="flex flex-col border border-foreground/20 bg-background">
      <div className="flex items-center justify-between border-b-2 border-foreground bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-[#ea580c]" />
          <span className="text-[10px] tracking-widest uppercase text-muted-foreground">{filename}</span>
          {meta ? <span className="text-[10px] tracking-widest uppercase text-muted-foreground/70">{meta}</span> : null}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onExpand}
            className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground"
          >
            {expanded ? <X size={12} strokeWidth={1.5} /> : <Maximize2 size={12} strokeWidth={1.5} />}
            {expanded ? "Close" : "Expand"}
          </button>
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check size={12} strokeWidth={2} className="text-[#ea580c]" /> : <Copy size={12} strokeWidth={1.5} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto bg-foreground">
        <pre className="p-4 text-xs leading-relaxed">
          <code className="font-mono">
            {lines.map((line, index) => (
              <div key={index} className="flex">
                <span className="mr-4 inline-block w-8 shrink-0 select-none text-right text-background/40">
                  {index + 1}
                </span>
                <span className="whitespace-pre text-background/90">{line || " "}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}

export function CodeViewer({
  code,
  filename,
  meta,
}: {
  code: string
  filename: string
  meta?: string
}) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <>
      <CodeFrame code={code} filename={filename} copied={copied} onCopy={copy} onExpand={() => setExpanded(true)} meta={meta} />
      {expanded ? (
        <div className="fixed inset-0 z-50 bg-background/95 p-4 backdrop-blur-sm lg:p-8">
          <CodeFrame
            code={code}
            filename={filename}
            copied={copied}
            onCopy={copy}
            onExpand={() => setExpanded(false)}
            meta={meta}
            expanded
          />
        </div>
      ) : null}
    </>
  )
}
