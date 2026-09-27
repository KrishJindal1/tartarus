'use client'

import React from 'react'
import type { JobStatus } from '@/types'

const jobTone: Record<JobStatus, string> = {
  queued: 'bg-[#eff1f3] dark:bg-[#1B1F26] text-[#57606a] dark:text-[#8b949e] border-[#d0d7de] dark:border-[#24282F]',
  dispatched: 'bg-[#D9F5F2] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#2DD4BF] border-[#2DD4BF]/40',
  executing: 'bg-[#D9F5F2] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#2DD4BF] border-[#2DD4BF]/40',
  completed: 'bg-[#DDF7EC] dark:bg-emerald-500/15 text-[#0F766E] dark:text-[#4ADE9E] border-[#4ADE9E]/40',
  failed: 'bg-[#FDE8E4] dark:bg-rose-500/15 text-[#D64936] dark:text-[#FF8A7A] border-[#FF8A7A]/40',
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${jobTone[status]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === 'completed'
            ? 'bg-[#0F766E] dark:bg-[#4ADE9E]'
            : status === 'failed'
            ? 'bg-[#D64936] dark:bg-[#FF8A7A]'
            : status === 'queued'
            ? 'bg-[#8b949e]'
            : 'bg-[#0F766E] dark:bg-[#2DD4BF] animate-pulse'
        }`}
      />
      {status}
    </span>
  )
}

export function AgentStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'online'
      ? 'bg-[#DDF7EC] dark:bg-emerald-500/15 text-[#0F766E] dark:text-[#4ADE9E] border-[#4ADE9E]/40'
      : status === 'busy'
      ? 'bg-[#D9F5F2] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#2DD4BF] border-[#2DD4BF]/40'
      : 'bg-[#eff1f3] dark:bg-[#1B1F26] text-[#57606a] dark:text-[#8b949e] border-[#d0d7de] dark:border-[#24282F]'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${tone}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === 'online'
            ? 'bg-[#0F766E] dark:bg-[#4ADE9E]'
            : status === 'busy'
            ? 'bg-[#0F766E] dark:bg-[#2DD4BF] animate-pulse'
            : 'bg-[#8b949e]'
        }`}
      />
      {status}
    </span>
  )
}

const riskTone = (score: number): string =>
  score >= 8
    ? 'bg-[#FDE8E4] dark:bg-rose-500/15 text-[#D64936] dark:text-[#FF8A7A] border-[#FF8A7A]/40'
    : score >= 4
    ? 'bg-[#FCF3D9] dark:bg-amber-500/15 text-[#96690F] dark:text-[#E3B341] border-[#E3B341]/40'
    : score > 0
    ? 'bg-[#D9F5F2] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#2DD4BF] border-[#2DD4BF]/40'
    : 'bg-[#eff1f3] dark:bg-[#1B1F26] text-[#57606a] dark:text-[#8b949e] border-[#d0d7de] dark:border-[#24282F]'

export function RiskBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return (
      <span className="text-[11px] text-[#8b949e] font-mono" title="Risk score not set">
        —
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums ${riskTone(
        score
      )}`}
      title={`Risk score ${score} / 10`}
    >
      {score.toFixed(1)}
    </span>
  )
}
