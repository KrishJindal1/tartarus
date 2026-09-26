'use client'

import React from 'react'
import { Modal } from '@/components/ui'
import { EvidenceItem } from '@/types'

interface EvidencePreviewModalProps {
  evidence: EvidenceItem | null
  isOpen: boolean
  onClose: () => void
}

const mockEvidenceContent: Record<string, string> = {
  'checkout-error.json': JSON.stringify(
    {
      timestamp: '2026-09-25T17:42:19Z',
      event: 'IN_MEMORY_BEACON_FAILED',
      target_pid: 4192,
      process: 'explorer.exe',
      syscall: 'NtProtectVirtualMemory',
      status: 'ACCESS_VIOLATION_HANDLED',
      mitigation: 'Dynamic polymorphic routine regeneration triggered',
    },
    null,
    2
  ),
  'response-payload.json': JSON.stringify(
    {
      status: 200,
      target: 'us-east-prod-02',
      memory_state: 'CLEAN',
      driver_callbacks: 'DISARMED',
      unhooked_dlls: ['ntdll.dll', 'kernel32.dll'],
    },
    null,
    2
  ),
  'deploy-log.txt': `[DEPLOY START] 2026-09-25 17:02:11
Target Node: us-east-prod-02 (Ubuntu 24.04 LTS)
Injecting polymorphic runtime: regression-suite (v1.8.2)
Zero-downtime cache updated.
Smoke test status: PASSED (16/16 tests)`,
  'latency-sample.csv': `timestamp,endpoint,latency_ms,status
2026-09-25T17:40:00Z,/api/v1/checkout,182,200
2026-09-25T17:40:05Z,/api/v1/users/12,96,200
2026-09-25T17:40:10Z,/api/v1/notify,1410,504`,
}

export function EvidencePreviewModal({
  evidence,
  isOpen,
  onClose,
}: EvidencePreviewModalProps) {
  if (!evidence) return null

  const content =
    mockEvidenceContent[evidence.fileName] ||
    `[FORENSIC EVIDENCE ARTIFACT]\nFile: ${evidence.fileName}\nSize: ${evidence.size}\nCaptured: ${evidence.captureTime}\nStatus: Immutable Sealed Memory Dump (Read-Only)`

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Artifact Preview: ${evidence.fileName}`}
      description={`${evidence.captureTime} · Size: ${evidence.size}`}
      maxWidth="xl"
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4 font-mono text-xs text-[#7ee787] max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
          {content}
        </div>

        <div className="flex justify-end pt-3 border-t border-[#d0d7de] dark:border-[#30363d]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </Modal>
  )
}
