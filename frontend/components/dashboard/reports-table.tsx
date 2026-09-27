'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, FileText, ArrowRight, Download } from 'lucide-react'
import { useToast } from '@/components/ui'
import { RiskBadge } from './status-badge'
import { api } from '@/lib/api'
import { relTime } from '@/providers/dashboard-provider'
import type { ReportView } from '@/types'

const th =
  'px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]'
const td = 'px-4 py-3 text-xs align-middle'

export function ReportsTable({ reports }: { reports: ReportView[] }) {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return reports
    return reports.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.target.toLowerCase().includes(q) ||
        r.jobId.toLowerCase().includes(q)
    )
  }, [reports, query])

  const handlePdf = async (report: ReportView) => {
    setDownloading(report.jobId)
    try {
      const blob = await api.reportPdfBlob(report.jobId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.title.replace(/[^\w-]+/g, '_').toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast('Report PDF downloaded.', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'PDF download failed', 'error')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] overflow-hidden">
      <div className="border-b border-[#d0d7de] dark:border-[#30363d] p-3">
        <div className="flex items-center gap-2 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] px-2.5 py-1.5 max-w-md">
          <Search className="size-3.5 text-[#8b949e]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports by title, target, job…"
            className="w-full bg-transparent text-xs outline-none placeholder:text-[#8b949e]"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-[#f6f8fa] dark:bg-[#0d1117]">
            <tr className="border-b border-[#d0d7de] dark:border-[#30363d]">
              <th className={th}>Report</th>
              <th className={th}>Target</th>
              <th className={th}>Risk</th>
              <th className={th}>Evidence</th>
              <th className={th}>Critical</th>
              <th className={th}>Completed</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((report) => (
              <tr
                key={report.jobId}
                className="border-b border-[#d0d7de]/60 dark:border-[#30363d] last:border-0 hover:bg-[#f6f8fa] dark:hover:bg-[#0d1117] transition-colors"
              >
                <td className={td}>
                  <Link
                    href={`/reports/${report.jobId}`}
                    className="flex items-center gap-2 font-semibold text-[#1f2328] dark:text-[#f0f6fc] hover:text-[#0969da] dark:hover:text-[#58a6ff] hover:underline"
                  >
                    <FileText className="size-3.5 text-[#8b949e] shrink-0" />
                    {report.title}
                  </Link>
                  <div className="mt-0.5 pl-5.5 font-mono text-[10px] text-[#8b949e]">
                    {report.jobId.slice(0, 8).toUpperCase()}
                  </div>
                </td>
                <td className={td}>
                  <div>{report.target}</div>
                  <div className="text-[10px] text-[#8b949e] capitalize">{report.os}</div>
                </td>
                <td className={td}>
                  <RiskBadge score={report.riskScore} />
                </td>
                <td className={`${td} tabular-nums`}>{report.evidenceCount}</td>
                <td className={`${td} tabular-nums`}>
                  {report.critical > 0 ? (
                    <span className="font-bold text-[#cf222e] dark:text-[#ff7b72]">
                      {report.critical}
                    </span>
                  ) : (
                    <span className="text-[#8b949e]">0</span>
                  )}
                </td>
                <td className={`${td} text-[#656d76] dark:text-[#8b949e] whitespace-nowrap`}>
                  {relTime(report.completedAt)}
                </td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePdf(report)}
                      disabled={downloading === report.jobId}
                      className="inline-flex items-center gap-1 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] px-2 py-1 text-[11px] font-semibold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors cursor-pointer disabled:opacity-50"
                      title="Download PDF"
                    >
                      <Download className="size-3" />
                      {downloading === report.jobId ? '…' : 'PDF'}
                    </button>
                    <Link
                      href={`/reports/${report.jobId}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline"
                    >
                      Open <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-xs text-[#8b949e]">
                  <FileText className="size-5 mx-auto mb-2 opacity-50" />
                  {reports.length === 0
                    ? 'No reports yet — they are generated when a job completes.'
                    : 'No reports match the current search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
