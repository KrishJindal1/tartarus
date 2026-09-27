'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { use } from 'react'
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  FileText,
  Download,
  Copy,
  CheckCircle2,
} from 'lucide-react'
import { useToast } from '@/components/ui'
import { JobStatusBadge, RiskBadge } from '@/components/dashboard'
import { EvidenceTable } from '@/components/dashboard/evidence-table'
import { EvidencePreviewModal } from '@/components/modals/evidence-preview-modal'
import { api, BackendJobDetail, BackendResultRow, BackendEvidenceRow } from '@/lib/api'
import { relTime, durationBetween } from '@/providers/dashboard-provider'
import { useDashboard } from '@/providers/dashboard-provider'
import type { EvidenceView } from '@/types'

function toEvidenceView(row: BackendEvidenceRow): EvidenceView {
  let size = 0
  try {
    size = JSON.stringify(row.data ?? {}).length
  } catch {
    size = 0
  }
  return {
    id: row.id,
    jobId: row.job_id,
    type: row.type,
    sha256: row.sha256 ?? null,
    riskScore: row.risk_score ?? null,
    collectedAt: row.collected_at ?? null,
    hostname: row.hostname ?? null,
    size,
    data: row.data,
  }
}

const card =
  'rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] overflow-hidden'
const cardTitle =
  'border-b border-[#d0d7de] dark:border-[#30363d] px-4 py-2.5 bg-[#f6f8fa] dark:bg-[#0d1117] text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]'

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { toast } = useToast()
  const { jobs, agents } = useDashboard()

  const [job, setJob] = useState<BackendJobDetail | null>(null)
  const [results, setResults] = useState<BackendResultRow[]>([])
  const [evidence, setEvidence] = useState<EvidenceView[]>([])
  const [irListing, setIrListing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<EvidenceView | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // summary from the live context (status updates as the job progresses)
  const summary = jobs.find((j) => j.id === id)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [jobRaw, resultsRaw, evidenceRaw] = await Promise.all([
        api.getJob(id),
        api.listResults(id).catch(() => [] as BackendResultRow[]),
        api.evidenceByJob(id).catch(() => [] as BackendEvidenceRow[]),
      ])
      setJob(jobRaw)
      setResults(resultsRaw)
      setEvidence(evidenceRaw.map(toEvidenceView))
      if (jobRaw.script_id) {
        const script = await api.getScript(jobRaw.script_id).catch(() => null)
        setIrListing(script?.ir_listing ?? null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  // keep status fresh while job is running
  useEffect(() => {
    if (!job) return
    if (job.status === 'completed' || job.status === 'failed') return
    const t = setInterval(() => void load(), 3000)
    return () => clearInterval(t)
  }, [job, load])

  const status = (summary?.status ?? job?.status ?? 'queued') as NonNullable<
    typeof summary
  >['status']
  const riskScore = job?.risk_score ?? summary?.riskScore ?? null
  const hostname = job?.hostname ?? summary?.hostname ?? job?.agent_id.slice(0, 8)
  const scriptName = job?.script_name ?? summary?.scriptName ?? 'unknown script'

  const downloadEvidence = (item: EvidenceView) => {
    const blob = new Blob([JSON.stringify(item.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.type}_${item.id.slice(0, 8)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      const blob = await api.reportPdfBlob(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jockey_report_${id.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast('Report PDF downloaded.', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'PDF download failed', 'error')
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (loading && !job) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] py-24 text-xs text-[#656d76] dark:text-[#8b949e]">
        <Loader2 className="size-4 animate-spin" /> Loading job…
      </div>
    )
  }

  if (error && !job) {
    return (
      <div className="rounded-xl border border-[#ff8182]/40 bg-[#ffebe9] dark:bg-rose-500/10 p-6 text-center">
        <p className="text-sm font-bold text-[#cf222e] dark:text-[#ff7b72]">Failed to load job</p>
        <p className="mt-1 font-mono text-[11px] text-[#cf222e] dark:text-[#ff7b72]">{error}</p>
        <div className="mt-3 flex items-center justify-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => void load()}
            className="font-bold text-[#0969da] dark:text-[#58a6ff] hover:underline cursor-pointer"
          >
            Retry
          </button>
          <Link href="/jobs" className="font-bold text-[#0969da] dark:text-[#58a6ff] hover:underline">
            Back to jobs
          </Link>
        </div>
      </div>
    )
  }

  const meta: Array<[string, React.ReactNode]> = [
    [
      'Script',
      <Link
        key="s"
        href={`/scripts/${job?.script_id ?? ''}`}
        className="text-[#0969da] dark:text-[#58a6ff] hover:underline"
      >
        {scriptName}
      </Link>,
    ],
    [
      'Endpoint',
      <Link
        key="e"
        href={`/agents/${job?.agent_id ?? ''}`}
        className="text-[#0969da] dark:text-[#58a6ff] hover:underline"
      >
        {hostname}
      </Link>,
    ],
    ['OS', <span key="os" className="capitalize">{job?.os ?? summary?.os ?? 'unknown'}</span>],
    ['Exec mode', <span key="m" className="font-mono">{job?.exec_mode ?? '—'}</span>],
    [
      'IR SHA-256',
      <button
        key="sha"
        type="button"
        title="Copy full hash"
        onClick={() => {
          if (job?.ir_sha256) {
            navigator.clipboard.writeText(job.ir_sha256)
            toast('IR SHA-256 copied.', 'info')
          }
        }}
        className="inline-flex items-center gap-1 font-mono text-[10px] text-[#0969da] dark:text-[#58a6ff] hover:underline cursor-pointer"
      >
        {job?.ir_sha256 ? `${job.ir_sha256.slice(0, 16)}…` : '—'} <Copy className="size-2.5" />
      </button>,
    ],
    ['Created by', <span key="cb" className="font-mono">{job?.created_by ?? '—'}</span>],
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0969da] dark:text-[#58a6ff] hover:underline"
          >
            <ArrowLeft className="size-3" /> Jobs
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-lg font-bold text-[#1f2328] dark:text-[#f0f6fc]">
              {id.slice(0, 8).toUpperCase()}
            </h1>
            <JobStatusBadge status={status} />
            <RiskBadge score={riskScore} />
          </div>
          <p className="text-xs text-[#656d76] dark:text-[#8b949e]">
            {scriptName} → {hostname} · started {summary?.started ?? relTime(job?.created_at)} ·
            duration {summary?.duration ?? durationBetween(job?.dispatched_at, job?.completed_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] px-2.5 py-1.5 text-[11px] font-bold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors cursor-pointer"
          >
            <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link
            href={`/reports/${id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] px-2.5 py-1.5 text-[11px] font-bold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors"
          >
            <FileText className="size-3" /> Report
          </Link>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] px-2.5 py-1.5 text-[11px] font-bold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="size-3" /> PDF
          </button>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {meta.map(([label, value]) => (
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

      {/* Timeline + findings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={card}>
          <div className={cardTitle}>Lifecycle</div>
          <ul className="p-4 flex flex-col gap-3 text-xs">
            {(
              [
                ['Queued', job?.created_at],
                ['Dispatched', job?.dispatched_at],
                ['Completed', job?.completed_at],
              ] as Array<[string, string | null | undefined]>
            ).map(([label, ts], idx) => (
              <li key={label} className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-0.5">
                  <span
                    className={`size-2.5 rounded-full ${
                      ts ? 'bg-[#1a7f37] dark:bg-[#3fb950]' : 'bg-[#d0d7de] dark:bg-[#30363d]'
                    } ${idx < 2 ? 'mb-1' : ''}`}
                  />
                  {idx < 2 && <span className="w-px flex-1 bg-[#d0d7de] dark:bg-[#30363d]" />}
                </div>
                <div>
                  <div className="font-bold text-[#1f2328] dark:text-[#e6edf3]">{label}</div>
                  <div className="text-[10px] text-[#8b949e]">
                    {ts ? `${relTime(ts)} · ${new Date(ts).toLocaleString()}` : 'pending'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={card + ' lg:col-span-2'}>
          <div className={cardTitle}>Findings summary</div>
          <div className="p-4">
            <p className="text-xs leading-relaxed text-[#1f2328] dark:text-[#e6edf3]">
              {job?.findings_summary ?? summary?.findingsSummary ?? 'No findings recorded yet.'}
            </p>
            {job?.risk_score != null && (
              <div className="mt-3 flex items-center gap-2 text-[11px] text-[#656d76] dark:text-[#8b949e]">
                <CheckCircle2 className="size-3.5 text-[#1a7f37] dark:text-[#3fb950]" />
                Risk score <RiskBadge score={job.risk_score} /> computed by the backend from
                evidence severity.
              </div>
            )}
            {irListing && (
              <details className="mt-3">
                <summary className="cursor-pointer text-[11px] font-bold text-[#0969da] dark:text-[#58a6ff]">
                  Executed IR listing ({irListing.split('\n').length} instructions)
                </summary>
                <pre className="mt-2 max-h-56 overflow-auto rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#0d1117] p-3 text-[10px] leading-4 font-mono text-[#e6edf3]">
                  {irListing}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={card}>
        <div className={cardTitle}>
          Agent result ({results.length} submission{results.length === 1 ? '' : 's'})
        </div>
        {results.length === 0 ? (
          <p className="p-4 text-xs text-[#8b949e]">No result submitted yet.</p>
        ) : (
          <div className="divide-y divide-[#d0d7de]/60 dark:divide-[#30363d]">
            {results.map((r) => (
              <div key={r.id} className="p-4 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3 text-[11px]">
                  <span
                    className={`rounded-full border px-2 py-0.5 font-bold ${
                      r.status === 'success'
                        ? 'border-[#4ac26b]/40 bg-[#dafbe1] text-[#1a7f37] dark:bg-emerald-500/15 dark:text-[#3fb950]'
                        : 'border-[#ff8182]/40 bg-[#ffebe9] text-[#cf222e] dark:bg-rose-500/15 dark:text-[#ff7b72]'
                    }`}
                  >
                    {r.status}
                  </span>
                  <span className="text-[#656d76] dark:text-[#8b949e]">
                    {r.hostname ?? '—'} · {r.os ?? '—'}
                  </span>
                  <span className="font-mono text-[10px] text-[#8b949e]">
                    {r.timestamp ?? r.received_at ?? ''}
                  </span>
                </div>
                <details>
                  <summary className="cursor-pointer text-[11px] font-bold text-[#0969da] dark:text-[#58a6ff]">
                    Raw payload
                  </summary>
                  <pre className="mt-2 max-h-72 overflow-auto rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#0d1117] p-3 text-[10px] leading-4 font-mono text-[#e6edf3] whitespace-pre-wrap break-all">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(r.raw ?? r.message ?? '{}'), null, 2)
                      } catch {
                        return r.raw ?? r.message
                      }
                    })()}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evidence */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
          Evidence from this job ({evidence.length})
        </h2>
        <EvidenceTable
          evidence={evidence}
          onPreview={setPreview}
          onDownload={downloadEvidence}
        />
      </section>

      <EvidencePreviewModal
        evidence={preview}
        isOpen={preview !== null}
        onClose={() => setPreview(null)}
        onDownload={downloadEvidence}
      />
    </div>
  )
}
