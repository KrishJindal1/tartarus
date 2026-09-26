'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  Play,
  CheckCircle2,
  Clock,
  Terminal,
  Filter,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  RotateCcw,
} from 'lucide-react'
import { Card, useToast } from '@/components/ui'
import { ForensicJob } from '@/types'

interface RecentForensicJobsTableProps {
  jobs: ForensicJob[]
  onSelectJob?: (job: ForensicJob) => void
  onNewJobClick?: () => void
}

type SortColumn = 'id' | 'scriptName' | 'target' | 'type' | 'started' | 'duration' | 'status' | 'findings'
type SortDirection = 'asc' | 'desc' | null

export const RecentForensicJobsTable = React.memo(function RecentForensicJobsTable({
  jobs,
  onSelectJob,
  onNewJobClick,
}: RecentForensicJobsTableProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Completed' | 'Running'>('ALL')
  const [showColumnFilters, setShowColumnFilters] = useState(true)

  // Column filter state
  const [colFilters, setColFilters] = useState({
    id: '',
    scriptName: 'ALL',
    target: 'ALL',
    type: 'ALL',
    started: '',
    duration: '',
    status: 'ALL',
    findings: '',
  })

  // Sorting state
  const [sortCol, setSortCol] = useState<SortColumn | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)

  // Distinct values for select dropdowns
  const distinctScripts = useMemo(() => {
    const set = new Set<string>()
    jobs.forEach((j) => j.scriptName && set.add(j.scriptName))
    return Array.from(set).sort()
  }, [jobs])

  const distinctTargets = useMemo(() => {
    const set = new Set<string>()
    jobs.forEach((j) => j.target && set.add(j.target))
    return Array.from(set).sort()
  }, [jobs])

  const distinctTypes = useMemo(() => {
    const set = new Set<string>()
    jobs.forEach((j) => j.type && set.add(j.type))
    return Array.from(set).sort()
  }, [jobs])

  // Active column filters count
  const activeColFilterCount = useMemo(() => {
    let count = 0
    if (colFilters.id) count++
    if (colFilters.scriptName !== 'ALL') count++
    if (colFilters.target !== 'ALL') count++
    if (colFilters.type !== 'ALL') count++
    if (colFilters.started) count++
    if (colFilters.duration) count++
    if (colFilters.status !== 'ALL') count++
    if (colFilters.findings) count++
    return count
  }, [colFilters])

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc')
      else if (sortDir === 'desc') {
        setSortCol(null)
        setSortDir(null)
      }
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const resetAllFilters = () => {
    setColFilters({
      id: '',
      scriptName: 'ALL',
      target: 'ALL',
      type: 'ALL',
      started: '',
      duration: '',
      status: 'ALL',
      findings: '',
    })
    setStatusFilter('ALL')
    setSearchQuery('')
  }

  const filtered = useMemo(() => {
    return jobs
      .filter((job) => {
        // Global search
        const q = searchQuery.toLowerCase()
        const matchesGlobal =
          !q ||
          job.id.toLowerCase().includes(q) ||
          job.scriptName.toLowerCase().includes(q) ||
          job.target.toLowerCase().includes(q) ||
          job.type.toLowerCase().includes(q) ||
          job.findings.toLowerCase().includes(q)

        // Status pill filter
        const matchesStatusPill =
          statusFilter === 'ALL' || job.status === statusFilter

        // Column filters
        const matchesColId =
          !colFilters.id || job.id.toLowerCase().includes(colFilters.id.toLowerCase())

        const matchesColScript =
          colFilters.scriptName === 'ALL' || job.scriptName === colFilters.scriptName

        const matchesColTarget =
          colFilters.target === 'ALL' || job.target === colFilters.target

        const matchesColType =
          colFilters.type === 'ALL' || job.type === colFilters.type

        const matchesColStarted =
          !colFilters.started || job.started.toLowerCase().includes(colFilters.started.toLowerCase())

        const matchesColDuration =
          !colFilters.duration || job.duration.toLowerCase().includes(colFilters.duration.toLowerCase())

        const matchesColStatus =
          colFilters.status === 'ALL' || job.status === colFilters.status

        const matchesColFindings =
          !colFilters.findings || job.findings.toLowerCase().includes(colFilters.findings.toLowerCase())

        return (
          matchesGlobal &&
          matchesStatusPill &&
          matchesColId &&
          matchesColScript &&
          matchesColTarget &&
          matchesColType &&
          matchesColStarted &&
          matchesColDuration &&
          matchesColStatus &&
          matchesColFindings
        )
      })
      .sort((a, b) => {
        if (!sortCol || !sortDir) return 0

        const valA = a[sortCol] || ''
        const valB = b[sortCol] || ''

        const cmp = valA.localeCompare(valB)
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [jobs, searchQuery, statusFilter, colFilters, sortCol, sortDir])

  const renderSortIcon = (col: SortColumn) => {
    if (sortCol !== col) {
      return <ArrowUpDown className="size-3 text-[#656d76] dark:text-[#8b949e] opacity-40 group-hover/th:opacity-100 transition-opacity" />
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="size-3 text-[#0969da] dark:text-[#58a6ff] font-bold" />
    ) : (
      <ArrowDown className="size-3 text-[#0969da] dark:text-[#58a6ff] font-bold" />
    )
  }

  const handleRowClick = (job: ForensicJob) => {
    if (onSelectJob) {
      onSelectJob(job)
    } else {
      toast(`Inspecting forensic execution details for ${job.id} (${job.scriptName})`, 'info')
    }
  }

  return (
    <Card className="overflow-hidden border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-2xs transition-colors" aria-labelledby="recent-jobs-title">
      {/* Header bar */}
      <div className="flex flex-col gap-3 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] px-4 py-3 sm:flex-row sm:items-center sm:justify-between transition-colors">
        <div className="flex items-center gap-2.5">
          <Terminal className="size-4 text-[#0969da] dark:text-[#58a6ff]" />
          <h3 id="recent-jobs-title" className="text-xs font-bold uppercase tracking-wider text-[#1f2328] dark:text-[#f0f6fc]">
            Recent Forensic Jobs ({filtered.length}{filtered.length !== jobs.length ? ` / ${jobs.length}` : ''})
          </h3>
          <span className="hidden sm:inline-block rounded bg-[#ddf4ff] dark:bg-[#388bfd]/20 px-2 py-0.5 text-[10px] font-bold text-[#0969da] dark:text-[#58a6ff] border border-[#54aeff]/40 dark:border-[#388bfd]/30">
            Automated LLVM JIT
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Column Filters Toggle */}
          <button
            type="button"
            onClick={() => setShowColumnFilters(!showColumnFilters)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
              showColumnFilters || activeColFilterCount > 0
                ? 'bg-[#eaeef2] dark:bg-[#30363d] border-[#8c959f] dark:border-[#8b949e] text-[#1f2328] dark:text-[#f0f6fc]'
                : 'bg-white dark:bg-[#21262d] border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d]'
            }`}
            title="Toggle column-wise filters"
          >
            <Filter className="size-3.5" />
            <span>Column Filters</span>
            {activeColFilterCount > 0 && (
              <span className="rounded-full bg-[#d0d7de] text-[#1f2328] dark:bg-[#484f58] dark:text-[#f0f6fc] px-1.5 py-0.2 text-[10px] font-bold">
                {activeColFilterCount}
              </span>
            )}
          </button>

          {/* Reset button if any filter active */}
          {(activeColFilterCount > 0 || searchQuery || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-[#656d76] dark:text-[#8b949e] hover:text-[#cf222e] dark:hover:text-[#f85149] hover:bg-[#ffebe9] dark:hover:bg-[#21262d] border border-transparent transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </button>
          )}

          {/* Search input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#656d76] dark:text-[#8b949e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs..."
              className="w-32 sm:w-44 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] pl-8 pr-3 py-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none transition-colors"
            />
          </div>

          {/* Status buttons */}
          <div className="flex items-center rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] shadow-2xs border border-[#d0d7de] dark:border-[#30363d]'
                  : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Completed')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                statusFilter === 'Completed'
                  ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] shadow-2xs border border-[#d0d7de] dark:border-[#30363d]'
                  : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
              }`}
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Running')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                statusFilter === 'Running'
                  ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] shadow-2xs border border-[#d0d7de] dark:border-[#30363d]'
                  : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
              }`}
            >
              Live
            </button>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {/* Main Header with sorting */}
            <tr className="border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] font-semibold text-[#1f2328] dark:text-[#e6edf3]">
              <th
                onClick={() => handleSort('id')}
                className="py-2.5 px-4 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Job ID</span>
                  {renderSortIcon('id')}
                </div>
              </th>

              <th
                onClick={() => handleSort('scriptName')}
                className="py-2.5 px-3 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Script Name</span>
                  {renderSortIcon('scriptName')}
                </div>
              </th>

              <th
                onClick={() => handleSort('target')}
                className="py-2.5 px-3 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Target</span>
                  {renderSortIcon('target')}
                </div>
              </th>

              <th
                onClick={() => handleSort('type')}
                className="py-2.5 px-3 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Type</span>
                  {renderSortIcon('type')}
                </div>
              </th>

              <th
                onClick={() => handleSort('started')}
                className="py-2.5 px-3 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Started</span>
                  {renderSortIcon('started')}
                </div>
              </th>

              <th
                onClick={() => handleSort('duration')}
                className="py-2.5 px-3 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Duration</span>
                  {renderSortIcon('duration')}
                </div>
              </th>

              <th
                onClick={() => handleSort('status')}
                className="py-2.5 px-3 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>

              <th
                onClick={() => handleSort('findings')}
                className="py-2.5 px-3 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Findings</span>
                  {renderSortIcon('findings')}
                </div>
              </th>
            </tr>

            {/* Column-Wise Filter Row */}
            {showColumnFilters && (
              <tr className="border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa]/80 dark:bg-[#161b22] text-[11px]">
                {/* Job ID Filter */}
                <th className="py-2 px-3 font-normal">
                  <div className="relative">
                    <input
                      type="text"
                      value={colFilters.id}
                      onChange={(e) => setColFilters({ ...colFilters, id: e.target.value })}
                      placeholder="JOB-..."
                      className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none font-mono"
                    />
                    {colFilters.id && (
                      <button
                        type="button"
                        onClick={() => setColFilters({ ...colFilters, id: '' })}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#656d76] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                </th>

                {/* Script Name Filter */}
                <th className="py-2 px-2 font-normal">
                  <select
                    value={colFilters.scriptName}
                    onChange={(e) => setColFilters({ ...colFilters, scriptName: e.target.value })}
                    className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-1.5 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none cursor-pointer font-mono"
                  >
                    <option value="ALL">All Scripts</option>
                    {distinctScripts.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </th>

                {/* Target Host Filter */}
                <th className="py-2 px-2 font-normal">
                  <select
                    value={colFilters.target}
                    onChange={(e) => setColFilters({ ...colFilters, target: e.target.value })}
                    className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-1.5 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Targets</option>
                    {distinctTargets.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </th>

                {/* Type Filter */}
                <th className="py-2 px-2 font-normal">
                  <select
                    value={colFilters.type}
                    onChange={(e) => setColFilters({ ...colFilters, type: e.target.value })}
                    className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-1.5 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Types</option>
                    {distinctTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </th>

                {/* Started Filter */}
                <th className="py-2 px-2 font-normal">
                  <div className="relative">
                    <input
                      type="text"
                      value={colFilters.started}
                      onChange={(e) => setColFilters({ ...colFilters, started: e.target.value })}
                      placeholder="e.g. 2m ago"
                      className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none"
                    />
                    {colFilters.started && (
                      <button
                        type="button"
                        onClick={() => setColFilters({ ...colFilters, started: '' })}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#656d76] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                </th>

                {/* Duration Filter */}
                <th className="py-2 px-2 font-normal">
                  <div className="relative">
                    <input
                      type="text"
                      value={colFilters.duration}
                      onChange={(e) => setColFilters({ ...colFilters, duration: e.target.value })}
                      placeholder="e.g. 1.2s"
                      className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none font-mono"
                    />
                    {colFilters.duration && (
                      <button
                        type="button"
                        onClick={() => setColFilters({ ...colFilters, duration: '' })}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#656d76] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                </th>

                {/* Status Filter */}
                <th className="py-2 px-2 font-normal">
                  <select
                    value={colFilters.status}
                    onChange={(e) => setColFilters({ ...colFilters, status: e.target.value })}
                    className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-1.5 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Running">Running</option>
                    <option value="Queued">Queued</option>
                    <option value="Failed">Failed</option>
                  </select>
                </th>

                {/* Findings Filter */}
                <th className="py-2 px-3 font-normal">
                  <div className="relative">
                    <input
                      type="text"
                      value={colFilters.findings}
                      onChange={(e) => setColFilters({ ...colFilters, findings: e.target.value })}
                      placeholder="Filter findings..."
                      className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none"
                    />
                    {colFilters.findings && (
                      <button
                        type="button"
                        onClick={() => setColFilters({ ...colFilters, findings: '' })}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#656d76] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                </th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-[#d0d7de]/50 dark:divide-[#30363d] bg-white dark:bg-[#161b22]">
            {filtered.map((job) => {
              const isCompleted = job.status === 'Completed'
              const isRunning = job.status === 'Running'

              return (
                <tr
                  key={job.id}
                  onClick={() => handleRowClick(job)}
                  className="group cursor-pointer transition-colors hover:bg-[#f6f8fa] dark:hover:bg-[#1f242c]"
                >
                  {/* Job ID */}
                  <td className="py-3 px-4 font-mono font-bold text-[#0969da] dark:text-[#58a6ff]">
                    {job.id}
                  </td>

                  {/* Script Name */}
                  <td className="py-3 px-3">
                    <span className="font-mono font-semibold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition-colors">
                      {job.scriptName}
                    </span>
                  </td>

                  {/* Target Host */}
                  <td className="py-3 px-3 font-bold text-[#1f2328] dark:text-[#e6edf3]">
                    {job.target}
                  </td>

                  {/* Type */}
                  <td className="py-3 px-3 text-[#656d76] dark:text-[#8b949e] font-medium">
                    {job.type}
                  </td>

                  {/* Started Time */}
                  <td className="py-3 px-3 text-[#656d76] dark:text-[#8b949e] font-mono text-[11px]">
                    {job.started}
                  </td>

                  {/* Duration */}
                  <td className="py-3 px-3 font-mono text-[#1f2328] dark:text-[#e6edf3] font-semibold">
                    {job.duration}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        isCompleted
                          ? 'bg-[#dafbe1] dark:bg-[#238636]/20 text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b]/40 dark:border-[#238636]/40'
                          : isRunning
                          ? 'bg-[#ddf4ff] dark:bg-[#388bfd]/20 text-[#0969da] dark:text-[#58a6ff] border border-[#54aeff]/40 dark:border-[#388bfd]/40'
                          : 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#8b949e] border border-[#d0d7de] dark:border-[#30363d]'
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>

                  {/* Findings */}
                  <td className="py-3 px-3 text-[#656d76] dark:text-[#8b949e] max-w-xs truncate font-mono text-[11px]">
                    {job.findings}
                  </td>
                </tr>
              )
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-[#656d76] dark:text-[#8b949e]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="size-6 text-[#656d76] dark:text-[#8b949e]" />
                    <p className="font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                      No forensic jobs match the active column filters
                    </p>
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="mt-1 inline-flex items-center gap-1 rounded bg-[#ddf4ff] dark:bg-[#21262d] px-3 py-1 text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] border border-[#54aeff]/40 dark:border-[#30363d] hover:bg-[#b6e3ff] dark:hover:bg-[#30363d] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="size-3" /> Clear all filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-between border-t border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] px-4 py-2.5">
        <span className="text-[11px] text-[#656d76] dark:text-[#8b949e]">
          Showing {filtered.length} of {jobs.length} jobs
          {activeColFilterCount > 0 && ` · (${activeColFilterCount} column filter${activeColFilterCount > 1 ? 's' : ''} active)`}
        </span>
        <button
          type="button"
          onClick={() => {
            if (onNewJobClick) {
              onNewJobClick()
            } else {
              toast('Deploying new forensic inspection job to active cluster...', 'info')
            }
          }}
          className="flex items-center gap-1 text-[11px] font-semibold text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition-colors cursor-pointer"
        >
          Dispatch New Forensic Job <ChevronRight className="size-3" />
        </button>
      </div>
    </Card>
  )
})
