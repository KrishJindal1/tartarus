'use client'

import React from 'react'
import {
  Network,
  Code2,
  Cpu,
  ChevronRight,
  ShieldCheck,
  Binary,
  Layers,
} from 'lucide-react'
import { Card, useToast } from '@/components/ui'

interface ProposedSolutionPillarsCardProps {
  onNavigate?: (view: string) => void
}

const pillars = [
  {
    id: 'centralized',
    title: 'Centralized Investigation',
    subtitle: 'Unified Command & Telemetry',
    description: 'Analyse and manage multiple systems from one unified interface without switching consoles.',
    badge: 'Multi-Target C2',
    icon: Network,
    iconColor: 'text-[#0969da] dark:text-[#58a6ff] bg-[#ddf4ff] dark:bg-[#388bfd]/15 border-[#54aeff]/40 dark:border-[#388bfd]/30',
    targetView: 'Endpoints',
    actionText: 'Manage Connected Systems',
  },
  {
    id: 'functions',
    title: 'Built-in Forensic Functions',
    subtitle: 'Deep System Ingestion',
    description: 'Process • Memory • File • Driver Log • Network analysis executed directly in volatile memory.',
    badge: 'Zero-Disk Footprint',
    icon: Cpu,
    iconColor: 'text-[#1a7f37] dark:text-[#3fb950] bg-[#dafbe1] dark:bg-[#238636]/20 border-[#4ac26b]/40 dark:border-[#238636]/40',
    targetView: 'Results',
    actionText: 'View Telemetry Records',
  },
  {
    id: 'cross-platform',
    title: 'Cross-Platform Agents',
    subtitle: 'Hybrid Cluster Support',
    description: 'Native agent binaries seamlessly supporting Windows (APIs, WDK drivers) + Ubuntu (/proc, /sys, epoll) endpoints.',
    badge: 'Windows + Ubuntu',
    icon: Binary,
    iconColor: 'text-[#656d76] dark:text-[#8b949e] bg-[#f6f8fa] dark:bg-[#21262d] border-[#d0d7de] dark:border-[#30363d]',
    targetView: 'Endpoints',
    actionText: 'Inspect Agent Matrix',
  },
  {
    id: 'custom-dsl',
    title: 'Go Forensic Framework & Scripts',
    subtitle: 'Native Go Engine & Routines',
    description: 'Enables investigators to run modular, reusable Go forensic scripts and memory extractors directly in volatile memory.',
    badge: 'Go Framework (.go)',
    icon: Code2,
    iconColor: 'text-[#0969da] dark:text-[#58a6ff] bg-[#ddf4ff] dark:bg-[#388bfd]/15 border-[#54aeff]/40 dark:border-[#388bfd]/30',
    targetView: 'Deploy scripts',
    actionText: 'Open Script Studio',
  },
]

export function ProposedSolutionPillarsCard({ onNavigate }: ProposedSolutionPillarsCardProps) {
  const { toast } = useToast()

  const handlePillarClick = (targetView: string, title: string) => {
    toast(`Navigating to ${title} (${targetView})`, 'info')
    if (onNavigate) {
      onNavigate(targetView)
    }
  }

  return (
    <Card className="overflow-hidden border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-2xs" aria-labelledby="proposed-solution-title">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Layers className="size-4 text-[#0969da] dark:text-[#58a6ff]" />
          <div>
            <h3 id="proposed-solution-title" className="text-xs font-bold uppercase tracking-wider text-[#1f2328] dark:text-[#f0f6fc]">
              Proposed Solution — Core Strategic Pillars
            </h3>
            <p className="text-[11px] text-[#656d76] dark:text-[#8b949e]">
              Solving AV interference through in-memory execution, cross-platform agents, and centralized telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a7f37] dark:text-[#3fb950] bg-[#dafbe1] dark:bg-[#238636]/20 border border-[#4ac26b]/40 dark:border-[#238636]/40 rounded px-2.5 py-1">
          <ShieldCheck className="size-3.5 text-[#1a7f37] dark:text-[#3fb950]" />
          <span>100% Heuristic Evasion Guarantee</span>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#d0d7de]/60 dark:divide-[#30363d] bg-white dark:bg-[#0d1117]">
        {pillars.map((pillar) => {
          const Icon = pillar.icon
          return (
            <div
              key={pillar.id}
              onClick={() => handlePillarClick(pillar.targetView, pillar.title)}
              className="p-4 flex flex-col justify-between hover:bg-[#f6f8fa] dark:hover:bg-[#1f242c] transition-colors group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex size-8 items-center justify-center rounded-lg border ${pillar.iconColor} shadow-2xs`}>
                    <Icon className="size-4" />
                  </div>
                  <span className="rounded bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 text-[10px] font-mono font-bold text-[#1f2328] dark:text-[#8b949e] group-hover:bg-[#ddf4ff] dark:group-hover:bg-[#388bfd]/20 group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition-colors">
                    {pillar.badge}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition-colors">
                  {pillar.title}
                </h4>
                <p className="text-[11px] font-semibold text-[#656d76] dark:text-[#8b949e] mt-0.5">
                  {pillar.subtitle}
                </p>
                <p className="mt-2 text-xs text-[#656d76] dark:text-[#8b949e] leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-[#d0d7de]/50 dark:border-[#30363d] flex items-center justify-between text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline">
                <span>{pillar.actionText}</span>
                <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
