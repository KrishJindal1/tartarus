'use client'

import React, { useState, useMemo } from 'react'
import {
  FileText,
  Calendar,
  ShieldCheck,
  Eye,
  Plus,
  Search,
  RotateCcw,
} from 'lucide-react'
import { Card, useToast } from '@/components/ui'
import { DestinationViewShell } from './destination-view-shell'
import {
  CreateReportModal,
  ScheduleDeliveryModal,
  ReportDetailModal,
} from '@/components/modals'
import { ReportItem } from '@/types'

interface ReportsViewProps {
  reports: ReportItem[]
  onRun: () => void
  onExport: () => void
  onAddReport: (report: ReportItem) => void
}

export function ReportsView({
  reports,
  onRun,
  onExport,
  onAddReport,
}: ReportsViewProps) {
  const { toast } = useToast()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [selectedInspectReport, setSelectedInspectReport] = useState<ReportItem | null>(null)

  // Filtering
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  const distinctCategories = useMemo(() => {
    const set = new Set<string>()
    reports.forEach((r) => r.category && set.add(r.category))
    return Array.from(set).sort()
  }, [reports])

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        report.title.toLowerCase().includes(q) ||
        report.category.toLowerCase().includes(q) ||
        report.executiveSummary.toLowerCase().includes(q) ||
        report.targetCluster.toLowerCase().includes(q)

      const matchesCat =
        categoryFilter === 'ALL' || report.category === categoryFilter

      return matchesSearch && matchesCat
    })
  }, [reports, search, categoryFilter])

  const handleCreate = (newReport: any) => {
    const formatted: ReportItem = {
      id: `RPT-CUSTOM-${Date.now().toString().slice(-4)}`,
      title: newReport.title,
      targetCluster: 'Hybrid Windows & Ubuntu Targets',
      category: 'Forensic System Audit',
      executionTime: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      avDetectionScore: '0/72 Detections (100% AV Evasion)',
      recordsExtracted: 1240,
      criticalFindings: 1,
      status: 'Completed',
      executiveSummary: newReport.description,
      methodology: 'Polymorphic LLVM intermediate representation compilation with unhooked direct system calls.',
      evidenceArtifacts: ['unhooked_ntdll_evidence.log', 'proc_mem_forensic_trace.json'],
      recommendations: ['Maintain automated polymorphic rotation cycle.', 'Schedule nightly memory integrity scan.'],
    }
    onAddReport(formatted)
    toast(`Generated forensic audit report: "${formatted.title}"`, 'success')
  }

  const handleSchedule = (config: { frequency: string; channel: string; target: string }) => {
    toast(`Configured ${config.frequency} delivery via ${config.channel}`, 'success')
  }

  return (
    <>
      <DestinationViewShell name="Reports" onRun={onRun} onExport={onExport}>
        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22]">
            <div className="flex flex-col gap-3 border-b border-[#d0d7de] dark:border-[#30363d] p-4 sm:flex-row sm:items-center sm:justify-between bg-[#f6f8fa] dark:bg-[#161b22]">
              <div>
                <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  Forensic Audit Reports & Deliverables ({filteredReports.length})
                </h3>
                <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">
                  Comprehensive investigative reports compiled from AV-evaded in-memory scripts and kernel probes.
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
                    placeholder="Search reports..."
                    className="w-32 sm:w-44 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] pl-8 pr-3 py-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:outline-none"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2.5 py-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {distinctCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {(search || categoryFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setCategoryFilter('ALL')
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#656d76] dark:text-[#8b949e] hover:text-[#cf222e] dark:hover:text-[#f85149] hover:bg-[#ffebe9] dark:hover:bg-[#21262d] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="size-3" /> Reset
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="rounded-md bg-[#1f883d] dark:bg-[#238636] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="size-3.5" /> Compile New Report
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 p-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedInspectReport(report)}
                  className="rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-4 hover:bg-[#f6f8fa] dark:hover:bg-[#1f242c] transition-all cursor-pointer shadow-2xs group flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#ddf4ff] dark:bg-[#388bfd]/15 text-[#0969da] dark:text-[#58a6ff] border border-[#54aeff]/40 dark:border-[#388bfd]/30 mt-0.5">
                        <FileText className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition-colors">
                            {report.title}
                          </h4>
                          <span className="rounded bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#8b949e] font-mono text-[10px] font-semibold px-2 py-0.5">
                            {report.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#656d76] dark:text-[#8b949e] mt-1 line-clamp-2 leading-relaxed">
                          {report.executiveSummary}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-[#dafbe1] dark:bg-[#238636]/20 border border-[#4ac26b]/40 dark:border-[#238636]/40 text-[#1a7f37] dark:text-[#3fb950] text-[10px] font-bold px-2 py-0.5 shrink-0">
                      {report.status}
                    </span>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex items-center justify-between border-t border-[#d0d7de] dark:border-[#30363d] pt-3 text-[11px] text-[#656d76] dark:text-[#8b949e] flex-wrap gap-2">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="font-semibold text-[#1a7f37] dark:text-[#3fb950] flex items-center gap-1">
                        <ShieldCheck className="size-3.5 text-[#1a7f37] dark:text-[#3fb950]" />
                        {report.avDetectionScore}
                      </span>
                      <span className="font-mono text-[#1f2328] dark:text-[#e6edf3]">
                        {report.recordsExtracted.toLocaleString()} Records Extracted
                      </span>
                      <span className="text-[#656d76] dark:text-[#8b949e] font-mono">
                        {report.executionTime}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedInspectReport(report)
                      }}
                      className="text-xs font-bold text-[#0969da] dark:text-[#58a6ff] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="size-3.5 text-[#0969da] dark:text-[#58a6ff]" /> Inspect Full Report →
                    </button>
                  </div>
                </div>
              ))}

              {filteredReports.length === 0 && (
                <div className="p-8 text-center text-xs text-[#656d76] dark:text-[#8b949e]">
                  No forensic audit reports match the current search.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 flex flex-col justify-between border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22]">
            <div>
              <div className="flex items-center gap-2 text-[#1f2328] dark:text-[#f0f6fc] font-bold text-sm">
                <Calendar className="size-4 text-[#0969da] dark:text-[#58a6ff]" />
                <h3>Automated Scheduled Delivery</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#656d76] dark:text-[#8b949e]">
                Configure automated compilation and encrypted delivery of system forensic reports immediately after polymorphic scan cycles complete.
              </p>

              <div className="mt-5 flex flex-col gap-2.5 text-xs text-[#1f2328] dark:text-[#e6edf3]">
                <div className="rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117] p-3 border border-[#d0d7de] dark:border-[#30363d]">
                  <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc] block">Active Schedule</span>
                  <span className="text-[#656d76] dark:text-[#8b949e]">Daily midnight deep forensic scan & report generation.</span>
                </div>
                <div className="rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117] p-3 border border-[#d0d7de] dark:border-[#30363d]">
                  <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc] block">Encrypted Destination</span>
                  <span className="text-[#656d76] dark:text-[#8b949e] font-mono text-[11px]">webhook: sec-ops-team-alert-hub</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#d0d7de] dark:border-[#30363d]">
              <button
                type="button"
                onClick={() => setIsScheduleOpen(true)}
                className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] px-3 py-2 text-center text-xs font-bold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors cursor-pointer shadow-2xs"
              >
                Configure Delivery Schedule
              </button>
            </div>
          </Card>
        </section>
      </DestinationViewShell>

      <CreateReportModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />

      <ScheduleDeliveryModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSchedule={handleSchedule}
      />

      <ReportDetailModal
        report={selectedInspectReport}
        isOpen={!!selectedInspectReport}
        onClose={() => setSelectedInspectReport(null)}
      />
    </>
  )
}
