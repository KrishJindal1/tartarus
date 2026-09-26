'use client'

import React, { useState, useMemo } from 'react'
import {
  Filter,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  RotateCcw,
  BarChart2,
} from 'lucide-react'
import { Card, useToast } from '@/components/ui'
import { DestinationViewShell } from './destination-view-shell'
import { CompareRunsModal, InspectRunModal } from '@/components/modals'
import { ForensicRecordsTable } from '@/components/dashboard'
import { forensicRecordsData } from '@/data/forensicRecords'

interface ResultsViewProps {
  onRun: () => void
  onExport: () => void
}

interface RunResultItem {
  run: string
  passRate: string
  duration: string
  findings: string
  status: 'Passed' | 'Running' | 'Warning' | 'Failed'
}

const runResults: RunResultItem[] = [
  { run: 'mem_dump.go', passRate: '100%', duration: '48s', findings: '14 VAD anomalies', status: 'Passed' },
  { run: 'proc_hollow_scan.go', passRate: '98.6%', duration: 'In progress', findings: '3 C2 descriptors', status: 'Running' },
  { run: 'kernel_enum.go', passRate: '100%', duration: '1m 12s', findings: '1 Hooked callback', status: 'Passed' },
  { run: 'registry_forensic.go', passRate: '96.1%', duration: '35s', findings: '1 Null-byte runkey', status: 'Warning' },
  { run: 'net_pcap.go', passRate: '100%', duration: '2m 04s', findings: 'DNS exfil channel', status: 'Passed' },
  { run: 'api_unhook.go', passRate: '100%', duration: '19s', findings: '12 Hooks unhooked', status: 'Passed' },
]

type SortColumn = 'run' | 'passRate' | 'duration' | 'findings' | 'status'
type SortDirection = 'asc' | 'desc' | null

export function ResultsView({ onRun, onExport }: ResultsViewProps) {
  const { toast } = useToast()
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [selectedInspectRun, setSelectedInspectRun] = useState<string | null>(null)

  // Benchmark table state
  const [showBenchFilters, setShowBenchFilters] = useState(true)
  const [benchSearch, setBenchSearch] = useState('')
  const [benchColFilters, setBenchColFilters] = useState({
    run: '',
    passRate: '',
    duration: '',
    findings: '',
    status: 'ALL',
  })
  const [benchSortCol, setBenchSortCol] = useState<SortColumn | null>(null)
  const [benchSortDir, setBenchSortDir] = useState<SortDirection>(null)

  const activeBenchFilterCount = useMemo(() => {
    let count = 0
    if (benchColFilters.run) count++
    if (benchColFilters.passRate) count++
    if (benchColFilters.duration) count++
    if (benchColFilters.findings) count++
    if (benchColFilters.status !== 'ALL') count++
    return count
  }, [benchColFilters])

  const handleBenchSort = (col: SortColumn) => {
    if (benchSortCol === col) {
      if (benchSortDir === 'asc') setBenchSortDir('desc')
      else if (benchSortDir === 'desc') {
        setBenchSortCol(null)
        setBenchSortDir(null)
      }
    } else {
      setBenchSortCol(col)
      setBenchSortDir('asc')
    }
  }

  const resetBenchFilters = () => {
    setBenchColFilters({
      run: '',
      passRate: '',
      duration: '',
      findings: '',
      status: 'ALL',
    })
    setBenchSearch('')
  }

  const filteredRunResults = useMemo(() => {
    return runResults
      .filter((row) => {
        const q = benchSearch.toLowerCase()
        const matchesGlobal =
          !q ||
          row.run.toLowerCase().includes(q) ||
          row.passRate.toLowerCase().includes(q) ||
          row.duration.toLowerCase().includes(q) ||
          row.findings.toLowerCase().includes(q) ||
          row.status.toLowerCase().includes(q)

        const matchesColRun =
          !benchColFilters.run || row.run.toLowerCase().includes(benchColFilters.run.toLowerCase())

        const matchesColPassRate =
          !benchColFilters.passRate || row.passRate.toLowerCase().includes(benchColFilters.passRate.toLowerCase())

        const matchesColDuration =
          !benchColFilters.duration || row.duration.toLowerCase().includes(benchColFilters.duration.toLowerCase())

        const matchesColFindings =
          !benchColFilters.findings || row.findings.toLowerCase().includes(benchColFilters.findings.toLowerCase())

        const matchesColStatus =
          benchColFilters.status === 'ALL' || row.status === benchColFilters.status

        return (
          matchesGlobal &&
          matchesColRun &&
          matchesColPassRate &&
          matchesColDuration &&
          matchesColFindings &&
          matchesColStatus
        )
      })
      .sort((a, b) => {
        if (!benchSortCol || !benchSortDir) return 0

        const valA = a[benchSortCol]
        const valB = b[benchSortCol]

        const cmp = valA.localeCompare(valB)
        return benchSortDir === 'asc' ? cmp : -cmp
      })
  }, [benchSearch, benchColFilters, benchSortCol, benchSortDir])

  const renderSortIcon = (col: SortColumn) => {
    if (benchSortCol !== col) {
      return <ArrowUpDown className="size-3 text-[#656d76] dark:text-[#8b949e] opacity-40 group-hover/th:opacity-100 transition-opacity" />
    }
    return benchSortDir === 'asc' ? (
      <ArrowUp className="size-3 text-[#0969da] dark:text-[#58a6ff] font-bold" />
    ) : (
      <ArrowDown className="size-3 text-[#0969da] dark:text-[#58a6ff] font-bold" />
    )
  }

  const buttonClass =
    'rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] px-3 py-1.5 text-xs font-medium text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors shadow-2xs cursor-pointer'

  return (
    <>
      <DestinationViewShell name="Results" onRun={onRun} onExport={onExport}>
        <div className="flex flex-col gap-6">
          {/* Granular Immutable Forensic Records Table */}
          <ForensicRecordsTable
            records={forensicRecordsData}
            onExportRecords={onExport}
          />

          {/* Execution Telemetry Benchmark Summary */}
          <Card className="border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#d0d7de] dark:border-[#30363d] p-4 sm:flex-row sm:items-center sm:justify-between bg-[#f6f8fa] dark:bg-[#161b22]">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart2 className="size-4 text-[#0969da] dark:text-[#58a6ff]" />
                  <h3 className="text-sm font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                    Run Comparison & Benchmark ({filteredRunResults.length}{filteredRunResults.length !== runResults.length ? ` / ${runResults.length}` : ''})
                  </h3>
                </div>
                <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">
                  Compare telemetry and diagnostic outcomes across recent executions.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Column Filters Toggle */}
                <button
                  type="button"
                  onClick={() => setShowBenchFilters(!showBenchFilters)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                    showBenchFilters || activeBenchFilterCount > 0
                      ? 'bg-[#eaeef2] dark:bg-[#30363d] border-[#8c959f] dark:border-[#8b949e] text-[#1f2328] dark:text-[#f0f6fc]'
                      : 'bg-white dark:bg-[#21262d] border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d]'
                  }`}
                  title="Toggle column-wise filters"
                >
                  <Filter className="size-3.5" />
                  <span>Column Filters</span>
                  {activeBenchFilterCount > 0 && (
                    <span className="rounded-full bg-[#d0d7de] text-[#1f2328] dark:bg-[#484f58] dark:text-[#f0f6fc] px-1.5 py-0.2 text-[10px] font-bold">
                      {activeBenchFilterCount}
                    </span>
                  )}
                </button>

                {/* Reset button */}
                {(activeBenchFilterCount > 0 || benchSearch) && (
                  <button
                    type="button"
                    onClick={resetBenchFilters}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-[#656d76] dark:text-[#8b949e] hover:text-[#cf222e] dark:hover:text-[#f85149] hover:bg-[#ffebe9] dark:hover:bg-[#21262d] border border-transparent transition-colors cursor-pointer"
                    title="Reset all filters"
                  >
                    <RotateCcw className="size-3" />
                    <span>Reset</span>
                  </button>
                )}

                {/* Quick Search */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#656d76] dark:text-[#8b949e]" />
                  <input
                    type="text"
                    value={benchSearch}
                    onChange={(e) => setBenchSearch(e.target.value)}
                    placeholder="Search runs..."
                    className="w-32 sm:w-40 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] pl-8 pr-3 py-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsCompareOpen(true)}
                  className={buttonClass}
                >
                  Compare runs
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f6f8fa] dark:bg-[#0d1117] text-[#1f2328] dark:text-[#e6edf3] border-b border-[#d0d7de] dark:border-[#30363d] font-semibold">
                  {/* Main header with sorting */}
                  <tr>
                    <th
                      onClick={() => handleBenchSort('run')}
                      className="p-3.5 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>Script Run (.go)</span>
                        {renderSortIcon('run')}
                      </div>
                    </th>

                    <th
                      onClick={() => handleBenchSort('passRate')}
                      className="p-3.5 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>AV Evasion</span>
                        {renderSortIcon('passRate')}
                      </div>
                    </th>

                    <th
                      onClick={() => handleBenchSort('duration')}
                      className="p-3.5 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>Duration</span>
                        {renderSortIcon('duration')}
                      </div>
                    </th>

                    <th
                      onClick={() => handleBenchSort('findings')}
                      className="p-3.5 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>Findings</span>
                        {renderSortIcon('findings')}
                      </div>
                    </th>

                    <th
                      onClick={() => handleBenchSort('status')}
                      className="p-3.5 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>Status</span>
                        {renderSortIcon('status')}
                      </div>
                    </th>

                    <th className="p-3.5 font-semibold text-right">Action</th>
                  </tr>

                  {/* Column Filters Row */}
                  {showBenchFilters && (
                    <tr className="border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa]/80 dark:bg-[#161b22] text-[11px]">
                      {/* Script Run Filter */}
                      <th className="py-2 px-3 font-normal">
                        <div className="relative">
                          <input
                            type="text"
                            value={benchColFilters.run}
                            onChange={(e) => setBenchColFilters({ ...benchColFilters, run: e.target.value })}
                            placeholder="Filter script..."
                            className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none font-mono"
                          />
                          {benchColFilters.run && (
                            <button
                              type="button"
                              onClick={() => setBenchColFilters({ ...benchColFilters, run: '' })}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#656d76] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                            >
                              <X className="size-3" />
                            </button>
                          )}
                        </div>
                      </th>

                      {/* AV Evasion Filter */}
                      <th className="py-2 px-3 font-normal">
                        <div className="relative">
                          <input
                            type="text"
                            value={benchColFilters.passRate}
                            onChange={(e) => setBenchColFilters({ ...benchColFilters, passRate: e.target.value })}
                            placeholder="e.g. 100%"
                            className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none"
                          />
                          {benchColFilters.passRate && (
                            <button
                              type="button"
                              onClick={() => setBenchColFilters({ ...benchColFilters, passRate: '' })}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#656d76] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                            >
                              <X className="size-3" />
                            </button>
                          )}
                        </div>
                      </th>

                      {/* Duration Filter */}
                      <th className="py-2 px-3 font-normal">
                        <div className="relative">
                          <input
                            type="text"
                            value={benchColFilters.duration}
                            onChange={(e) => setBenchColFilters({ ...benchColFilters, duration: e.target.value })}
                            placeholder="e.g. 48s"
                            className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none font-mono"
                          />
                          {benchColFilters.duration && (
                            <button
                              type="button"
                              onClick={() => setBenchColFilters({ ...benchColFilters, duration: '' })}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#656d76] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                            >
                              <X className="size-3" />
                            </button>
                          )}
                        </div>
                      </th>

                      {/* Findings Filter */}
                      <th className="py-2 px-3 font-normal">
                        <div className="relative">
                          <input
                            type="text"
                            value={benchColFilters.findings}
                            onChange={(e) => setBenchColFilters({ ...benchColFilters, findings: e.target.value })}
                            placeholder="Filter findings..."
                            className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none"
                          />
                          {benchColFilters.findings && (
                            <button
                              type="button"
                              onClick={() => setBenchColFilters({ ...benchColFilters, findings: '' })}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#656d76] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                            >
                              <X className="size-3" />
                            </button>
                          )}
                        </div>
                      </th>

                      {/* Status Filter */}
                      <th className="py-2 px-3 font-normal">
                        <select
                          value={benchColFilters.status}
                          onChange={(e) => setBenchColFilters({ ...benchColFilters, status: e.target.value })}
                          className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-1.5 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none cursor-pointer"
                        >
                          <option value="ALL">All Status</option>
                          <option value="Passed">Passed</option>
                          <option value="Running">Running</option>
                          <option value="Warning">Warning</option>
                        </select>
                      </th>

                      <th className="py-2 px-4"></th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-[#d0d7de]/50 dark:divide-[#30363d] bg-white dark:bg-[#161b22]">
                  {filteredRunResults.map((row) => (
                    <tr key={row.run} className="text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#1f242c] transition-colors">
                      <td className="p-3.5 font-semibold text-[#1f2328] dark:text-[#f0f6fc] font-mono">{row.run}</td>
                      <td className="p-3.5 font-semibold text-[#1a7f37] dark:text-[#3fb950]">{row.passRate}</td>
                      <td className="p-3.5 font-mono text-[#656d76] dark:text-[#8b949e]">{row.duration}</td>
                      <td className="p-3.5 font-mono">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            row.status === 'Passed'
                              ? 'bg-[#dafbe1] dark:bg-[#238636]/20 text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b]/40 dark:border-[#238636]/40'
                              : 'bg-[#fff8c5] dark:bg-[#d29922]/15 text-[#9a6700] dark:text-[#d29922] border border-[#d4a72c]/40 dark:border-[#d29922]/30'
                          }`}
                        >
                          {row.findings}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-xs font-semibold ${
                            row.status === 'Passed' ? 'text-[#1a7f37] dark:text-[#3fb950]' : 'text-[#9a6700] dark:text-[#d29922]'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedInspectRun(row.run)}
                          className="font-medium text-[#0969da] dark:text-[#58a6ff] hover:underline cursor-pointer"
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredRunResults.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-[#656d76] dark:text-[#8b949e]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Filter className="size-5 text-[#656d76] dark:text-[#8b949e]" />
                          <p>No benchmark runs match the active column filters.</p>
                          <button
                            type="button"
                            onClick={resetBenchFilters}
                            className="mt-1 rounded bg-[#ddf4ff] dark:bg-[#21262d] px-2.5 py-1 text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] border border-[#54aeff]/40 dark:border-[#30363d] hover:bg-[#b6e3ff] dark:hover:bg-[#30363d] cursor-pointer"
                          >
                            Reset filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </DestinationViewShell>

      <CompareRunsModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />

      <InspectRunModal
        runName={selectedInspectRun}
        isOpen={!!selectedInspectRun}
        onClose={() => setSelectedInspectRun(null)}
      />
    </>
  )
}
