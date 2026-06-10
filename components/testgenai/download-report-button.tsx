"use client"

import { Download } from "lucide-react"
import { BrutalButton } from "@/components/page-primitives"
import { useTestGenAI } from "@/components/testgenai-provider"
import { canDownloadReport, downloadTestGenAIReport } from "@/lib/report/html-report"

export function DownloadReportButton() {
  const { state, selectedFile } = useTestGenAI()
  const enabled = canDownloadReport(state)

  return (
    <BrutalButton
      variant="outline"
      icon={<Download size={14} strokeWidth={1.5} />}
      onClick={() => downloadTestGenAIReport({ state, selectedFile })}
      disabled={!enabled}
    >
      Download Report
    </BrutalButton>
  )
}
