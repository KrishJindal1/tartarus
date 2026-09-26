'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui'
import { ForensicRecord } from '@/types'
import {
  ShieldCheck,
  Binary,
  Cpu,
  Terminal,
  FileCode,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/components/ui'

interface ForensicRecordDetailModalProps {
  record: ForensicRecord | null
  isOpen: boolean
  onClose: () => void
}

export function ForensicRecordDetailModal({
  record,
  isOpen,
  onClose,
}: ForensicRecordDetailModalProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  if (!record) return null

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2))
    setCopied(true)
    toast('Copied forensic record JSON to clipboard.', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Forensic Analysis Record: ${record.id}`}
      description={`Target: ${record.targetNode} (${record.targetOS}) · Captured: ${record.timestamp}`}
      maxWidth="xl"
    >
      <div className="flex flex-col gap-4">
        {/* Top Summary Banner */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-lg bg-[#dafbe1] dark:bg-[#238636]/20 border border-[#4ac26b]/40 dark:border-[#238636]/40 p-2.5">
            <span className="text-[10px] uppercase font-bold text-[#1a7f37] dark:text-[#3fb950] tracking-wider block">
              AV Evasion
            </span>
            <span className="text-xs font-bold text-[#1a7f37] dark:text-[#3fb950] mt-0.5 block">
              {record.avEvasionStatus}
            </span>
          </div>

          <div className="rounded-lg bg-[#fbefff] dark:bg-[#8250df]/20 border border-[#d8b9ff]/60 dark:border-[#8250df]/40 p-2.5">
            <span className="text-[10px] uppercase font-bold text-[#8250df] dark:text-[#d2a8ff] tracking-wider block">
              Evasion Technique
            </span>
            <span className="text-xs font-bold text-[#8250df] dark:text-[#d2a8ff] mt-0.5 truncate block font-mono">
              {record.technique}
            </span>
          </div>

          <div className="rounded-lg bg-[#ddf4ff] dark:bg-[#388bfd]/15 border border-[#54aeff]/40 dark:border-[#388bfd]/30 p-2.5">
            <span className="text-[10px] uppercase font-bold text-[#0969da] dark:text-[#58a6ff] tracking-wider block">
              Process Context
            </span>
            <span className="text-xs font-bold text-[#0969da] dark:text-[#58a6ff] mt-0.5 truncate block font-mono">
              {record.processContext} (PID: {record.pid})
            </span>
          </div>
        </div>

        {/* Detailed Investigation Fields */}
        <div className="rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-4 flex flex-col gap-3 text-xs">
          <div>
            <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc] block mb-1">Raw Forensic Summary</span>
            <p className="text-[#656d76] dark:text-[#8b949e] leading-relaxed bg-[#f6f8fa] dark:bg-[#0d1117] p-2.5 rounded border border-[#d0d7de]/80 dark:border-[#30363d]">
              {record.details.rawSummary}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="font-bold text-[#1f2328] dark:text-[#e6edf3] block mb-1">Unhooked Native DLLs</span>
              <div className="flex flex-wrap gap-1">
                {record.details.unhookedDlls.map((dll) => (
                  <span
                    key={dll}
                    className="rounded bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] font-mono text-[10px] px-1.5 py-0.5 text-[#1f2328] dark:text-[#c9d1d9]"
                  >
                    {dll}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="font-bold text-[#1f2328] dark:text-[#e6edf3] block mb-1">Memory Address Space</span>
              <span className="font-mono text-xs text-[#0969da] dark:text-[#58a6ff] font-semibold bg-[#ddf4ff] dark:bg-[#388bfd]/15 px-2 py-0.5 rounded border border-[#54aeff]/40 dark:border-[#388bfd]/30 inline-block">
                {record.details.memoryRegion}
              </span>
            </div>
          </div>

          {record.details.driverCallbackTarget && (
            <div>
              <span className="font-bold text-[#1f2328] dark:text-[#e6edf3] block mb-1">Kernel Driver Callback Hook</span>
              <span className="font-mono text-[11px] text-[#9a6700] dark:text-[#d29922] bg-[#fff8c5] dark:bg-[#d29922]/15 px-2 py-1 rounded border border-[#d4a72c]/40 dark:border-[#d29922]/30 block">
                {record.details.driverCallbackTarget}
              </span>
            </div>
          )}

          <div>
            <span className="font-bold text-[#1f2328] dark:text-[#e6edf3] block mb-1">Mitigation / Evasion Routine</span>
            <p className="text-[#656d76] dark:text-[#8b949e] font-mono text-[11px]">
              {record.details.mitigationAction}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#d0d7de] dark:border-[#30363d]">
          <button
            type="button"
            onClick={handleCopyRaw}
            className="flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] px-3 py-1.5 text-xs font-semibold text-[#1f2328] dark:text-[#c9d1d9] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors shadow-2xs cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-[#1a7f37] dark:text-[#3fb950]" /> : <Copy className="size-3.5 text-[#656d76] dark:text-[#8b949e]" />}
            {copied ? 'Copied JSON' : 'Copy Record JSON'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </Modal>
  )
}
