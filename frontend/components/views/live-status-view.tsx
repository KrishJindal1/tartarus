'use client'

import React, { useState } from 'react'
import {
  RefreshCw,
  Pause,
  Play,
  FileText,
  Activity,
  Server,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Cpu,
  Radio,
  Zap,
} from 'lucide-react'
import { Card, useToast, StatusDot } from '@/components/ui'
import { DestinationViewShell } from './destination-view-shell'
import { StreamLogsModal } from '@/components/modals'

interface LiveStatusViewProps {
  onRun: () => void
  onExport: () => void
  alertsPaused: boolean
  onTogglePauseAlerts: () => void
}

interface RoutineStage {
  id: string
  name: string
  targetNode: string
  status: 'Completed' | 'Running' | 'Queued'
  duration: string
  findings: string
}

const liveStages: RoutineStage[] = [
  { id: 'STG-01', name: '1. Volatile In-Memory Environment Survey', targetNode: 'NTRO-WIN-04 (Win Server 2022)', status: 'Completed', duration: '12s', findings: 'Clean · 0 disk artifacts' },
  { id: 'STG-02', name: '2. VAD Tree & Direct Syscall (SSN) Probe', targetNode: 'NTRO-WIN-04 (Win Server 2022)', status: 'Completed', duration: '34s', findings: '14 anomalous VAD ranges' },
  { id: 'STG-03', name: '3. BYOVD Kernel Driver Callback Audit', targetNode: 'FORENSIC-LNX-11 (Ubuntu 24.04)', status: 'Running', duration: '18s elapsed', findings: 'Inspecting PspCreateProcessNotify' },
  { id: 'STG-04', name: '4. Anonymous Socket & Epoll Inode Sweep', targetNode: 'FORENSIC-LNX-11 (Ubuntu 24.04)', status: 'Queued', duration: 'Pending', findings: 'Waiting for kernel step' },
  { id: 'STG-05', name: '5. Evidence AES-256-GCM Cryptographic Seal', targetNode: 'Central Management Vault', status: 'Queued', duration: 'Pending', findings: 'SHA-256 integrity seal' },
]

const liveNodes = [
  { name: 'NTRO-WIN-04', os: 'Windows Server 2022', ip: '10.42.18.91', cpu: '0.3%', ram: '3.2 MB', latency: '14ms', status: 'Active', av: 'CrowdStrike Falcon 7.14' },
  { name: 'FORENSIC-LNX-11', os: 'Ubuntu 24.04 LTS', ip: '10.42.19.44', cpu: '0.1%', ram: '2.8 MB', latency: '9ms', status: 'Scanning', av: 'Defender for Endpoint' },
  { name: 'NTRO-WIN-08', os: 'Windows 11 Enterprise', ip: '10.42.18.95', cpu: '0.2%', ram: '3.6 MB', latency: '18ms', status: 'Active', av: 'SentinelOne EDR' },
]

export function LiveStatusView({
  onRun,
  onExport,
  alertsPaused,
  onTogglePauseAlerts,
}: LiveStatusViewProps) {
  const { toast } = useToast()
  const [isLogsOpen, setIsLogsOpen] = useState(false)

  const handleRestart = () => {
    onRun()
    toast('Restarted live telemetry routine across all connected nodes.', 'info')
  }

  const handleToggleAlerts = () => {
    onTogglePauseAlerts()
    if (alertsPaused) {
      toast('Alert notifications resumed.', 'success')
    } else {
      toast('Alert notifications paused for 1 hour.', 'info')
    }
  }

  const buttonClass =
    'rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] px-3 py-2 text-xs font-medium text-[#1f2328] dark:text-[#c9d1d9] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors shadow-2xs cursor-pointer'

  return (
    <>
      <DestinationViewShell name="Live status" onRun={onRun} onExport={onExport}>
        <div className="flex flex-col gap-6">
          {/* Top Progress & Metrics */}
          <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <Card className="border-[#d0d7de] dark:border-[#30363d]">
              <div className="border-b border-[#d0d7de] dark:border-[#30363d] p-4 flex items-center justify-between bg-white dark:bg-[#161b22]">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-[#0969da] dark:text-[#58a6ff]" />
                  <h3 className="text-sm font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                    Active Execution Routine Telemetry
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#1a7f37] dark:text-[#3fb950] bg-[#dafbe1] dark:bg-[#238636]/20 border border-[#4ac26b]/40 dark:border-[#238636]/40 px-2 py-0.5 rounded">
                    Live Beacon
                  </span>
                  {alertsPaused && (
                    <span className="rounded-full bg-[#fff8c5] dark:bg-[#d29922]/15 border border-[#d4a72c]/40 dark:border-[#d29922]/30 text-[#9a6700] dark:text-[#d29922] px-2.5 py-0.5 text-[10px] font-semibold">
                      Alerts Muted
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-bold tracking-tight text-[#1f2328] dark:text-[#f0f6fc]">78%</p>
                    <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">18 of 24 forensic subroutines executed across active cluster</p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] bg-[#ddf4ff] dark:bg-[#388bfd]/15 px-2.5 py-1 rounded border border-[#54aeff]/40 dark:border-[#388bfd]/30 flex items-center gap-1.5">
                    <Clock className="size-3" /> 00:04:32
                  </span>
                </div>

                <div className="mt-4 h-2.5 rounded-full bg-[#eaeef2] dark:bg-[#21262d] overflow-hidden">
                  <div className="h-full w-[78%] rounded-full bg-[#1f883d] dark:bg-[#238636] transition-all duration-500 shadow-sm" />
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-md bg-[#dafbe1] dark:bg-[#238636]/20 p-3 text-center border border-[#4ac26b]/40 dark:border-[#238636]/40">
                    <p className="text-2xl font-bold text-[#1a7f37] dark:text-[#3fb950]">16</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#1a7f37] dark:text-[#3fb950]">Passed / Evaded</p>
                  </div>
                  <div className="rounded-md bg-[#fff8c5] dark:bg-[#d29922]/15 p-3 text-center border border-[#d4a72c]/40 dark:border-[#d29922]/30">
                    <p className="text-2xl font-bold text-[#9a6700] dark:text-[#d29922]">2</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#9a6700] dark:text-[#d29922]">Findings Flagged</p>
                  </div>
                  <div className="rounded-md bg-[#f6f8fa] dark:bg-[#0d1117] p-3 text-center border border-[#d0d7de] dark:border-[#30363d]">
                    <p className="text-2xl font-bold text-[#1f2328] dark:text-[#f0f6fc]">6</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#656d76] dark:text-[#8b949e]">Queued Routines</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Live Controls & Environment */}
            <Card className="p-5 flex flex-col justify-between border-[#d0d7de] dark:border-[#30363d]">
              <div>
                <h3 className="text-sm font-semibold text-[#1f2328] dark:text-[#f0f6fc]">Operations & Controls</h3>
                <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">
                  Manage live telemetry execution, alert filters, and terminal logs.
                </p>

                <div className="mt-4 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="flex items-center justify-center gap-2 rounded-md bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] px-3 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className="size-3.5" /> Restart execution run
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleAlerts}
                    className={`flex items-center justify-center gap-2 ${buttonClass}`}
                  >
                    {alertsPaused ? (
                      <>
                        <Play className="size-3.5 text-[#1a7f37] dark:text-[#3fb950]" /> Resume alerts
                      </>
                    ) : (
                      <>
                        <Pause className="size-3.5 text-[#9a6700] dark:text-[#d29922]" /> Pause alerts
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLogsOpen(true)}
                    className={`flex items-center justify-center gap-2 ${buttonClass}`}
                  >
                    <FileText className="size-3.5 text-[#656d76] dark:text-[#8b949e]" /> View stream logs (Terminal)
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-md bg-[#f6f8fa] dark:bg-[#0d1117] p-3 text-xs text-[#656d76] dark:text-[#8b949e] border border-[#d0d7de] dark:border-[#30363d]">
                <div className="flex items-center justify-between pb-1 border-b border-[#d0d7de] dark:border-[#30363d]">
                  <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc]">Relay Channel:</span>
                  <span className="font-mono text-[#1a7f37] dark:text-[#3fb950] font-bold">Port 443 (TLS 1.3)</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc]">Runner Node:</span>
                  <span className="font-mono text-[#1f2328] dark:text-[#e6edf3]">NTRO-OP-07</span>
                </div>
              </div>
            </Card>
          </section>

          {/* Routine Execution Pipeline Tracker */}
          <Card className="border-[#d0d7de] dark:border-[#30363d]">
            <div className="border-b border-[#d0d7de] dark:border-[#30363d] p-4 bg-white dark:bg-[#161b22]">
              <h3 className="text-sm font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                Execution Pipeline Stages & Inspection Progress
              </h3>
              <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">
                Granular step-by-step progress of the active forensic routine.
              </p>
            </div>

            <div className="divide-y divide-[#d0d7de] dark:divide-[#30363d]">
              {liveStages.map((stage) => {
                const isCompleted = stage.status === 'Completed'
                const isRunning = stage.status === 'Running'

                return (
                  <div
                    key={stage.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center justify-between hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                        isCompleted
                          ? 'bg-[#dafbe1] dark:bg-[#238636]/20 text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b]/40 dark:border-[#238636]/40'
                          : isRunning
                          ? 'bg-[#ddf4ff] dark:bg-[#388bfd]/15 text-[#0969da] dark:text-[#58a6ff] border border-[#54aeff]/40 dark:border-[#388bfd]/30 animate-pulse'
                          : 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#8b949e] border border-[#d0d7de] dark:border-[#30363d]'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="size-4 text-[#1a7f37] dark:text-[#3fb950]" />
                        ) : isRunning ? (
                          <RefreshCw className="size-4 text-[#0969da] dark:text-[#58a6ff] animate-spin" />
                        ) : (
                          <Clock className="size-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                            {stage.name}
                          </h4>
                          <span className="font-mono text-[11px] text-[#656d76] dark:text-[#8b949e]">
                            ({stage.targetNode})
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#656d76] dark:text-[#8b949e] font-mono">
                          {stage.findings}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <span className="font-mono text-xs text-[#656d76] dark:text-[#8b949e]">
                        {stage.duration}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          isCompleted
                            ? 'bg-[#dafbe1] dark:bg-[#238636]/20 text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b]/40 dark:border-[#238636]/40'
                            : isRunning
                            ? 'bg-[#ddf4ff] dark:bg-[#388bfd]/15 text-[#0969da] dark:text-[#58a6ff] border border-[#54aeff]/40 dark:border-[#388bfd]/30 animate-pulse'
                            : 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#8b949e] border border-[#d0d7de] dark:border-[#30363d]'
                        }`}
                      >
                        {stage.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Active Target Nodes Live Health Feed */}
          <Card className="border-[#d0d7de] dark:border-[#30363d]">
            <div className="border-b border-[#d0d7de] dark:border-[#30363d] p-4 bg-white dark:bg-[#161b22] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                  Target Cluster Nodes Overhead & Connection Heartbeats
                </h3>
                <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">
                  In-memory resource utilization and encrypted telemetry latency across target endpoints.
                </p>
              </div>
              <span className="text-xs font-mono text-[#656d76] dark:text-[#8b949e]">
                Overhead: &lt;0.4% CPU
              </span>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-3">
              {liveNodes.map((node) => (
                <div
                  key={node.name}
                  className="rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Server className="size-3.5 text-[#0969da] dark:text-[#58a6ff]" />
                        <span className="font-bold text-xs text-[#1f2328] dark:text-[#f0f6fc] font-mono">{node.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#1a7f37] dark:text-[#3fb950]">
                        {node.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#656d76] dark:text-[#8b949e] mt-1">{node.os} · {node.ip}</p>
                    <p className="text-[10px] text-[#656d76] dark:text-[#8b949e] mt-0.5 font-medium">EDR: {node.av}</p>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-[#d0d7de] dark:border-[#30363d] flex items-center justify-between text-[11px] font-mono text-[#656d76] dark:text-[#8b949e]">
                    <span>CPU: <strong className="text-[#1f2328] dark:text-[#e6edf3]">{node.cpu}</strong></span>
                    <span>RAM: <strong className="text-[#1f2328] dark:text-[#e6edf3]">{node.ram}</strong></span>
                    <span>RTT: <strong className="text-[#1a7f37] dark:text-[#3fb950]">{node.latency}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </DestinationViewShell>

      <StreamLogsModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      />
    </>
  )
}
