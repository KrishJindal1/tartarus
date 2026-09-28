'use client'

import React, { useState } from 'react'
import { Loader2, FolderKanban, Download } from 'lucide-react'
import { EvidenceTable } from '@/components/dashboard'
import { EvidencePreviewModal } from '@/components/modals/evidence-preview-modal'
import { useDashboard } from '@/providers/dashboard-provider'
import type { EvidenceView } from '@/types'

export default function EvidencePage() {
  const { evidence, summary, loaded } = useDashboard()
  const [preview, setPreview] = useState<EvidenceView | null>(null)

  const download = (item: EvidenceView) => {
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

  const byType = summary ? Object.entries(summary.by_type) : []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#1f2328] dark:text-[#f0f6fc]">Evidence</h1>
          <p className="text-xs text-[#656d76] dark:text-[#8b949e]">
            {loaded ? (
              <>
                {summary?.total_evidence ?? evidence.length} artifact(s) ·{' '}
                {summary?.jobs_with_evidence ?? 0} job(s) with evidence · max risk{' '}
                {summary?.max_risk ?? 0}/10
              </>
            ) : (
              'Loading evidence…'
            )}
          </p>
        </div>
        {evidence.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([JSON.stringify(evidence, null, 2)], {
                type: 'application/json',
              })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `jocky-evidence-export-${Date.now()}.json`
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] px-3 py-2 text-xs font-bold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#1B1F26] transition-colors cursor-pointer"
          >
            <Download className="size-3.5" /> Export all
          </button>
        )}
      </div>

      {byType.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {byType.map(([type, stats]) => (
            <span
              key={type}
              className="inline-flex items-center gap-2 rounded-full border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] px-3 py-1.5 text-[11px] font-semibold text-[#1f2328] dark:text-[#e6edf3]"
              title={`Average risk ${stats.avg_risk.toFixed(1)}/10`}
            >
              <span className="font-mono">{type}</span>
              <span className="rounded-full bg-[#f6f8fa] dark:bg-[#1B1F26] px-1.5 text-[10px] font-bold text-[#656d76] dark:text-[#8b949e]">
                {stats.count}
              </span>
            </span>
          ))}
        </div>
      )}

      {!loaded ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] py-20 text-xs text-[#656d76] dark:text-[#8b949e]">
          <Loader2 className="size-4 animate-spin" /> Loading evidence…
        </div>
      ) : (
        <EvidenceTable evidence={evidence} onPreview={setPreview} onDownload={download} />
      )}

      <EvidencePreviewModal
        evidence={preview}
        isOpen={preview !== null}
        onClose={() => setPreview(null)}
        onDownload={download}
      />
    </div>
  )
}
