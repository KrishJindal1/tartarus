'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Activity, ArrowRight } from 'lucide-react'
import { JobStatusBadge, RiskBadge } from './status-badge'
import type { JobView, JobStatus } from '@/types'

interface JobsTableProps {
  jobs: JobView[]
  compact?: boolean
}

const STATUS_FILTERS: Array<JobStatus | 'all'> = [
  'all',
  'completed',
  'executing',
  'dispatched',
  'queued',
  'failed',
]

const th =
  'px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]'
const td = 'px-4 py-3 text-xs align-middle'

export function JobsTable({ jobs, compact = false }: JobsTableProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<JobStatus | 'all'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = jobs
    if (status !== 'all') list = list.filter((j) => j.status === status)
    if (q) {
      list = list.filter(
        (j) =>
          j.shortId.toLowerCase().includes(q) ||
          j.scriptName.toLowerCase().includes(q) ||
          j.hostname.toLowerCase().includes(q) ||
          (j.findingsSummary ?? '').toLowerCase().includes(q)
      )
    }
    return compact ? list.slice(0, 6) : list
  }, [jobs, query, status, compact])

  return (
    <div className="rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] overflow-hidden">
      {!compact && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[#d0d7de] dark:border-[#30363d] p-3">
          <div className="flex items-center gap-2 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] px-2.5 py-1.5 flex-1 min-w-[220px]">
            <Search className="size-3.5 text-[#8b949e]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search job id, script, host, findings…"
              className="w-full bg-transparent text-xs outline-none placeholder:text-[#8b949e]"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-md border px-2 py-1 text-[11px] font-medium capitalize cursor-pointer transition-colors ${
                  status === s
                    ? 'border-[#0969da] dark:border-[#58a6ff] bg-[#ddf4ff] dark:bg-sky-500/15 text-[#0969da] dark:text-[#58a6ff]'
                    : 'border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-[#f6f8fa] dark:bg-[#0d1117]">
            <tr className="border-b border-[#d0d7de] dark:border-[#30363d]">
              <th className={th}>Job</th>
              <th className={th}>Script</th>
              <th className={th}>Target</th>
              <th className={th}>Status</th>
              <th className={th}>Risk</th>
              <th className={th}>Started</th>
              <th className={th}>Duration</th>
              <th className={`${th} text-right`}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((job) => (
              <tr
                key={job.id}
                className="border-b border-[#d0d7de]/60 dark:border-[#30363d] last:border-0 hover:bg-[#f6f8fa] dark:hover:bg-[#0d1117] transition-colors"
              >
                <td className={td}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="font-mono font-bold text-[#0969da] dark:text-[#58a6ff] hover:underline"
                  >
                    {job.shortId}
                  </Link>
                  <div className="text-[10px] text-[#8b949e] font-mono truncate max-w-[140px]">
                    {job.execMode}
                  </div>
                </td>
                <td className={`${td} font-semibold`}>{job.scriptName}</td>
                <td className={td}>
                  <div className="truncate max-w-[160px]">{job.hostname}</div>
                  <div className="text-[10px] text-[#8b949e]">{job.os}</div>
                </td>
                <td className={td}>
                  <JobStatusBadge status={job.status} />
                </td>
                <td className={td}>
                  <RiskBadge score={job.riskScore} />
                </td>
                <td className={`${td} text-[#656d76] dark:text-[#8b949e] whitespace-nowrap`}>
                  {job.started}
                </td>
                <td className={`${td} tabular-nums text-[#656d76] dark:text-[#8b949e]`}>
                  {job.duration}
                </td>
                <td className={`${td} text-right`}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline"
                    title="Open job detail"
                  >
                    View <ArrowRight className="size-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-xs text-[#8b949e]">
                  <Activity className="size-5 mx-auto mb-2 opacity-50" />
                  {jobs.length === 0
                    ? 'No jobs yet — run a script from the Scripts page.'
                    : 'No jobs match the current filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
