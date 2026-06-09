"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

export function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  accent = false,
  index = 0,
}: {
  label: string
  value: string | number
  suffix?: string
  icon: LucideIcon
  accent?: boolean
  index?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease }}
      className="flex flex-col border border-foreground/20 bg-background p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">{label}</span>
        <Icon size={16} strokeWidth={1.5} className={accent ? "text-[#ea580c]" : "text-foreground"} />
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span
          className="text-3xl lg:text-4xl font-mono font-bold tracking-tight text-foreground"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </span>
        {suffix ? <span className="text-sm font-mono text-muted-foreground">{suffix}</span> : null}
      </div>
    </motion.div>
  )
}
