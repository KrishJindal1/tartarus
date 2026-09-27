'use client'

import React, { useMemo, useState } from 'react'
import { Search, FolderKanban, Download, Eye } from 'lucide-react'
import { RiskBadge } from './status-badge'
import { relTime, formatBytes } from '@/providers/dashboard-provider'
import type { EvidenceView } from '@/types'

interface EvidenceTableProps {
  evidence: EvidenceView[]
  onPreview: (item: EvidenceView) => void
  onDownload: (item: EvidenceView) => void
}

const th =
  'px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]'
const td = 'px-4 py-3 text-xs align-middle'

export function EvidenceTable({ evidence, onPreview, onDownload }: EvidenceTableProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return evidence
    return evidence.filter(
      (e) =>
        e.type.toLowerCase().includes(q) ||
        (e.hostname ?? '').toLowerCase().includes(q) ||
        e.jobId.toLowerCase().includes(q) ||
        (e.sha256 ?? '').toLowerCase().includes(q)
    )
  }, [evidence, query])

  return (
    <div className="rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] overflow-hidden">
      <div className="border-b border-[#d0d7de] dark:border-[#24282F] p-3">
        <div className="flex items-center gap-2 rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] px-2.5 py-1.5 max-w-md">
          <Search className="size-3.5 text-[#8b949e]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search evidence by type, host, job, sha…"
            className="w-full bg-transparent text-xs outline-none placeholder:text-[#8b949e]"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-[#f6f8fa] dark:bg-[#0C0E11]">
            <tr className="border-b border-[#d0d7de] dark:border-[#24282F]">
              <th className={th}>Type</th>
              <th className={th}>Host</th>
              <th className={th}>Job</th>
              <th className={th}>SHA-256</th>
              <th className={th}>Risk</th>
              <th className={th}>Size</th>
              <th className={th}>Collected</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[#d0d7de]/60 dark:border-[#24282F] last:border-0 hover:bg-[#f6f8fa] dark:hover:bg-[#0C0E11] transition-colors"
              >
                <td className={td}>
                  <span className="rounded border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#1B1F26] px-1.5 py-0.5 font-mono text-[11px] font-semibold">
                    {item.type}
                  </span>
                </td>
                <td className={`${td} font-semibold`}>{item.hostname ?? '—'}</td>
                <td className={`${td} font-mono text-[10px]`}>
                  <a
                    href={`/jobs/${item.jobId}`}
                    className="text-[#0F766E] dark:text-[#2DD4BF] hover:underline"
                  >
                    {item.jobId.slice(0, 8).toUpperCase()}
                  </a>
                </td>
                <td className={`${td} font-mono text-[10px] text-[#656d76] dark:text-[#8b949e]`}>
                  {item.sha256 ? `${item.sha256.slice(0, 16)}…` : 'sha256-pending'}
                </td>
                <td className={td}>
                  <RiskBadge score={item.riskScore} />
                </td>
                <td className={`${td} tabular-nums text-[#656d76] dark:text-[#8b949e]`}>
                  {formatBytes(item.size)}
                </td>
                <td className={`${td} text-[#656d76] dark:text-[#8b949e] whitespace-nowrap`}>
                  {relTime(item.collectedAt)}
                </td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onPreview(item)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] px-2 py-1 text-[11px] font-semibold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#1B1F26] transition-colors cursor-pointer"
                    >
                      <Eye className="size-3" /> View
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownload(item)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] px-2 py-1 text-[11px] font-semibold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#1B1F26] transition-colors cursor-pointer"
                      title="Download evidence JSON"
                    >
                      <Download className="size-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-xs text-[#8b949e]">
                  <FolderKanban className="size-5 mx-auto mb-2 opacity-50" />
                  {evidence.length === 0
                    ? 'No evidence captured yet — run a script to collect artifacts.'
                    : 'No evidence matches the current search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
