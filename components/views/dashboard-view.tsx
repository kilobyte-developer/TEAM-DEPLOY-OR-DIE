"use client"

import { motion } from "framer-motion"
import {
  ArrowRight,
  FileCode2,
  Gauge,
  PlayCircle,
  ScrollText,
  Upload,
  Wand2,
} from "lucide-react"
import Link from "next/link"
import { DemoBadge } from "@/components/testgenai/demo-badge"
import { InputModeSelector } from "@/components/testgenai/input-mode-selector"
import { ResultsDashboard } from "@/components/testgenai/results-dashboard"
import { WorkflowVisualization } from "@/components/testgenai/workflow-visualization"
import { useTestGenAI } from "@/components/testgenai-provider"
import { PageHeader, Panel } from "@/components/page-primitives"

const ease = [0.22, 1, 0.36, 1] as const

const ACTIVITY_ICONS = {
  upload: Upload,
  analysis: FileCode2,
  generation: Wand2,
  execution: PlayCircle,
  coverage: Gauge,
}

export function DashboardView() {
  const { state } = useTestGenAI()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Overview"
        subtitle="Automated Test Case Generator Agent"
        actions={<DemoBadge />}
      />

      <InputModeSelector />
      <ResultsDashboard />
      <WorkflowVisualization />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease }}
          className="lg:col-span-2"
        >
          <Panel label="recent.activity" meta="LIVE">
            <ul className="flex flex-col">
              {state.activity.map((item) => {
                const Icon = ACTIVITY_ICONS[item.type]
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-none"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-foreground/20">
                      <Icon size={16} strokeWidth={1.5} className="text-[#ea580c]" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-mono uppercase tracking-wider text-foreground">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{item.detail}</span>
                    </div>
                    <span className="ml-auto text-[10px] tracking-widest uppercase text-muted-foreground">
                      {item.time}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Panel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease }}
        >
          <Panel label="quick.actions">
            <div className="flex flex-col">
              {[
                {
                  href: "/upload",
                  label: state.inputMode === "source-code" ? "Upload Code" : "Write User Story",
                  icon: state.inputMode === "source-code" ? Upload : ScrollText,
                },
                {
                  href: "/generate",
                  label: state.inputMode === "source-code" ? "Generate Tests" : "View Story Cases",
                  icon: Wand2,
                },
                { href: "/execution", label: "Run Tests", icon: PlayCircle },
                { href: "/results", label: "View Coverage", icon: Gauge },
              ].map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3 border-b border-border px-4 py-4 last:border-none hover:bg-foreground/5"
                  >
                    <Icon size={16} strokeWidth={1.5} />
                    <span className="text-xs font-mono uppercase tracking-wider">{action.label}</span>
                    <ArrowRight
                      size={14}
                      strokeWidth={1.5}
                      className="ml-auto text-muted-foreground transition-transform duration-150 group-hover:translate-x-1"
                    />
                  </Link>
                )
              })}
            </div>
          </Panel>
        </motion.div>
      </div>
    </div>
  )
}
