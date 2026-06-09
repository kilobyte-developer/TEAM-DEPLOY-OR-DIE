"use client"

import { AlertTriangle, Loader2, Inbox, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const ICONS = {
  empty: Inbox,
  loading: Loader2,
  error: AlertTriangle,
  success: CheckCircle2,
}

const TONES = {
  empty: "text-muted-foreground",
  loading: "text-[#ea580c]",
  error: "text-destructive",
  success: "text-[#ea580c]",
}

export function StateBlock({
  title,
  message,
  tone = "empty",
  className,
}: {
  title: string
  message: string
  tone?: "empty" | "loading" | "error" | "success"
  className?: string
}) {
  const Icon = ICONS[tone]

  return (
    <div className={cn("flex min-h-52 flex-col items-center justify-center gap-3 px-6 py-8 text-center", className)}>
      <span className={cn("flex h-12 w-12 items-center justify-center border border-foreground/20", TONES[tone])}>
        <Icon size={18} strokeWidth={1.5} className={tone === "loading" ? "animate-spin" : ""} />
      </span>
      <div className="flex max-w-md flex-col gap-1.5">
        <span className="text-xs font-mono uppercase tracking-[0.18em] text-foreground">{title}</span>
        <span className="text-[11px] leading-5 text-muted-foreground">{message}</span>
      </div>
    </div>
  )
}
