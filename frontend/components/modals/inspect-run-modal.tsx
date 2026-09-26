'use client'

import React from 'react'
import { Modal } from '@/components/ui'
import { CheckCircle2, AlertTriangle, Clock, Activity, ShieldCheck } from 'lucide-react'

interface RunTelemetry {
  passRate: string
  warnings: number
  duration: string
  status: 'Passed' | 'Running' | 'Warning' | 'Failed'
  findings: Array<{
    title: string
    description: string
    type: 'success' | 'warning' | 'info'
  }>
}

const runTelemetryMap: Record<string, RunTelemetry> = {
  'mem_dump.go': {
    passRate: '100%',
    warnings: 0,
    duration: '48s',
    status: 'Passed',
    findings: [
      {
        title: 'VAD Tree Traversal Completed',
        description: 'Scanned 14 Virtual Address Descriptors with executable protection flags; 0 EDR hooks tripped.',
        type: 'success',
      },
      {
        title: 'Heap Dump Stream Validated',
        description: 'Zero-copy ring buffer captured 412 MB of in-memory process payload across target nodes.',
        type: 'success',
      },
    ],
  },
  'proc_hollow_scan.go': {
    passRate: '98.6%',
    warnings: 1,
    duration: '1m 04s',
    status: 'Running',
    findings: [
      {
        title: 'C2 Named Pipe Descriptors',
        description: 'Identified 3 outbound anonymous named pipe handles matching Cobalt Strike malleable profiles.',
        type: 'success',
      },
      {
        title: 'PE Header Entry Point Deviation',
        description: 'Process base address entry point unaligned with disk image signature in svchost.exe context.',
        type: 'warning',
      },
    ],
  },
  'kernel_enum.go': {
    passRate: '100%',
    warnings: 0,
    duration: '1m 12s',
    status: 'Passed',
    findings: [
      {
        title: 'Kernel Callback Notification Routine',
        description: 'Enumerated 8 kernel callbacks in PspCreateProcessNotifyRoutine array; isolated 1 unregistered stub.',
        type: 'success',
      },
      {
        title: 'DKOM EPROCESS Integrity Check',
        description: 'Kernel ActiveProcessLinks traversed and verified against unlinked thread pools.',
        type: 'success',
      },
    ],
  },
  'registry_forensic.go': {
    passRate: '96.1%',
    warnings: 2,
    duration: '35s',
    status: 'Warning',
    findings: [
      {
        title: 'Null-Byte Key Persistence Located',
        description: 'Extracted 1 null-byte padded Run key persistence entry hidden in HKLM\\Software\\Microsoft\\Windows.',
        type: 'warning',
      },
      {
        title: 'ShimCache Execution Log Discrepancy',
        description: 'Minor non-critical timestamp skew detected on 2 legacy execution records in System hive.',
        type: 'warning',
      },
    ],
  },
  'net_pcap.go': {
    passRate: '100%',
    warnings: 0,
    duration: '2m 04s',
    status: 'Passed',
    findings: [
      {
        title: 'DNS Tunneling Exfiltration Channel',
        description: 'Detected high-entropy base64 TXT query bursts routing to external staging authoritative nameserver.',
        type: 'success',
      },
      {
        title: 'Raw Socket Capture Disarmed',
        description: 'In-memory packet capture completed cleanly without triggering Npcap/WinPcap kernel driver alerts.',
        type: 'success',
      },
    ],
  },
  'api_unhook.go': {
    passRate: '100%',
    warnings: 0,
    duration: '19s',
    status: 'Passed',
    findings: [
      {
        title: 'Reflective Native Syscall Stubs',
        description: 'Restored 12 inline hook trampolines in ntdll.dll and kernel32.dll from clean disk baseline.',
        type: 'success',
      },
      {
        title: 'Dynamic SSN Resolution',
        description: 'Synthesized dynamic system service numbers for kernel gate dispatch without triggering AV hooks.',
        type: 'success',
      },
    ],
  },
}

interface InspectRunModalProps {
  runName: string | null
  isOpen: boolean
  onClose: () => void
}

export function InspectRunModal({ runName, isOpen, onClose }: InspectRunModalProps) {
  if (!runName) return null

  const telemetry = runTelemetryMap[runName] || {
    passRate: '100%',
    warnings: 0,
    duration: '42s',
    status: 'Passed' as const,
    findings: [
      {
        title: `${runName} Inspection Telemetry`,
        description: 'Subroutine completed execution across target endpoints with zero EDR detection alerts.',
        type: 'success' as const,
      },
    ],
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Run Inspection: ${runName}`}
      description="Detailed telemetry and diagnostic findings captured during execution."
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4">
        {/* Metric Overview */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-3">
            <span className="text-xl font-bold font-mono text-[#1a7f37] dark:text-[#3fb950] block">
              {telemetry.passRate}
            </span>
            <span className="block text-[11px] text-[#656d76] dark:text-[#8b949e] font-semibold mt-0.5">
              Pass Rate
            </span>
          </div>

          <div className="rounded-lg bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-3">
            <span className={`text-xl font-bold font-mono block ${
              telemetry.warnings > 0 ? 'text-[#9a6700] dark:text-[#d29922]' : 'text-[#1f2328] dark:text-[#f0f6fc]'
            }`}>
              {telemetry.warnings}
            </span>
            <span className="block text-[11px] text-[#656d76] dark:text-[#8b949e] font-semibold mt-0.5">
              Warnings
            </span>
          </div>

          <div className="rounded-lg bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-3">
            <span className="text-xl font-bold font-mono text-[#1f2328] dark:text-[#f0f6fc] block">
              {telemetry.duration}
            </span>
            <span className="block text-[11px] text-[#656d76] dark:text-[#8b949e] font-semibold mt-0.5">
              Duration
            </span>
          </div>
        </div>

        {/* Diagnostic Execution Findings */}
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc]">
            Diagnostic Findings & Telemetry ({telemetry.findings.length})
          </h4>
          <div className="rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] divide-y divide-[#d0d7de]/60 dark:divide-[#30363d] text-xs">
            {telemetry.findings.map((f, idx) => (
              <div key={idx} className="p-3 flex items-start gap-2.5">
                {f.type === 'warning' ? (
                  <AlertTriangle className="size-4 text-[#9a6700] dark:text-[#d29922] shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="size-4 text-[#1a7f37] dark:text-[#3fb950] shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold text-[#1f2328] dark:text-[#e6edf3] block">
                    {f.title}
                  </span>
                  <p className="text-[11px] text-[#656d76] dark:text-[#8b949e] mt-0.5 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-[#d0d7de] dark:border-[#30363d]">
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
