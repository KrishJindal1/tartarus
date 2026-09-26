'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Settings2, Search, Filter, RotateCcw, Terminal, Server } from 'lucide-react'
import { Card, StatusDot, Badge, useToast } from '@/components/ui'
import { DestinationViewShell } from './destination-view-shell'
import { AddEndpointModal, ConfigureEndpointModal } from '@/components/modals'
import { Endpoint } from '@/types'

interface EndpointsViewProps {
  endpoints: Endpoint[]
  onRun: () => void
  onExport: () => void
  onAddEndpoint: (endpoint: Endpoint) => void
  onUpdateEndpoint: (endpoint: Endpoint) => void
  onDeleteEndpoint: (name: string) => void
  onNavigateScript?: (scriptName: string) => void
}

export function EndpointsView({
  endpoints,
  onRun,
  onExport,
  onAddEndpoint,
  onUpdateEndpoint,
  onDeleteEndpoint,
  onNavigateScript,
}: EndpointsViewProps) {
  const { toast } = useToast()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedConfigEndpoint, setSelectedConfigEndpoint] = useState<Endpoint | null>(null)

  // Filtering state
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [methodFilter, setMethodFilter] = useState('ALL')

  const distinctPlatforms = useMemo(() => {
    const set = new Set<string>()
    endpoints.forEach((e) => e.platform && set.add(e.platform))
    return Array.from(set).sort()
  }, [endpoints])

  const distinctMethods = useMemo(() => {
    const set = new Set<string>()
    endpoints.forEach((e) => e.method && set.add(e.method))
    return Array.from(set).sort()
  }, [endpoints])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (platformFilter !== 'ALL') count++
    if (statusFilter !== 'ALL') count++
    if (methodFilter !== 'ALL') count++
    return count
  }, [platformFilter, statusFilter, methodFilter])

  const resetFilters = () => {
    setSearch('')
    setPlatformFilter('ALL')
    setStatusFilter('ALL')
    setMethodFilter('ALL')
  }

  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        ep.name.toLowerCase().includes(q) ||
        (ep.agentId?.toLowerCase() || '').includes(q) ||
        (ep.hostname?.toLowerCase() || '').includes(q) ||
        (ep.ip || '').includes(q) ||
        ep.url.toLowerCase().includes(q) ||
        (ep.avPresent?.toLowerCase() || '').includes(q) ||
        (ep.lastScript?.toLowerCase() || '').includes(q)

      const matchesPlatform =
        platformFilter === 'ALL' || ep.platform === platformFilter

      const matchesStatus =
        statusFilter === 'ALL' || ep.status === statusFilter

      const matchesMethod =
        methodFilter === 'ALL' || ep.method === methodFilter

      return matchesSearch && matchesPlatform && matchesStatus && matchesMethod
    })
  }, [endpoints, search, platformFilter, statusFilter, methodFilter])

  const handleAdd = (endpoint: Endpoint) => {
    onAddEndpoint(endpoint)
    toast(`Endpoint "${endpoint.name}" registered successfully!`, 'success')
  }

  const handleSaveConfig = (updated: Endpoint) => {
    onUpdateEndpoint(updated)
    toast(`Updated configuration for "${updated.name}"`, 'info')
  }

  const handleDelete = (name: string) => {
    onDeleteEndpoint(name)
    toast(`Removed endpoint "${name}"`, 'error')
  }

  return (
    <>
      <DestinationViewShell name="Endpoints" onRun={onRun} onExport={onExport}>
        <Card className="overflow-hidden border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-2xs">
          {/* Header & Filter Controls Bar */}
          <div className="flex flex-col gap-3 border-b border-[#d0d7de] dark:border-[#30363d] p-3.5 sm:flex-row sm:items-center sm:justify-between bg-[#f6f8fa] dark:bg-[#161b22]">
            <div className="flex items-center gap-2">
              <Server className="size-4 text-[#0969da] dark:text-[#58a6ff]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1f2328] dark:text-[#f0f6fc]">
                Route Registry ({filteredEndpoints.length}{filteredEndpoints.length !== endpoints.length ? ` / ${endpoints.length}` : ''})
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Reset Filters */}
              {(activeFilterCount > 0 || search) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#656d76] dark:text-[#8b949e] hover:text-[#cf222e] dark:hover:text-[#f85149] hover:bg-[#ffebe9] dark:hover:bg-[#21262d] transition-colors cursor-pointer"
                >
                  <RotateCcw className="size-3" /> Reset
                </button>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#656d76] dark:text-[#8b949e]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search routes..."
                  className="w-32 sm:w-44 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] pl-8 pr-3 py-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none"
                />
              </div>

              {/* Platform Filter */}
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2.5 py-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none cursor-pointer"
              >
                <option value="ALL">All Platforms</option>
                {distinctPlatforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2.5 py-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="Healthy">Healthy / Active</option>
                <option value="Degraded">Degraded / Monitoring</option>
                <option value="Down">Down / Idle</option>
              </select>

              {/* Method Filter */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2.5 py-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none cursor-pointer"
              >
                <option value="ALL">All Methods</option>
                {distinctMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="rounded-md bg-[#1f883d] dark:bg-[#238636] hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="mr-1 inline size-3.5" /> Add Endpoint
              </button>
            </div>
          </div>

          {/* Compact Proportional Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] font-semibold text-[#1f2328] dark:text-[#e6edf3]">
                  <th className="py-2.5 px-4">Target & Route</th>
                  <th className="py-2.5 px-3">Platform & Protection</th>
                  <th className="py-2.5 px-3">Active Routine</th>
                  <th className="py-2.5 px-3">Health & Latency</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]/50 dark:divide-[#30363d] bg-white dark:bg-[#161b22]">
                {filteredEndpoints.map((endpoint) => (
                  <tr
                    key={endpoint.name}
                    className="hover:bg-[#f6f8fa] dark:hover:bg-[#1f242c] transition-colors"
                  >
                    {/* Column 1: Agent & Target */}
                    <td className="py-2.5 px-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#0969da] dark:text-[#58a6ff]">
                            {endpoint.agentId || 'AGT-8401'}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                            {endpoint.hostname || endpoint.name}
                          </span>
                          <span className="rounded bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-1.5 py-0.2 font-mono text-[10px] font-semibold text-[#1f2328] dark:text-[#8b949e]">
                            {endpoint.method}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-[#656d76] dark:text-[#8b949e] mt-0.5">
                          {endpoint.url} · {endpoint.ip || '10.42.18.91'}
                        </p>
                      </div>
                    </td>

                    {/* Column 2: Platform & AV */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#8b949e]">
                          {endpoint.platform}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#656d76] dark:text-[#8b949e]">
                        <span>{endpoint.avPresent || 'CrowdStrike Falcon'}</span>
                        <span className={`font-semibold shrink-0 ${endpoint.evasionStatus === 'Monitoring' ? 'text-[#9a6700] dark:text-[#d29922]' : 'text-[#1a7f37] dark:text-[#3fb950]'}`}>
                          {endpoint.evasionStatus || 'Evaded'}
                        </span>
                      </div>
                    </td>

                    {/* Column 3: Active Routine */}
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateScript) {
                            onNavigateScript(endpoint.lastScript || 'mem_dump.go')
                          }
                        }}
                        className="inline-flex items-center rounded bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 font-mono text-[11px] font-medium text-[#1f2328] dark:text-[#e6edf3] hover:border-[#0969da] hover:text-[#0969da] dark:hover:border-[#58a6ff] dark:hover:text-[#58a6ff] hover:bg-[#ddf4ff]/50 dark:hover:bg-[#388bfd]/10 transition-colors cursor-pointer"
                        title={`Inspect ${endpoint.lastScript || 'mem_dump.go'} in Go Compiler IDE`}
                      >
                        <span>{endpoint.lastScript || 'mem_dump.go'}</span>
                      </button>
                    </td>

                    {/* Column 4: Health & Latency */}
                    <td className="py-2.5 px-3">
                      <div className="text-xs font-semibold">
                        <span className={
                          endpoint.status === 'Healthy'
                            ? 'text-[#1a7f37] dark:text-[#3fb950]'
                            : endpoint.status === 'Degraded'
                            ? 'text-[#9a6700] dark:text-[#d29922]'
                            : 'text-[#656d76] dark:text-[#8b949e]'
                        }>
                          {endpoint.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#656d76] dark:text-[#8b949e] font-mono mt-0.5">
                        {endpoint.latency} · {endpoint.lastRun}
                      </div>
                    </td>

                    {/* Column 5: Action */}
                    <td className="py-2.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedConfigEndpoint(endpoint)}
                        className="inline-flex items-center gap-1 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] px-2.5 py-1 text-xs font-medium text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors shadow-2xs cursor-pointer"
                        title={`Configure ${endpoint.name}`}
                      >
                        <Settings2 className="size-3 text-[#656d76] dark:text-[#8b949e]" />
                        <span>Config</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredEndpoints.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-xs text-[#656d76] dark:text-[#8b949e]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Filter className="size-6 text-[#656d76] dark:text-[#8b949e]" />
                        <p className="font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                          No endpoints match your current filter selections.
                        </p>
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-1 inline-flex items-center gap-1 rounded bg-[#ddf4ff] dark:bg-[#21262d] px-3 py-1 text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] border border-[#54aeff]/40 dark:border-[#30363d] hover:bg-[#b6e3ff] dark:hover:bg-[#30363d] transition-colors cursor-pointer"
                        >
                          <RotateCcw className="size-3" /> Reset all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </DestinationViewShell>

      <AddEndpointModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAdd}
      />

      <ConfigureEndpointModal
        endpoint={selectedConfigEndpoint}
        isOpen={!!selectedConfigEndpoint}
        onClose={() => setSelectedConfigEndpoint(null)}
        onSave={handleSaveConfig}
        onDelete={handleDelete}
      />
    </>
  )
}
