'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { use } from 'react'
import {
  ArrowLeft,
  Loader2,
  Download,
  FileText,
  AlertTriangle,
  Clock3,
} from 'lucide-react'
import { useToast } from '@/components/ui'
import { RiskBadge } from '@/components/dashboard'
import { api } from '@/lib/api'
import { relTime } from '@/providers/dashboard-provider'

interface ReportData {
  report_type: string
  job_id: string
  script: string
  agent: { id: string; hostname: string; os: string; agent_version?: string }
  exec_mode: string
  status: string
  ir_sha256: string
  risk_score: number | string
  severity: string
  verdict: string
  findings: Record<string, unknown>
  evidence_summary: Array<{
    type: string
    sha256: string
    risk_score: number
    collected_at: string
    items: number
  }>
  timeline: Array<{ event: string; at: string; status?: string }>
  mitre_techniques: string[]
  warnings: Record<string, unknown>
  generated_at: string
}

const card =
  'rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] overflow-hidden'
const cardTitle =
  'border-b border-[#d0d7de] dark:border-[#30363d] px-4 py-2.5 bg-[#f6f8fa] dark:bg-[#0d1117] text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]'

function asList(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    const allArrays = value.every((v) => Array.isArray(v))
    if (allArrays) return (value as unknown[][]).flat()
    return value
  }
  if (value && typeof value === 'object') return [value]
  return []
}

export default function ReportDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const { toast } = useToast()
  const [report, setReport] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.reportJson(jobId)
      setReport(data as unknown as ReportData)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    void load()
  }, [load])

  const downloadPdf = async () => {
    setDownloading(true)
    try {
      const blob = await api.reportPdfBlob(jobId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jockey_report_${jobId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast('Report PDF downloaded.', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'PDF download failed', 'error')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] py-24 text-xs text-[#656d76] dark:text-[#8b949e]">
        <Loader2 className="size-4 animate-spin" /> Loading report…
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="rounded-xl border border-[#ff8182]/40 bg-[#ffebe9] dark:bg-rose-500/10 p-6 text-center">
        <p className="text-sm font-bold text-[#cf222e] dark:text-[#ff7b72]">
          Report not available
        </p>
        <p className="mt-1 font-mono text-[11px] text-[#cf222e] dark:text-[#ff7b72]">{error}</p>
        <div className="mt-3 flex items-center justify-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => void load()}
            className="font-bold text-[#0969da] dark:text-[#58a6ff] hover:underline cursor-pointer"
          >
            Retry
          </button>
          <Link
            href="/reports"
            className="font-bold text-[#0969da] dark:text-[#58a6ff] hover:underline"
          >
            Back to reports
          </Link>
        </div>
      </div>
    )
  }

  const risk = Number(report.risk_score)
  const severityTone =
    report.severity === 'CRITICAL'
      ? 'border-[#ff8182]/40 bg-[#ffebe9] dark:bg-rose-500/10 text-[#cf222e] dark:text-[#ff7b72]'
      : report.severity === 'HIGH'
      ? 'border-[#d4a72c]/40 bg-[#fff8c5] dark:bg-amber-500/10 text-[#9a6700] dark:text-[#d29922]'
      : report.severity === 'MEDIUM'
      ? 'border-[#54aeff]/40 bg-[#ddf4ff] dark:bg-sky-500/10 text-[#0969da] dark:text-[#58a6ff]'
      : 'border-[#4ac26b]/40 bg-[#dafbe1] dark:bg-emerald-500/10 text-[#1a7f37] dark:text-[#3fb950]'

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/reports"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0969da] dark:text-[#58a6ff] hover:underline"
          >
            <ArrowLeft className="size-3" /> Reports
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-bold text-[#1f2328] dark:text-[#f0f6fc]">
              {report.report_type}
            </h1>
            <RiskBadge score={risk} />
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${severityTone}`}
            >
              {report.severity}
            </span>
          </div>
          <p className="text-xs text-[#656d76] dark:text-[#8b949e]">
            {report.script} on {report.agent.hostname} ({report.agent.os}) · generated{' '}
            {relTime(report.generated_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/jobs/${report.job_id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] px-2.5 py-1.5 text-[11px] font-bold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors"
          >
            <FileText className="size-3" /> Job detail
          </Link>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#0969da]/50 dark:border-[#58a6ff]/50 bg-[#0969da] dark:bg-[#1f6feb] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#0550ae] dark:hover:bg-[#388bfd] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="size-3" /> {downloading ? '…' : 'PDF'}
          </button>
        </div>
      </div>

      {/* Verdict */}
      <div className={`rounded-xl border p-4 ${severityTone}`}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="size-4" /> Verdict
        </div>
        <p className="mt-1 text-sm font-semibold">{report.verdict}</p>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(
          [
            ['Script', report.script],
            ['Endpoint', `${report.agent.hostname} · ${report.agent.os}`],
            ['Exec mode', report.exec_mode],
            ['Status', report.status],
            ['IR SHA-256', `${report.ir_sha256.slice(0, 14)}…`],
            ['Agent version', report.agent.agent_version ?? '—'],
          ] as Array<[string, React.ReactNode]>
        ).map(([label, value]) => (
          <div key={label} className={card + ' p-3'}>
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#8b949e]">
              {label}
            </div>
            <div className="mt-1 truncate text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3]">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Timeline */}
        <div className={card}>
          <div className={cardTitle}>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3" /> Timeline
            </span>
          </div>
          <ul className="p-4 flex flex-col gap-3 text-xs">
            {report.timeline.map((ev, idx) => (
              <li key={`${ev.event}-${idx}`} className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1">
                  <span className="size-2 rounded-full bg-[#0969da] dark:bg-[#58a6ff]" />
                  {idx < report.timeline.length - 1 && (
                    <span className="w-px flex-1 bg-[#d0d7de] dark:bg-[#30363d]" />
                  )}
                </div>
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-[#1f2328] dark:text-[#e6edf3]">
                    {ev.event}
                    {ev.status && (
                      <span className="ml-1.5 text-[10px] text-[#8b949e]">({ev.status})</span>
                    )}
                  </span>
                  <span className="text-[10px] text-[#8b949e] whitespace-nowrap">
                    {relTime(ev.at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Evidence summary */}
        <div className={card}>
          <div className={cardTitle}>Evidence summary</div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117]">
                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                  Type
                </th>
                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                  Items
                </th>
                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                  Risk
                </th>
                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                  SHA-256
                </th>
              </tr>
            </thead>
            <tbody>
              {report.evidence_summary.map((ev) => (
                <tr
                  key={ev.type + ev.sha256}
                  className="border-b border-[#d0d7de]/60 dark:border-[#30363d] last:border-0"
                >
                  <td className="px-4 py-2.5 font-mono font-semibold">{ev.type}</td>
                  <td className="px-4 py-2.5 tabular-nums">{ev.items}</td>
                  <td className="px-4 py-2.5">
                    <RiskBadge score={ev.risk_score} />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[10px] text-[#8b949e]">
                    {ev.sha256.slice(0, 16)}…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MITRE */}
      {report.mitre_techniques.length > 0 && (
        <div className={card}>
          <div className={cardTitle}>MITRE ATT&CK techniques</div>
          <div className="p-4 flex flex-wrap gap-2">
            {report.mitre_techniques.map((t) => (
              <a
                key={t}
                href={`https://attack.mitre.org/techniques/${t.replace('.', '/')}/`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#54aeff]/40 bg-[#ddf4ff] dark:bg-sky-500/15 px-3 py-1 font-mono text-[11px] font-bold text-[#0969da] dark:text-[#58a6ff] hover:underline"
                title="Open on attack.mitre.org"
              >
                {t}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Findings (raw, collapsible per category) */}
      <div className={card}>
        <div className={cardTitle}>Findings</div>
        <div className="divide-y divide-[#d0d7de]/60 dark:divide-[#30363d]">
          {Object.entries(report.findings).map(([category, value]) => {
            const items = asList(value)
            return (
              <details key={category} className="group">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-bold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#0d1117]">
                  <span className="font-mono">{category}</span>
                  <span className="rounded-full bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 text-[10px] font-bold text-[#656d76] dark:text-[#8b949e]">
                    {items.length} item(s)
                  </span>
                </summary>
                <pre className="max-h-72 overflow-auto bg-[#0d1117] p-4 text-[10px] leading-4 font-mono text-[#e6edf3] whitespace-pre-wrap break-all">
                  {JSON.stringify(items, null, 2)}
                </pre>
              </details>
            )
          })}
          {Object.keys(report.findings).length === 0 && (
            <p className="p-4 text-xs text-[#8b949e]">No findings recorded.</p>
          )}
        </div>
      </div>

      {/* Raw */}
      <details className={card}>
        <summary className={cardTitle + ' cursor-pointer'}>Raw report JSON</summary>
        <pre className="max-h-80 overflow-auto p-4 text-[10px] leading-4 font-mono text-[#1f2328] dark:text-[#e6edf3] whitespace-pre-wrap">
          {JSON.stringify(report, null, 2)}
        </pre>
      </details>
    </div>
  )
}
