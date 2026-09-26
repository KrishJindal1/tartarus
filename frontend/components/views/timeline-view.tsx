'use client'

import React, { useState, useMemo } from 'react'
import { Search, Filter, ArrowDownToLine, RotateCcw } from 'lucide-react'
import { Card, useToast } from '@/components/ui'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { DestinationViewShell } from './destination-view-shell'
import { timelineData } from '@/data/timeline'

interface TimelineViewProps {
  onRun: () => void
  onExport?: () => void
}

const toneStyles: Record<string, { bg: string; text: string; ring: string }> = {
  emerald: { bg: 'bg-[#dafbe1] dark:bg-[#238636]/20', text: 'text-[#1a7f37] dark:text-[#3fb950]', ring: 'ring-[#4ac26b]/40' },
  sky: { bg: 'bg-[#ddf4ff] dark:bg-[#388bfd]/15', text: 'text-[#0969da] dark:text-[#58a6ff]', ring: 'ring-[#54aeff]/40' },
  blue: { bg: 'bg-[#ddf4ff] dark:bg-[#388bfd]/15', text: 'text-[#0969da] dark:text-[#58a6ff]', ring: 'ring-[#54aeff]/40' },
  amber: { bg: 'bg-[#fff8c5] dark:bg-[#d29922]/15', text: 'text-[#9a6700] dark:text-[#d29922]', ring: 'ring-[#d4a72c]/40' },
  violet: { bg: 'bg-[#fbefff] dark:bg-[#bc8cff]/15', text: 'text-[#8250df] dark:text-[#d2a8ff]', ring: 'ring-[#bc8cff]/40' },
  slate: { bg: 'bg-[#f6f8fa] dark:bg-[#21262d]', text: 'text-[#656d76] dark:text-[#8b949e]', ring: 'ring-[#d0d7de]/40' },
}

export function TimelineView({ onRun, onExport }: TimelineViewProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  const handleExport = () => {
    if (onExport) {
      onExport()
    } else {
      const blob = new Blob([JSON.stringify(timelineData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'jockey-timeline-audit.json'
      a.click()
      URL.revokeObjectURL(url)
      toast('Exported chronological timeline audit log.', 'success')
    }
  }

  const filteredEvents = useMemo(() => {
    return timelineData.filter((event) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        event.title.toLowerCase().includes(q) ||
        event.detail.toLowerCase().includes(q) ||
        (event.systemNode?.toLowerCase() || '').includes(q) ||
        (event.evasionTechnique?.toLowerCase() || '').includes(q)

      const matchesCat =
        categoryFilter === 'ALL' ||
        (categoryFilter === 'runs' && (event.iconName === 'Check' || event.iconName === 'Activity')) ||
        (categoryFilter === 'evidence' && event.iconName === 'Upload') ||
        (categoryFilter === 'findings' && event.iconName === 'AlertTriangle') ||
        (categoryFilter === 'deployments' && event.iconName === 'GitBranch') ||
        (categoryFilter === 'reports' && event.iconName === 'FileText')

      return matchesSearch && matchesCat
    })
  }, [search, categoryFilter])

  return (
    <DestinationViewShell name="Timeline" onRun={onRun} onExport={handleExport}>
      <Card className="border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#d0d7de] dark:border-[#30363d] p-4 sm:flex-row sm:items-center sm:justify-between bg-[#f6f8fa] dark:bg-[#161b22]">
          <div>
            <h3 className="text-sm font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
              Chronological Forensic Audit Trail ({filteredEvents.length} Events)
            </h3>
            <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">
              Tamper-evident record of all in-memory routines, evidence captures, and kernel callbacks.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#656d76] dark:text-[#8b949e]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search audit trail..."
                className="w-36 sm:w-48 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] pl-8 pr-3 py-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2.5 py-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none cursor-pointer"
            >
              <option value="ALL">All Event Types</option>
              <option value="runs">Forensic Runs</option>
              <option value="evidence">Evidence Vault</option>
              <option value="findings">Kernel & Findings</option>
              <option value="deployments">Script Deployments</option>
              <option value="reports">Audit Reports</option>
            </select>

            {(search || categoryFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setCategoryFilter('ALL')
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#656d76] dark:text-[#8b949e] hover:text-[#cf222e] dark:hover:text-[#f85149] hover:bg-[#ffebe9] dark:hover:bg-[#21262d] border border-transparent transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3" /> Reset
              </button>
            )}

            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] px-3 py-1.5 text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowDownToLine className="size-3.5 text-[#656d76] dark:text-[#8b949e]" /> Export JSON
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {filteredEvents.map((event, index) => {
            const toneConfig = toneStyles[event.tone] || toneStyles.sky
            const isLast = index === filteredEvents.length - 1

            return (
              <div key={event.title} className="flex gap-4 items-start">
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${toneConfig.bg} ${toneConfig.text} ring-2 ${toneConfig.ring} shadow-2xs mt-0.5`}
                >
                  <DynamicIcon name={event.iconName} className="size-4" />
                </div>
                <div
                  className={`flex-1 min-w-0 ${
                    isLast ? '' : 'border-b border-[#d0d7de]/60 dark:border-[#30363d] pb-4'
                  }`}
                >
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                        {event.title}
                      </h4>
                      {event.systemNode && (
                        <span className="rounded bg-[#f6f8fa] dark:bg-[#21262d] px-2 py-0.2 font-mono text-[10px] font-semibold text-[#1f2328] dark:text-[#8b949e] border border-[#d0d7de] dark:border-[#30363d]">
                          {event.systemNode}
                        </span>
                      )}
                      {event.evasionTechnique && (
                        <span className="rounded bg-[#fbefff] dark:bg-[#bc8cff]/15 border border-[#d2a8ff]/40 dark:border-[#bc8cff]/30 text-[#8250df] dark:text-[#d2a8ff] font-mono text-[10px] font-semibold px-2 py-0.2">
                          {event.evasionTechnique}
                        </span>
                      )}
                    </div>
                    <time className="text-xs font-mono text-[#656d76] dark:text-[#8b949e] shrink-0">
                      {event.time}
                    </time>
                  </div>
                  <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e] font-mono leading-relaxed">
                    {event.detail}
                  </p>
                </div>
              </div>
            )
          })}

          {filteredEvents.length === 0 && (
            <div className="p-8 text-center text-xs text-[#656d76] dark:text-[#8b949e]">
              <div className="flex flex-col items-center justify-center gap-2">
                <Filter className="size-5 text-[#656d76] dark:text-[#8b949e]" />
                <p>No audit trail events match the current filter selection.</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </DestinationViewShell>
  )
}
