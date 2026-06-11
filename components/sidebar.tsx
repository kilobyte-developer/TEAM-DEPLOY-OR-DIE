"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Upload,
  Wand2,
  PlayCircle,
  BarChart3,
  Gauge,
  FlaskConical,
  History,
  Menu,
  PieChart,
  X,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard, code: "01" },
  { href: "/upload", label: "Input Workspace", icon: Upload, code: "02" },
  { href: "/generate", label: "Generator", icon: Wand2, code: "03" },
  { href: "/execution", label: "Execution", icon: PlayCircle, code: "04" },
  { href: "/results", label: "Coverage", icon: BarChart3, code: "05" },
  { href: "/metrics", label: "Evaluation", icon: Gauge, code: "06" },
  { href: "/history", label: "Past Records", icon: History, code: "07" },
  { href: "/dashboard", label: "Dashboard", icon: PieChart, code: "08" },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 border border-transparent px-3 py-2.5 transition-colors duration-150",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:border-foreground/20 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "text-[10px] tracking-widest",
                active ? "text-background/60" : "text-muted-foreground/60",
              )}
            >
              {item.code}
            </span>
            <Icon size={16} strokeWidth={1.5} />
            <span className="text-xs font-mono tracking-wider uppercase">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-foreground/20 bg-background/90 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <FlaskConical size={16} strokeWidth={1.5} className="text-[#ea580c]" />
          <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold">TestGenAI</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="flex h-8 w-8 items-center justify-center border border-foreground/20"
          >
            <Menu size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4"
          >
            <div className="flex items-center justify-between border-b border-foreground/20 pb-3">
              <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold">TestGenAI</span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="flex h-8 w-8 items-center justify-center border border-foreground/20"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>
            <div className="mt-6">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-foreground/20 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-foreground/20 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <FlaskConical size={18} strokeWidth={1.5} className="text-[#ea580c]" />
            <div className="flex flex-col">
              <span className="text-sm font-mono tracking-[0.12em] uppercase font-bold leading-none">
                TestGenAI
              </span>
              <span className="mt-1 text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                Test Agent
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <span className="mb-3 block px-3 text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Workflow
          </span>
          <NavLinks />
        </div>

        <div className="border-t border-foreground/20 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-[#ea580c]" />
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
              Agent Online
            </span>
          </div>
          <span className="mt-1 block text-[9px] tracking-wider text-muted-foreground/60">
            v0.1.0 — HACKATHON BUILD
          </span>
        </div>
      </aside>
    </>
  )
}
