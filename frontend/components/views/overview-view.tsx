'use client'

import React from 'react'
import { ArrowDownToLine, Play, RefreshCw, Plus } from 'lucide-react'
import { useToast } from '@/components/ui'
import {
  MetricsGrid,
  EndpointAgentsTable,
  RecentForensicJobsTable,
} from '@/components/dashboard'
import { Endpoint, ForensicJob, MetricCard } from '@/types'

interface OverviewViewProps {
  running: boolean
  jobs: ForensicJob[]
  metrics: MetricCard[]
  onRun: () => void
  onExport: () => void
  filteredEndpoints: Endpoint[]
  totalEndpointsCount: number
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedEndpoint: string | null
  onSelectEndpoint: (name: string) => void
  onNavigate: (viewName: string) => void
  onNavigateScript?: (scriptName: string) => void
  onOpenAddEndpoint: () => void
}

export function OverviewView({
  running,
  jobs,
  metrics,
  onRun,
  onExport,
  filteredEndpoints,
  totalEndpointsCount,
  searchQuery,
  onSearchChange,
  selectedEndpoint,
  onSelectEndpoint,
  onNavigate,
  onNavigateScript,
  onOpenAddEndpoint,
}: OverviewViewProps) {
  const { toast } = useToast()

  const handleRunClick = () => {
    onRun()
    toast('Triggered live in-memory forensic analysis across connected targets!', 'info')
  }

  const handleExportClick = () => {
    onExport()
    toast('Exporting comprehensive forensic telemetry and records JSON...', 'success')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1f2328] dark:text-[#f0f6fc]">
            Overview
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-[#656d76] dark:text-[#8b949e]">
            Live multi-system telemetry, in-memory execution, and forensic reports.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportClick}
            className="flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] px-3 py-2 text-xs font-semibold text-[#1f2328] dark:text-[#c9d1d9] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowDownToLine className="size-3.5 text-[#656d76] dark:text-[#8b949e]" /> Export Telemetry
          </button>
          <button
            type="button"
            onClick={onOpenAddEndpoint}
            className="flex items-center gap-1.5 rounded-md bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" /> New Target
          </button>
          <button
            type="button"
            onClick={handleRunClick}
            disabled={running}
            className="flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] px-3 py-2 text-xs font-semibold text-[#1f2328] dark:text-[#c9d1d9] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] shadow-2xs transition-colors disabled:opacity-75 cursor-pointer"
          >
            {running ? (
              <RefreshCw className="size-3.5 animate-spin text-[#0969da] dark:text-[#58a6ff]" />
            ) : (
              <Play className="size-3.5 fill-current text-[#1f883d] dark:text-[#3fb950]" />
            )}
            {running ? 'Running Suite…' : 'Run Suite'}
          </button>
        </div>
      </div>

      {/* 6 Top KPI Metrics Cards */}
      <MetricsGrid metrics={metrics} onNavigate={onNavigate} />

      {/* Primary Section: ENDPOINT AGENTS (8) */}
      <EndpointAgentsTable
        endpoints={filteredEndpoints}
        totalCount={totalEndpointsCount}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedEndpoint={selectedEndpoint}
        onSelectEndpoint={onSelectEndpoint}
        onViewAll={() => onNavigate('Endpoints')}
        onNavigateScript={onNavigateScript}
      />

      {/* Secondary Section: RECENT FORENSIC JOBS (8) */}
      <RecentForensicJobsTable
        jobs={jobs}
        onSelectJob={(job: ForensicJob) => {
          toast(`Selected job ${job.id}: ${job.findings}`, 'info')
          onNavigate('Results')
        }}
        onNewJobClick={() => onNavigate('Deploy scripts')}
      />
    </div>
  )
}
