"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

const ease = [0.22, 1, 0.36, 1] as const

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="flex flex-col gap-4 border-b border-foreground/20 pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="flex flex-col gap-2">
        <span className="text-[10px] tracking-[0.25em] uppercase text-[#ea580c]">
          {"// TESTGENAI"}
        </span>
        <h1 className="font-pixel text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-xs font-mono tracking-wider uppercase text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </motion.div>
  )
}

export function Panel({
  label,
  meta,
  children,
  className = "",
}: {
  label: string
  meta?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col border border-foreground/20 bg-background ${className}`}>
      <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
        <span className="text-[10px] tracking-widest uppercase text-muted-foreground">{label}</span>
        {meta ? <div className="text-[10px] tracking-widest uppercase text-muted-foreground">{meta}</div> : null}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function BrutalButton({
  children,
  variant = "solid",
  onClick,
  type = "button",
  disabled,
  icon,
}: {
  children: ReactNode
  variant?: "solid" | "outline" | "accent"
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  icon?: ReactNode
}) {
  const styles = {
    solid: "bg-foreground text-background hover:bg-foreground/90",
    outline: "border border-foreground/30 text-foreground hover:bg-foreground/5",
    accent: "bg-[#ea580c] text-white hover:bg-[#ea580c]/90",
  }[variant]

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono tracking-widest uppercase transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${styles}`}
    >
      {icon}
      {children}
    </motion.button>
  )
}
