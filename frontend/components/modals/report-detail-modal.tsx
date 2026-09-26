'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui'
import { ReportItem } from '@/types'
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Binary,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { useToast } from '@/components/ui'

interface ReportDetailModalProps {
  report: ReportItem | null
  isOpen: boolean
  onClose: () => void
}

export function ReportDetailModal({
  report,
  isOpen,
  onClose,
}: ReportDetailModalProps) {
  const { toast } = useToast()

  if (!report) return null

  const handleDownloadPDF = () => {
    toast(`Exporting executive PDF summary for "${report.title}"...`, 'success')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={report.title}
      description={`Cluster: ${report.targetCluster} · Generated: ${report.executionTime}`}
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4">
        {/* KPI Header Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-lg bg-[#dafbe1] dark:bg-[#238636]/20 border border-[#4ac26b]/40 dark:border-[#238636]/40 p-2.5">
            <span className="text-[10px] uppercase font-bold text-[#1a7f37] dark:text-[#3fb950] tracking-wider block">
              AV Detection Score
            </span>
            <span className="text-xs font-bold text-[#1a7f37] dark:text-[#3fb950] mt-0.5 block truncate">
              {report.avDetectionScore}
            </span>
          </div>

          <div className="rounded-lg bg-[#ddf4ff] dark:bg-[#388bfd]/15 border border-[#54aeff]/40 dark:border-[#388bfd]/30 p-2.5">
            <span className="text-[10px] uppercase font-bold text-[#0969da] dark:text-[#58a6ff] tracking-wider block">
              Records Extracted
            </span>
            <span className="text-base font-bold text-[#0969da] dark:text-[#58a6ff] mt-0.5 block">
              {report.recordsExtracted.toLocaleString()}
            </span>
          </div>

          <div className="rounded-lg bg-[#fff8c5] dark:bg-[#d29922]/15 border border-[#d4a72c]/40 dark:border-[#d29922]/30 p-2.5">
            <span className="text-[10px] uppercase font-bold text-[#9a6700] dark:text-[#d29922] tracking-wider block">
              Critical Findings
            </span>
            <span className="text-base font-bold text-[#9a6700] dark:text-[#d29922] mt-0.5 block">
              {report.criticalFindings}
            </span>
          </div>

          <div className="rounded-lg bg-[#fbefff] dark:bg-[#8250df]/20 border border-[#d8b9ff]/60 dark:border-[#8250df]/40 p-2.5">
            <span className="text-[10px] uppercase font-bold text-[#8250df] dark:text-[#d2a8ff] tracking-wider block">
              Report Status
            </span>
            <span className="text-xs font-bold text-[#8250df] dark:text-[#d2a8ff] mt-0.5 block">
              {report.status}
            </span>
          </div>
        </div>

        {/* Executive Summary Section */}
        <div className="rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-4 flex flex-col gap-3 text-xs">
          <div>
            <h4 className="font-bold text-[#1f2328] dark:text-[#f0f6fc] text-xs mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-[#0969da] dark:text-[#58a6ff]" /> Executive Summary
            </h4>
            <p className="text-[#1f2328] dark:text-[#e6edf3] leading-relaxed bg-[#f6f8fa] dark:bg-[#0d1117] p-3.5 rounded-lg border border-[#d0d7de]/80 dark:border-[#30363d] text-xs">
              {report.executiveSummary}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#1f2328] dark:text-[#f0f6fc] text-xs mb-1.5 flex items-center gap-1.5">
              <Binary className="size-4 text-[#8250df] dark:text-[#d2a8ff]" /> Evasion & Extraction Methodology
            </h4>
            <pre className="bg-[#0d1117] text-[#7ee787] font-mono text-xs leading-relaxed p-3.5 rounded-lg border border-[#30363d] whitespace-pre-wrap shadow-inner selection:bg-[#238636] selection:text-white">
              {report.methodology}
            </pre>
          </div>

          <div>
            <h4 className="font-bold text-[#1f2328] dark:text-[#f0f6fc] text-xs mb-1.5">
              Associated Forensic Evidence Artifacts
            </h4>
            <div className="flex flex-wrap gap-2">
              {report.evidenceArtifacts.map((artifact) => (
                <span
                  key={artifact}
                  className="inline-flex items-center gap-1 rounded bg-[#ddf4ff] dark:bg-[#388bfd]/15 border border-[#54aeff]/40 dark:border-[#388bfd]/30 px-2.5 py-1 text-[11px] font-mono font-medium text-[#0969da] dark:text-[#58a6ff]"
                >
                  <FileText className="size-3 text-[#0969da] dark:text-[#58a6ff]" />
                  {artifact}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-[#1f2328] dark:text-[#f0f6fc] text-xs mb-1.5">
              Remediation & Investigative Next Steps
            </h4>
            <ul className="list-disc list-inside flex flex-col gap-1 text-[#1f2328] dark:text-[#e6edf3] pl-1">
              {report.recommendations.map((rec, idx) => (
                <li key={idx} className="leading-snug">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#d0d7de] dark:border-[#30363d]">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] px-3.5 py-2 text-xs font-semibold text-[#1f2328] dark:text-[#c9d1d9] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="size-3.5 text-[#656d76] dark:text-[#8b949e]" /> Download Full PDF Deliverable
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            Close Report Viewer
          </button>
        </div>
      </div>
    </Modal>
  )
}
