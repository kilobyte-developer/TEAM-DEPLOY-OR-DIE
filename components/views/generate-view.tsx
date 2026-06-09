"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Wand2, RefreshCw, Save, FunctionSquare, ArrowRight } from "lucide-react"
import { PageHeader, Panel, BrutalButton } from "@/components/page-primitives"
import { CodeViewer } from "@/components/code-viewer"
import { detectedFunctions, unitTestCode, edgeTestCode } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const ease = [0.22, 1, 0.36, 1] as const

export function GenerateView() {
  const [tab, setTab] = useState<"unit" | "edge">("unit")
  const [generated, setGenerated] = useState(true)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="AI Test Generation"
        subtitle="Generate unit & edge-case tests from detected functions"
        actions={
          <>
            <BrutalButton
              variant="accent"
              icon={<Wand2 size={14} strokeWidth={2} />}
              onClick={() => setGenerated(true)}
            >
              Generate Tests
            </BrutalButton>
            <BrutalButton variant="outline" icon={<RefreshCw size={14} strokeWidth={1.5} />}>
              Regenerate
            </BrutalButton>
            <BrutalButton variant="solid" icon={<Save size={14} strokeWidth={1.5} />}>
              Save Test File
            </BrutalButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Detected functions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          <Panel label="detected.functions" meta={`${detectedFunctions.length} FOUND`}>
            <div className="flex flex-col">
              {detectedFunctions.map((fn) => (
                <div key={fn.name} className="flex flex-col gap-2 border-b border-border px-4 py-4 last:border-none">
                  <div className="flex items-center gap-2">
                    <FunctionSquare size={14} strokeWidth={1.5} className="text-[#ea580c]" />
                    <span className="text-xs font-mono font-bold text-foreground">{fn.name}()</span>
                  </div>
                  <div className="flex flex-col gap-1 pl-6">
                    {fn.params.map((p) => (
                      <div key={p.name} className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-muted-foreground">{p.name}</span>
                        <span className="text-muted-foreground/50">:</span>
                        <span className="text-foreground">{p.type}</span>
                      </div>
                    ))}
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono">
                      <ArrowRight size={11} strokeWidth={1.5} className="text-muted-foreground" />
                      <span className="text-[#ea580c]">{fn.returnType ?? "void"}</span>
                    </div>
                  </div>
                  <span className="pl-6 text-[10px] tracking-wider uppercase text-muted-foreground/60">
                    {fn.file}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>

        {/* Generated test cases */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease }}
          className="flex flex-col gap-4 lg:col-span-2"
        >
          {/* tab switch */}
          <div className="flex border border-foreground/20">
            {[
              { id: "unit" as const, label: "Unit Tests" },
              { id: "edge" as const, label: "Edge Case Tests" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex-1 px-4 py-3 text-xs font-mono uppercase tracking-widest transition-colors duration-150",
                  tab === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {generated ? (
            tab === "unit" ? (
              <CodeViewer code={unitTestCode} filename="test_payment_utils.py" />
            ) : (
              <CodeViewer code={edgeTestCode} filename="test_payment_utils_edge.py" />
            )
          ) : (
            <div className="flex min-h-60 items-center justify-center border border-dashed border-foreground/30">
              <span className="text-[11px] tracking-wider uppercase text-muted-foreground">
                Press Generate Tests to begin
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
