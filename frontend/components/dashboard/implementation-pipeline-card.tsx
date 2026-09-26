'use client'

import React, { useState } from 'react'
import {
  FileCode2,
  Cpu,
  Send,
  SearchCheck,
  FileCheck,
  ChevronRight,
  Layers,
} from 'lucide-react'
import { Card, useToast } from '@/components/ui'

interface ImplementationPipelineCardProps {
  onNavigate?: (view: string) => void
}

const pipelineSteps = [
  {
    step: 1,
    title: 'Script Creation',
    subtitle: 'Write Go Forensic Routines',
    desc: 'Define Go forensic functions (memory inspection, processes, network sockets, /var/log) & target hosts',
    icon: FileCode2,
    tech: 'Go Editor · Native Go DSL',
    targetView: 'Deploy scripts',
  },
  {
    step: 2,
    title: 'Compile & Validate',
    subtitle: 'Go → SSA + Permissions',
    desc: 'Go AST parser validates call graph, emits optimized SSA bytecode and checks RBAC security policy',
    icon: Cpu,
    tech: 'Go AST → SSA Stream',
    targetView: 'Deploy scripts',
  },
  {
    step: 3,
    title: 'Deploy to Endpoints',
    subtitle: 'Cross-Platform Agents',
    desc: 'Execute in memory via Golang Engine across authorized Windows (WDK) & Linux (eBPF, /proc) agents',
    icon: Send,
    tech: 'Golang Engine · WDK · eBPF',
    targetView: 'Endpoints',
  },
  {
    step: 4,
    title: 'Collect Forensic Evidence',
    subtitle: 'Immutable State Vault',
    desc: 'Zero-disk memory dumps, unhooked native syscalls, sealed in read-only encrypted cache',
    icon: SearchCheck,
    tech: 'AES-256-GCM · Read-Only',
    targetView: 'Evidence',
  },
  {
    step: 5,
    title: 'Generate Report',
    subtitle: 'Findings & Timeline',
    desc: 'Synthesize executive summaries, attack timelines, MITRE ATT&CK mappings, and PDF reports',
    icon: FileCheck,
    tech: 'PostgreSQL · FastAPI · PDF',
    targetView: 'Reports',
  },
]

export function ImplementationPipelineCard({
  onNavigate,
}: ImplementationPipelineCardProps) {
  const { toast } = useToast()
  const [activeStep, setActiveStep] = useState(1)

  const handleStepClick = (stepNum: number, viewName: string) => {
    setActiveStep(stepNum)
    toast(`Pipeline Step ${stepNum} Selected: ${pipelineSteps[stepNum - 1].title}`, 'info')
    if (onNavigate) {
      onNavigate(viewName)
    }
  }

  return (
    <Card className="overflow-hidden border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-2xs" aria-labelledby="pipeline-title">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Layers className="size-4 text-[#0969da] dark:text-[#58a6ff]" />
          <div>
            <h3 id="pipeline-title" className="text-xs font-bold uppercase tracking-wider text-[#1f2328] dark:text-[#f0f6fc]">
              JOCKEY 5-Step Forensic Pipeline
            </h3>
            <p className="text-[11px] text-[#656d76] dark:text-[#8b949e]">
              Automated workflow from Go Forensic Routine compilation to Encrypted Evidence Reporting
            </p>
          </div>
        </div>
      </div>

      {/* Stepper Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-[#d0d7de]/60 dark:divide-[#30363d] bg-white dark:bg-[#0d1117]">
        {pipelineSteps.map((step) => {
          const Icon = step.icon
          const isActive = activeStep === step.step

          return (
            <button
              key={step.step}
              type="button"
              onClick={() => handleStepClick(step.step, step.targetView)}
              className={`p-3 text-left transition-all hover:bg-[#f6f8fa] dark:hover:bg-[#1f242c] flex flex-col justify-between group cursor-pointer ${
                isActive ? 'bg-[#f6f8fa] dark:bg-[#161b22] ring-1 ring-inset ring-[#0969da]/40 dark:ring-[#58a6ff]/40 shadow-2xs' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center justify-center size-5 rounded-full bg-[#ddf4ff] dark:bg-[#388bfd]/20 text-[#0969da] dark:text-[#58a6ff] font-bold text-[10px]">
                    {step.step}
                  </span>
                  <span className="text-[10px] font-mono text-[#656d76] dark:text-[#8b949e] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition-colors">
                    {step.tech}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff]">
                  <Icon className="size-3.5 text-[#0969da] dark:text-[#58a6ff]" />
                  {step.title}
                </div>

                <p className="mt-1 text-[11px] font-semibold text-[#1f2328] dark:text-[#e6edf3]">
                  {step.subtitle}
                </p>

                <p className="mt-1 text-[10px] text-[#656d76] dark:text-[#8b949e] line-clamp-2 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#d0d7de]/50 dark:border-[#30363d] flex items-center justify-between text-[10px] font-medium text-[#0969da] dark:text-[#58a6ff]">
                <span>View in {step.targetView}</span>
                <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Technology Stack Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] px-4 py-2 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-[#1f2328] dark:text-[#e6edf3]">
          <Layers className="size-3.5 text-[#0969da] dark:text-[#58a6ff]" />
          <span>Technology Stack:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 font-bold text-[#1f2328] dark:text-[#e6edf3]">Next.js</span>
          <span className="rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 font-bold text-[#1f2328] dark:text-[#e6edf3]">TypeScript</span>
          <span className="rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 font-bold text-[#1f2328] dark:text-[#e6edf3]">Golang Engine</span>
          <span className="rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 font-bold text-[#1f2328] dark:text-[#e6edf3]">TLS 1.3</span>
          <span className="rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 font-bold text-[#1f2328] dark:text-[#e6edf3]">PostgreSQL</span>
          <span className="rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 font-bold text-[#1f2328] dark:text-[#e6edf3]">FastAPI</span>
          <span className="rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 font-bold text-[#1f2328] dark:text-[#e6edf3]">Go AST Engine</span>
          <span className="rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 font-bold text-[#1f2328] dark:text-[#e6edf3]">AES-256-GCM</span>
          <span className="rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 font-bold text-[#1f2328] dark:text-[#e6edf3]">WDK & eBPF</span>
        </div>
      </div>
    </Card>
  )
}
