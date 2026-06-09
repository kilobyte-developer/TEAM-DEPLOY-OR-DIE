"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

export function CodeViewer({ code, filename }: { code: string; filename: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  const lines = code.split("\n")

  return (
    <div className="flex flex-col border border-foreground/20">
      <div className="flex items-center justify-between border-b-2 border-foreground bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-[#ea580c]" />
          <span className="text-[10px] tracking-widest uppercase text-muted-foreground">{filename}</span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check size={12} strokeWidth={2} className="text-[#ea580c]" /> : <Copy size={12} strokeWidth={1.5} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="overflow-x-auto bg-foreground">
        <pre className="p-4 text-xs leading-relaxed">
          <code className="font-mono">
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span className="mr-4 inline-block w-6 shrink-0 select-none text-right text-background/40">
                  {i + 1}
                </span>
                <span className="text-background/90 whitespace-pre">{line || " "}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}
