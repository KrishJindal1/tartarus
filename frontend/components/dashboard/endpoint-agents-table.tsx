'use client'

import React, { useState, useMemo } from 'react'
import {
  Filter,
  Search,
  Terminal,
  ShieldCheck,
  ChevronRight,
  Server,
  ShieldAlert,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  RotateCcw,
} from 'lucide-react'
import { Card, StatusDot } from '@/components/ui'
import { Endpoint } from '@/types'

interface EndpointAgentsTableProps {
  endpoints: Endpoint[]
  totalCount: number
  searchQuery: string
  onSearchChange: (val: string) => void
  selectedEndpoint: string | null
  onSelectEndpoint: (name: string) => void
  onViewAll?: () => void
  onNavigateScript?: (scriptName: string) => void
}

type SortColumn = 'agentId' | 'hostname' | 'platform' | 'ip' | 'status' | 'lastScript' | 'avPresent' | 'evasionStatus'
type SortDirection = 'asc' | 'desc' | null

export const EndpointAgentsTable = React.memo(function EndpointAgentsTable({
  endpoints,
  totalCount,
  searchQuery,
  onSearchChange,
  selectedEndpoint,
  onSelectEndpoint,
  onViewAll,
  onNavigateScript,
}: EndpointAgentsTableProps) {
  // Global quick OS filter
  const [filterOS, setFilterOS] = useState<'ALL' | 'Windows' | 'Ubuntu'>('ALL')

  // Toggle for column filter bar
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(true)

  // Column-specific filter states
  const [colFilters, setColFilters] = useState({
    agentId: '',
    hostname: '',
    platform: 'ALL',
    ip: '',
    status: 'ALL',
    lastScript: 'ALL',
    avPresent: 'ALL',
    evasionStatus: 'ALL',
  })

  // Sorting state
  const [sortCol, setSortCol] = useState<SortColumn | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)

  // Extract distinct values for dropdowns
  const distinctPlatforms = useMemo(() => {
    const set = new Set<string>()
    endpoints.forEach((e) => e.platform && set.add(e.platform))
    return Array.from(set).sort()
  }, [endpoints])

  const distinctScripts = useMemo(() => {
    const set = new Set<string>()
    endpoints.forEach((e) => e.lastScript && set.add(e.lastScript))
    return Array.from(set).sort()
  }, [endpoints])

  const distinctAVs = useMemo(() => {
    const set = new Set<string>()
    endpoints.forEach((e) => e.avPresent && set.add(e.avPresent))
    return Array.from(set).sort()
  }, [endpoints])

  // Count active column filters
  const activeColFilterCount = useMemo(() => {
    let count = 0
    if (colFilters.agentId) count++
    if (colFilters.hostname) count++
    if (colFilters.platform !== 'ALL') count++
    if (colFilters.ip) count++
    if (colFilters.status !== 'ALL') count++
    if (colFilters.lastScript !== 'ALL') count++
    if (colFilters.avPresent !== 'ALL') count++
    if (colFilters.evasionStatus !== 'ALL') count++
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
      agentId: '',
      hostname: '',
      platform: 'ALL',
      ip: '',
      status: 'ALL',
      lastScript: 'ALL',
      avPresent: 'ALL',
      evasionStatus: 'ALL',
    })
    setFilterOS('ALL')
    onSearchChange('')
  }

  // Filter and sort items
  const filtered = useMemo(() => {
    return endpoints
      .filter((ep) => {
        // Global search query
        const q = searchQuery.toLowerCase()
        const matchesGlobal =
          !q ||
          (ep.agentId?.toLowerCase() || '').includes(q) ||
          ep.name.toLowerCase().includes(q) ||
          (ep.hostname?.toLowerCase() || '').includes(q) ||
          (ep.ip || '').includes(q) ||
          (ep.avPresent?.toLowerCase() || '').includes(q) ||
          (ep.lastScript?.toLowerCase() || '').includes(q)

        // Quick OS filter
        const matchesQuickOS =
          filterOS === 'ALL' ||
          (filterOS === 'Windows' && ep.platform.includes('Windows')) ||
          (filterOS === 'Ubuntu' && ep.platform.includes('Ubuntu'))

        // Column-wise filters
        const matchesColAgentId =
          !colFilters.agentId ||
          (ep.agentId || '').toLowerCase().includes(colFilters.agentId.toLowerCase())

        const matchesColHostname =
          !colFilters.hostname ||
          (ep.hostname || ep.name).toLowerCase().includes(colFilters.hostname.toLowerCase())

        const matchesColPlatform =
          colFilters.platform === 'ALL' || ep.platform === colFilters.platform

        const matchesColIp =
          !colFilters.ip || (ep.ip || '').includes(colFilters.ip)

        const matchesColStatus =
          colFilters.status === 'ALL' ||
          (colFilters.status === 'Active' && (ep.status === 'Healthy' || ep.color === 'emerald')) ||
          (colFilters.status === 'Monitoring' && (ep.status === 'Degraded' || ep.color === 'sky')) ||
          (colFilters.status === 'Idle' && ep.status !== 'Healthy' && ep.status !== 'Degraded')

        const matchesColScript =
          colFilters.lastScript === 'ALL' || ep.lastScript === colFilters.lastScript

        const matchesColAV =
          colFilters.avPresent === 'ALL' || ep.avPresent === colFilters.avPresent

        const isEvaded = ep.evasionStatus === 'Evaded' || ep.color === 'emerald'
        const matchesColEvasion =
          colFilters.evasionStatus === 'ALL' ||
          (colFilters.evasionStatus === 'Evaded' && isEvaded) ||
          (colFilters.evasionStatus === 'Monitoring' && !isEvaded)

        return (
          matchesGlobal &&
          matchesQuickOS &&
          matchesColAgentId &&
          matchesColHostname &&
          matchesColPlatform &&
          matchesColIp &&
          matchesColStatus &&
          matchesColScript &&
          matchesColAV &&
          matchesColEvasion
        )
      })
      .sort((a, b) => {
        if (!sortCol || !sortDir) return 0

        let valA = ''
        let valB = ''

        switch (sortCol) {
          case 'agentId':
            valA = a.agentId || ''
            valB = b.agentId || ''
            break
          case 'hostname':
            valA = a.hostname || a.name
            valB = b.hostname || b.name
            break
          case 'platform':
            valA = a.platform
            valB = b.platform
            break
          case 'ip':
            valA = a.ip || ''
            valB = b.ip || ''
            break
          case 'status':
            valA = a.status
            valB = b.status
            break
          case 'lastScript':
            valA = a.lastScript || ''
            valB = b.lastScript || ''
            break
          case 'avPresent':
            valA = a.avPresent || ''
            valB = b.avPresent || ''
            break
          case 'evasionStatus':
            valA = a.evasionStatus || ''
            valB = b.evasionStatus || ''
            break
        }

        const cmp = valA.localeCompare(valB)
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [endpoints, searchQuery, filterOS, colFilters, sortCol, sortDir])

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

  return (
    <Card className="overflow-hidden border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-2xs transition-colors" aria-labelledby="endpoint-agents-title">
      {/* Header bar */}
      <div className="flex flex-col gap-3 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] px-4 py-3 sm:flex-row sm:items-center sm:justify-between transition-colors">
        <div className="flex items-center gap-2.5">
          <Server className="size-4 text-[#0969da] dark:text-[#58a6ff]" />
          <h3 id="endpoint-agents-title" className="text-xs font-bold uppercase tracking-wider text-[#1f2328] dark:text-[#f0f6fc]">
            Endpoint Agents ({filtered.length}{filtered.length !== totalCount ? ` / ${totalCount}` : ''})
          </h3>
          <span className="hidden sm:inline-block rounded bg-[#dafbe1] dark:bg-[#238636]/20 px-2 py-0.5 text-[10px] font-bold text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b]/40 dark:border-[#238636]/40">
            24 / 24 Connected
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Column Filters Toggle Button */}
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
          {(activeColFilterCount > 0 || searchQuery || filterOS !== 'ALL') && (
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

          {/* Global search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#656d76] dark:text-[#8b949e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search all..."
              className="w-32 sm:w-44 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] pl-8 pr-3 py-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none transition-colors"
            />
          </div>

          {/* OS Quick switch */}
          <div className="flex items-center rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setFilterOS('ALL')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                filterOS === 'ALL'
                  ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] shadow-2xs border border-[#d0d7de] dark:border-[#30363d]'
                  : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterOS('Windows')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                filterOS === 'Windows'
                  ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] shadow-2xs border border-[#d0d7de] dark:border-[#30363d]'
                  : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
              }`}
            >
              Win
            </button>
            <button
              type="button"
              onClick={() => setFilterOS('Ubuntu')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                filterOS === 'Ubuntu'
                  ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] shadow-2xs border border-[#d0d7de] dark:border-[#30363d]'
                  : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
              }`}
            >
              Lnx
            </button>
          </div>
        </div>
      </div>

      {/* Table Body with Column Filters */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {/* Main Header Row with Column Sorting */}
            <tr className="border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] font-semibold text-[#1f2328] dark:text-[#e6edf3]">
              <th
                onClick={() => handleSort('agentId')}
                className="py-2.5 px-4 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Agent ID</span>
                  {renderSortIcon('agentId')}
                </div>
              </th>

              <th
                onClick={() => handleSort('hostname')}
                className="py-2.5 px-3 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Hostname</span>
                  {renderSortIcon('hostname')}
                </div>
              </th>

              <th
                onClick={() => handleSort('platform')}
                className="py-2.5 px-3 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>OS</span>
                  {renderSortIcon('platform')}
                </div>
              </th>

              <th
                onClick={() => handleSort('ip')}
                className="py-2.5 px-3 font-mono cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>IP Address</span>
                  {renderSortIcon('ip')}
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
                onClick={() => handleSort('lastScript')}
                className="py-2.5 px-3 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Last Script</span>
                  {renderSortIcon('lastScript')}
                </div>
              </th>

              <th
                onClick={() => handleSort('avPresent')}
                className="py-2.5 px-3 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>AV Present</span>
                  {renderSortIcon('avPresent')}
                </div>
              </th>

              <th
                onClick={() => handleSort('evasionStatus')}
                className="py-2.5 px-3 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Evasion Status</span>
                  {renderSortIcon('evasionStatus')}
                </div>
              </th>
            </tr>

            {/* Column-Wise Filter Inputs Row */}
            {showColumnFilters && (
              <tr className="border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa]/80 dark:bg-[#161b22] text-[11px]">
                {/* Agent ID Filter */}
                <th className="py-2 px-3 font-normal">
                  <div className="relative">
                    <input
                      type="text"
                      value={colFilters.agentId}
                      onChange={(e) => setColFilters({ ...colFilters, agentId: e.target.value })}
                      placeholder="Filter ID..."
                      className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none"
                    />
                    {colFilters.agentId && (
                      <button
                        type="button"
                        onClick={() => setColFilters({ ...colFilters, agentId: '' })}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#656d76] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                </th>

                {/* Hostname Filter */}
                <th className="py-2 px-2 font-normal">
                  <div className="relative">
                    <input
                      type="text"
                      value={colFilters.hostname}
                      onChange={(e) => setColFilters({ ...colFilters, hostname: e.target.value })}
                      placeholder="Filter host..."
                      className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none"
                    />
                    {colFilters.hostname && (
                      <button
                        type="button"
                        onClick={() => setColFilters({ ...colFilters, hostname: '' })}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#656d76] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                </th>

                {/* Platform OS Filter */}
                <th className="py-2 px-2 font-normal">
                  <select
                    value={colFilters.platform}
                    onChange={(e) => setColFilters({ ...colFilters, platform: e.target.value })}
                    className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-1.5 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All OS</option>
                    {distinctPlatforms.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </th>

                {/* IP Filter */}
                <th className="py-2 px-2 font-normal">
                  <div className="relative">
                    <input
                      type="text"
                      value={colFilters.ip}
                      onChange={(e) => setColFilters({ ...colFilters, ip: e.target.value })}
                      placeholder="10.42..."
                      className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none font-mono"
                    />
                    {colFilters.ip && (
                      <button
                        type="button"
                        onClick={() => setColFilters({ ...colFilters, ip: '' })}
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
                    <option value="Active">Active</option>
                    <option value="Monitoring">Monitoring</option>
                    <option value="Idle">Idle</option>
                  </select>
                </th>

                {/* Last Script Filter */}
                <th className="py-2 px-2 font-normal">
                  <select
                    value={colFilters.lastScript}
                    onChange={(e) => setColFilters({ ...colFilters, lastScript: e.target.value })}
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

                {/* AV Present Filter */}
                <th className="py-2 px-2 font-normal">
                  <select
                    value={colFilters.avPresent}
                    onChange={(e) => setColFilters({ ...colFilters, avPresent: e.target.value })}
                    className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-1.5 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All AV/EDR</option>
                    {distinctAVs.map((av) => (
                      <option key={av} value={av}>
                        {av}
                      </option>
                    ))}
                  </select>
                </th>

                {/* Evasion Status Filter */}
                <th className="py-2 px-3 font-normal">
                  <select
                    value={colFilters.evasionStatus}
                    onChange={(e) => setColFilters({ ...colFilters, evasionStatus: e.target.value })}
                    className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-1.5 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Evasion</option>
                    <option value="Evaded">Evaded</option>
                    <option value="Monitoring">Monitoring</option>
                  </select>
                </th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-[#d0d7de]/50 dark:divide-[#30363d] bg-white dark:bg-[#161b22]">
            {filtered.map((ep) => {
              const isSelected = selectedEndpoint === ep.name
              const isHealthy = ep.status === 'Healthy' || ep.color === 'emerald' || ep.color === 'sky'
              const isDegraded = ep.status === 'Degraded' || ep.color === 'amber'
              const isEvaded = ep.evasionStatus === 'Evaded' || ep.color === 'emerald'
              const statusText = isHealthy ? 'Active' : isDegraded ? 'Monitoring' : 'Idle'

              return (
                <tr
                  key={ep.agentId || ep.name}
                  onClick={() => onSelectEndpoint(ep.name)}
                  className={`group cursor-pointer transition-colors hover:bg-[#f6f8fa] dark:hover:bg-[#1f242c] ${
                    isSelected ? 'bg-[#eaeef2] dark:bg-[#21262d]' : ''
                  }`}
                >
                  {/* Agent ID */}
                  <td className="py-3 px-4 font-mono font-bold text-[#0969da] dark:text-[#58a6ff]">
                    {ep.agentId || 'AGT-8401'}
                  </td>

                  {/* Hostname */}
                  <td className="py-3 px-3 font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                    <div className="flex items-center gap-1.5">
                      <span>{ep.hostname || ep.name}</span>
                    </div>
                  </td>

                  {/* OS */}
                  <td className="py-3 px-3 text-[#656d76] dark:text-[#8b949e]">
                    <span>{ep.platform}</span>
                  </td>

                  {/* IP */}
                  <td className="py-3 px-3 font-mono text-[#656d76] dark:text-[#8b949e] text-[11px]">
                    {ep.ip || '10.42.18.91'}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    <span className={`text-[11px] font-semibold ${
                      statusText === 'Active'
                        ? 'text-[#1a7f37] dark:text-[#3fb950]'
                        : statusText === 'Monitoring'
                        ? 'text-[#9a6700] dark:text-[#d29922]'
                        : 'text-[#656d76] dark:text-[#8b949e]'
                    }`}>
                      {statusText}
                    </span>
                  </td>

                  {/* Last Script (.go) */}
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onNavigateScript) {
                          onNavigateScript(ep.lastScript || 'mem_dump.go')
                        }
                      }}
                      className="inline-flex items-center rounded bg-[#f6f8fa] dark:bg-[#21262d] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#1f2328] dark:text-[#e6edf3] border border-[#d0d7de] dark:border-[#30363d] hover:border-[#0969da] hover:text-[#0969da] dark:hover:border-[#58a6ff] dark:hover:text-[#58a6ff] hover:bg-[#ddf4ff]/50 dark:hover:bg-[#388bfd]/10 transition-colors cursor-pointer"
                      title={`Inspect ${ep.lastScript || 'mem_dump.go'} in Go Compiler IDE`}
                    >
                      {ep.lastScript || 'mem_dump.go'}
                    </button>
                  </td>

                  {/* AV Present */}
                  <td className="py-3 px-3 font-medium text-[#1f2328] dark:text-[#e6edf3]">
                    {ep.avPresent || 'CrowdStrike Falcon 7.14'}
                  </td>

                  {/* Evasion Status */}
                  <td className="py-3 px-3">
                    <span
                      className={`font-semibold text-[11px] ${
                        isEvaded ? 'text-[#1a7f37] dark:text-[#3fb950]' : 'text-[#9a6700] dark:text-[#d29922]'
                      }`}
                    >
                      {isEvaded ? 'Evaded' : 'Monitoring'}
                    </span>
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
                      No endpoint agents match the current column filters
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
          Showing {filtered.length} of {totalCount} agents · Last beacon 3s ago via Secure Relay
          {activeColFilterCount > 0 && ` · (${activeColFilterCount} column filter${activeColFilterCount > 1 ? 's' : ''} active)`}
        </span>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition-colors cursor-pointer"
          >
            Manage Agents & Configurations <ChevronRight className="size-3" />
          </button>
        )}
      </div>
    </Card>
  )
})
