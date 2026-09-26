'use client'

import React, { useState, useMemo } from 'react'
import {
  Binary,
  Search,
  Filter,
  Eye,
  ArrowDownToLine,
  CheckCircle2,
  FileCode,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  RotateCcw,
} from 'lucide-react'
import { Card, useToast } from '@/components/ui'
import { ForensicRecord } from '@/types'
import { ForensicRecordDetailModal } from '@/components/modals'

interface ForensicRecordsTableProps {
  records: ForensicRecord[]
  onExportRecords: () => void
}

type SortColumn =
  | 'id'
  | 'targetNode'
  | 'technique'
  | 'processContext'
  | 'collectedArtifact'
  | 'avEvasionStatus'
  | 'severity'

type SortDirection = 'asc' | 'desc' | null

export function ForensicRecordsTable({
  records,
  onExportRecords,
}: ForensicRecordsTableProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [showColumnFilters, setShowColumnFilters] = useState(true)
  const [inspectRecord, setInspectRecord] = useState<ForensicRecord | null>(null)

  // Column filter state
  const [colFilters, setColFilters] = useState({
    id: '',
    targetOS: 'ALL',
    technique: 'ALL',
    processContext: '',
    collectedArtifact: '',
    avEvasionStatus: 'ALL',
    severity: 'ALL',
  })

  // Sorting state
  const [sortCol, setSortCol] = useState<SortColumn | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)

  // Distinct values for select dropdowns
  const distinctOS = useMemo(() => {
    const set = new Set<string>()
    records.forEach((r) => r.targetOS && set.add(r.targetOS))
    return Array.from(set).sort()
  }, [records])

  const distinctTechniques = useMemo(() => {
    const set = new Set<string>()
    records.forEach((r) => r.technique && set.add(r.technique))
    return Array.from(set).sort()
  }, [records])

  const distinctAVStatuses = useMemo(() => {
    const set = new Set<string>()
    records.forEach((r) => r.avEvasionStatus && set.add(r.avEvasionStatus))
    return Array.from(set).sort()
  }, [records])

  // Count active column filters
  const activeColFilterCount = useMemo(() => {
    let count = 0
    if (colFilters.id) count++
    if (colFilters.targetOS !== 'ALL') count++
    if (colFilters.technique !== 'ALL') count++
    if (colFilters.processContext) count++
    if (colFilters.collectedArtifact) count++
    if (colFilters.avEvasionStatus !== 'ALL') count++
    if (colFilters.severity !== 'ALL') count++
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
      targetOS: 'ALL',
      technique: 'ALL',
      processContext: '',
      collectedArtifact: '',
      avEvasionStatus: 'ALL',
      severity: 'ALL',
    })
    setSearch('')
  }

  const filtered = useMemo(() => {
    return records
      .filter((r) => {
        const q = search.toLowerCase()
        const matchesGlobal =
          !q ||
          r.id.toLowerCase().includes(q) ||
          r.targetNode.toLowerCase().includes(q) ||
          r.processContext.toLowerCase().includes(q) ||
          r.collectedArtifact.toLowerCase().includes(q) ||
          r.technique.toLowerCase().includes(q)

        // Column filters
        const matchesColId =
          !colFilters.id ||
          r.id.toLowerCase().includes(colFilters.id.toLowerCase()) ||
          r.timestamp.toLowerCase().includes(colFilters.id.toLowerCase())

        const matchesColOS =
          colFilters.targetOS === 'ALL' ||
          r.targetOS === colFilters.targetOS ||
          r.targetNode.toLowerCase().includes(colFilters.targetOS.toLowerCase())

        const matchesColTechnique =
          colFilters.technique === 'ALL' || r.technique === colFilters.technique

        const matchesColProcess =
          !colFilters.processContext ||
          r.processContext.toLowerCase().includes(colFilters.processContext.toLowerCase()) ||
          String(r.pid).includes(colFilters.processContext)

        const matchesColArtifact =
          !colFilters.collectedArtifact ||
          r.collectedArtifact.toLowerCase().includes(colFilters.collectedArtifact.toLowerCase())

        const matchesColAV =
          colFilters.avEvasionStatus === 'ALL' || r.avEvasionStatus === colFilters.avEvasionStatus

        const matchesColSeverity =
          colFilters.severity === 'ALL' || r.severity === colFilters.severity

        return (
          matchesGlobal &&
          matchesColId &&
          matchesColOS &&
          matchesColTechnique &&
          matchesColProcess &&
          matchesColArtifact &&
          matchesColAV &&
          matchesColSeverity
        )
      })
      .sort((a, b) => {
        if (!sortCol || !sortDir) return 0

        let valA = ''
        let valB = ''

        switch (sortCol) {
          case 'id':
            valA = a.id
            valB = b.id
            break
          case 'targetNode':
            valA = a.targetNode
            valB = b.targetNode
            break
          case 'technique':
            valA = a.technique
            valB = b.technique
            break
          case 'processContext':
            valA = a.processContext
            valB = b.processContext
            break
          case 'collectedArtifact':
            valA = a.collectedArtifact
            valB = b.collectedArtifact
            break
          case 'avEvasionStatus':
            valA = a.avEvasionStatus
            valB = b.avEvasionStatus
            break
          case 'severity':
            valA = a.severity
            valB = b.severity
            break
        }

        const cmp = valA.localeCompare(valB)
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [records, search, colFilters, sortCol, sortDir])

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

  const severityBadge = (sev: ForensicRecord['severity']) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="rounded-full bg-[#ffebe9] dark:bg-[#f85149]/20 text-[#cf222e] dark:text-[#f85149] border border-[#ff8182]/40 dark:border-[#f85149]/30 px-2 py-0.5 text-[10px] font-bold">CRITICAL</span>
      case 'HIGH':
        return <span className="rounded-full bg-[#fff8c5] dark:bg-[#d29922]/15 text-[#9a6700] dark:text-[#d29922] border border-[#d4a72c]/40 dark:border-[#d29922]/30 px-2 py-0.5 text-[10px] font-bold">HIGH</span>
      case 'MEDIUM':
        return <span className="rounded-full bg-[#ddf4ff] dark:bg-[#388bfd]/15 text-[#0969da] dark:text-[#58a6ff] border border-[#54aeff]/40 dark:border-[#388bfd]/30 px-2 py-0.5 text-[10px] font-bold">MEDIUM</span>
      case 'LOW':
        return <span className="rounded-full bg-[#dafbe1] dark:bg-[#238636]/20 text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b]/40 dark:border-[#238636]/40 px-2 py-0.5 text-[10px] font-bold">LOW</span>
    }
  }

  return (
    <>
      <Card aria-labelledby="forensic-records-title" className="border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#d0d7de] dark:border-[#30363d] p-4 sm:flex-row sm:items-center sm:justify-between bg-[#f6f8fa] dark:bg-[#161b22]">
          <div>
            <h3 id="forensic-records-title" className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
              Extracted Forensic Records & System Telemetry ({filtered.length}{filtered.length !== records.length ? ` / ${records.length}` : ''})
            </h3>
            <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">
              Deep system data collected by JOCKEY in-memory routines, unhooked syscalls, and BYOVD driver probes.
            </p>
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
            {(activeColFilterCount > 0 || search) && (
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

            {/* Global Search */}
            <div className="flex items-center gap-2 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2.5 py-1.5 shadow-2xs">
              <Search className="size-3.5 text-[#656d76] dark:text-[#8b949e]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search PID, node, artifact..."
                className="w-32 sm:w-44 bg-transparent text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none placeholder:text-[#656d76] dark:placeholder:text-[#8b949e]"
              />
            </div>

            <button
              type="button"
              onClick={onExportRecords}
              className="flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] px-3 py-1.5 text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowDownToLine className="size-3.5 text-[#656d76] dark:text-[#8b949e]" /> Export Records
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f6f8fa] dark:bg-[#0d1117] text-[#1f2328] dark:text-[#e6edf3] border-b border-[#d0d7de] dark:border-[#30363d] font-semibold">
              {/* Main Table Header with Sorting */}
              <tr>
                <th
                  onClick={() => handleSort('id')}
                  className="p-3.5 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Record ID & Time</span>
                    {renderSortIcon('id')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('targetNode')}
                  className="p-3.5 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Target System & OS</span>
                    {renderSortIcon('targetNode')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('technique')}
                  className="p-3.5 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Evasion Technique</span>
                    {renderSortIcon('technique')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('processContext')}
                  className="p-3.5 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Process & PID</span>
                    {renderSortIcon('processContext')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('collectedArtifact')}
                  className="p-3.5 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Collected Artifact</span>
                    {renderSortIcon('collectedArtifact')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('avEvasionStatus')}
                  className="p-3.5 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>AV Evasion Status</span>
                    {renderSortIcon('avEvasionStatus')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('severity')}
                  className="p-3.5 cursor-pointer select-none group/th hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Severity</span>
                    {renderSortIcon('severity')}
                  </div>
                </th>

                <th className="p-3.5 text-right font-semibold">Action</th>
              </tr>

              {/* Column Filter Inputs Row */}
              {showColumnFilters && (
                <tr className="border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa]/80 dark:bg-[#161b22] text-[11px]">
                  {/* Record ID Filter */}
                  <th className="py-2 px-3 font-normal">
                    <div className="relative">
                      <input
                        type="text"
                        value={colFilters.id}
                        onChange={(e) => setColFilters({ ...colFilters, id: e.target.value })}
                        placeholder="REC-..."
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

                  {/* Target OS Filter */}
                  <th className="py-2 px-2 font-normal">
                    <select
                      value={colFilters.targetOS}
                      onChange={(e) => setColFilters({ ...colFilters, targetOS: e.target.value })}
                      className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-1.5 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">All OS/Nodes</option>
                      {distinctOS.map((os) => (
                        <option key={os} value={os}>
                          {os}
                        </option>
                      ))}
                    </select>
                  </th>

                  {/* Evasion Technique Filter */}
                  <th className="py-2 px-2 font-normal">
                    <select
                      value={colFilters.technique}
                      onChange={(e) => setColFilters({ ...colFilters, technique: e.target.value })}
                      className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-1.5 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none cursor-pointer font-mono"
                    >
                      <option value="ALL">All Techniques</option>
                      {distinctTechniques.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </th>

                  {/* Process Context Filter */}
                  <th className="py-2 px-2 font-normal">
                    <div className="relative">
                      <input
                        type="text"
                        value={colFilters.processContext}
                        onChange={(e) => setColFilters({ ...colFilters, processContext: e.target.value })}
                        placeholder="lsass, PID..."
                        className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none font-mono"
                      />
                      {colFilters.processContext && (
                        <button
                          type="button"
                          onClick={() => setColFilters({ ...colFilters, processContext: '' })}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#656d76] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Collected Artifact Filter */}
                  <th className="py-2 px-2 font-normal">
                    <div className="relative">
                      <input
                        type="text"
                        value={colFilters.collectedArtifact}
                        onChange={(e) => setColFilters({ ...colFilters, collectedArtifact: e.target.value })}
                        placeholder="Artifact filename..."
                        className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none"
                      />
                      {colFilters.collectedArtifact && (
                        <button
                          type="button"
                          onClick={() => setColFilters({ ...colFilters, collectedArtifact: '' })}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#656d76] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  </th>

                  {/* AV Evasion Status Filter */}
                  <th className="py-2 px-2 font-normal">
                    <select
                      value={colFilters.avEvasionStatus}
                      onChange={(e) => setColFilters({ ...colFilters, avEvasionStatus: e.target.value })}
                      className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-1.5 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">All AV Statuses</option>
                      {distinctAVStatuses.map((av) => (
                        <option key={av} value={av}>
                          {av}
                        </option>
                      ))}
                    </select>
                  </th>

                  {/* Severity Filter */}
                  <th className="py-2 px-2 font-normal">
                    <select
                      value={colFilters.severity}
                      onChange={(e) => setColFilters({ ...colFilters, severity: e.target.value })}
                      className="w-full rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-1.5 py-1 text-[11px] text-[#1f2328] dark:text-[#e6edf3] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">All Severity</option>
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </th>

                  {/* Empty cell for Action */}
                  <th className="py-2 px-3"></th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/50 dark:divide-[#30363d] bg-white dark:bg-[#161b22]">
              {filtered.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-[#f6f8fa] dark:hover:bg-[#1f242c] transition-colors cursor-pointer group"
                  onClick={() => setInspectRecord(record)}
                >
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-[#1f2328] dark:text-[#f0f6fc] block">{record.id}</span>
                    <span className="text-[10px] text-[#656d76] dark:text-[#8b949e] font-mono">{record.timestamp}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-semibold text-[#1f2328] dark:text-[#e6edf3] block">{record.targetNode}</span>
                    <span className="text-[10px] text-[#656d76] dark:text-[#8b949e]">{record.targetOS}</span>
                  </td>
                  <td className="p-3.5 font-medium">
                    <span className="inline-flex items-center rounded bg-[#fbefff] dark:bg-[#bc8cff]/15 border border-[#d2a8ff]/40 dark:border-[#bc8cff]/30 px-2 py-0.5 text-[11px] text-[#8250df] dark:text-[#d2a8ff] font-mono">
                      {record.technique}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px]">
                    <span className="font-semibold text-[#1f2328] dark:text-[#e6edf3] block">{record.processContext}</span>
                    <span className="text-[10px] text-[#656d76] dark:text-[#8b949e]">PID: {record.pid}</span>
                  </td>
                  <td className="p-3.5 font-mono text-xs text-[#0969da] dark:text-[#58a6ff] font-medium">
                    <span className="hover:underline">
                      {record.collectedArtifact}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center text-[#1a7f37] dark:text-[#3fb950] font-semibold text-[11px] bg-[#dafbe1] dark:bg-[#238636]/20 border border-[#4ac26b]/40 dark:border-[#238636]/40 rounded px-2 py-0.5">
                      {record.avEvasionStatus}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {severityBadge(record.severity)}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setInspectRecord(record)
                      }}
                      className="rounded bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-2.5 py-1 text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="size-3 text-[#0969da] dark:text-[#58a6ff]" /> Inspect
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#656d76] dark:text-[#8b949e]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="size-6 text-[#656d76] dark:text-[#8b949e]" />
                      <p className="font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                        No forensic records match your active column filters.
                      </p>
                      <button
                        type="button"
                        onClick={resetAllFilters}
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

      <ForensicRecordDetailModal
        record={inspectRecord}
        isOpen={!!inspectRecord}
        onClose={() => setInspectRecord(null)}
      />
    </>
  )
}
