'use client'

import React from 'react'
import { Modal } from '@/components/ui'
import { RiskBadge, JsonTree } from '@/components/dashboard'
import { relTime, formatBytes } from '@/providers/dashboard-provider'
import type { EvidenceView } from '@/types'

interface EvidencePreviewModalProps {
  evidence: EvidenceView | null
  isOpen: boolean
  onClose: () => void
  onDownload?: (item: EvidenceView) => void
}

export function EvidencePreviewModal({
  evidence,
  isOpen,
  onClose,
  onDownload,
}: EvidencePreviewModalProps) {
  if (!evidence) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Evidence · ${evidence.type}`}
      description={`Captured from ${evidence.hostname ?? 'unknown host'}${
        evidence.jobId ? ` · job ${evidence.jobId.slice(0, 8).toUpperCase()}` : ''
      }`}
      maxWidth="3xl"
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] p-2">
            <div className="text-[9px] uppercase font-bold text-[#8b949e]">Risk</div>
            <div className="mt-1">
              <RiskBadge score={evidence.riskScore} />
            </div>
          </div>
          <div className="rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] p-2">
            <div className="text-[9px] uppercase font-bold text-[#8b949e]">Size</div>
            <div className="mt-1 font-bold font-mono">{formatBytes(evidence.size)}</div>
          </div>
          <div className="rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] p-2">
            <div className="text-[9px] uppercase font-bold text-[#8b949e]">Collected</div>
            <div className="mt-1 font-bold">{relTime(evidence.collectedAt)}</div>
          </div>
          <div className="rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] p-2">
            <div className="text-[9px] uppercase font-bold text-[#8b949e]">Integrity</div>
            <div
              className="mt-1 font-mono font-bold truncate"
              title={evidence.sha256 ?? undefined}
            >
              {evidence.sha256 ? `${evidence.sha256.slice(0, 16)}…` : 'pending'}
            </div>
          </div>
        </div>

        <div className="rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#0C0E11] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#24282F] px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e]">
              artifact.json
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono text-[#656d76] dark:text-[#8b949e]">
                click rows to expand
              </span>
              {onDownload && (
                <button
                  type="button"
                  onClick={() => onDownload(evidence)}
                  className="text-[10px] font-bold text-[#2DD4BF] hover:underline cursor-pointer"
                >
                  Download
                </button>
              )}
            </div>
          </div>
          <div className="p-3 max-h-[320px] overflow-auto text-[11px] leading-5 text-[#e6edf3] break-words">
            <JsonTree data={evidence.data} defaultExpandedDepth={2} />
          </div>
        </div>
      </div>
    </Modal>
  )
}
