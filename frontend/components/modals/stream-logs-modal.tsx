'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui'
import { Terminal, Copy, Check } from 'lucide-react'

interface StreamLogsModalProps {
  isOpen: boolean
  onClose: () => void
}

const mockLogStream = [
  '[00:04:28.102] [SYSTEM] Initializing JOCKY forensic orchestrator on target node us-east-prod-02...',
  '[00:04:28.410] [INJECT] Loading unhooked native syscall table (Windows Kernel 10.0.20348)...',
  '[00:04:29.012] [POLYMORPH] Emitting dynamic intermediate code block #84109 (MD5: 9a8f2c...)',
  '[00:04:29.580] [BYOVD] Scanning active driver handle table for vulnerable kernel callbacks...',
  '[00:04:30.120] [TELEMETRY] Beacon handshake verified via TLS 1.3 encrypted route /api/v1/notify',
  '[00:04:30.890] [AUDIT] In-memory execution verified in trusted process explorer.exe (PID: 4192)',
  '[00:04:31.450] [RUNNER] 18 of 24 target routines evaluated. Pass: 16 | Warning: 2 | Latency: 182ms',
  '[00:04:32.000] [STREAM] Live telemetry heartbeat active. Buffer health 100%.',
]

export function StreamLogsModal({ isOpen, onClose }: StreamLogsModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(mockLogStream.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Live Stream Telemetry Logs"
      description="Raw stdout and execution stream from active runner worker-worker-x9."
      maxWidth="xl"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#656d76] dark:text-[#8b949e] font-mono">
            <span className="size-2 rounded-full bg-[#1a7f37] dark:bg-[#3fb950] animate-pulse" />
            <span>Target: us-east-prod-02</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] px-2.5 py-1 text-[11px] font-medium text-[#1f2328] dark:text-[#c9d1d9] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors shadow-xs cursor-pointer"
          >
            {copied ? <Check className="size-3 text-[#1a7f37] dark:text-[#3fb950]" /> : <Copy className="size-3 text-[#656d76] dark:text-[#8b949e]" />}
            {copied ? 'Copied' : 'Copy Logs'}
          </button>
        </div>

        <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3 font-mono text-[11px] leading-relaxed text-[#7ee787] max-h-64 overflow-y-auto shadow-inner">
          {mockLogStream.map((line, idx) => (
            <div key={idx} className="py-0.5 hover:bg-[#161b22] px-1 rounded transition-colors">
              {line}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-3 border-t border-[#d0d7de] dark:border-[#30363d]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            Close Stream
          </button>
        </div>
      </div>
    </Modal>
  )
}
