'use client'

import React from 'react'
import type { JobStatus } from '@/types'

const jobTone: Record<JobStatus, string> = {
  queued: 'bg-[#eff1f3] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] border-[#d0d7de] dark:border-[#30363d]',
  dispatched: 'bg-[#ddf4ff] dark:bg-sky-500/15 text-[#0969da] dark:text-[#58a6ff] border-[#54aeff]/40',
  executing: 'bg-[#ddf4ff] dark:bg-sky-500/15 text-[#0969da] dark:text-[#58a6ff] border-[#54aeff]/40',
  completed: 'bg-[#dafbe1] dark:bg-emerald-500/15 text-[#1a7f37] dark:text-[#3fb950] border-[#4ac26b]/40',
  failed: 'bg-[#ffebe9] dark:bg-rose-500/15 text-[#cf222e] dark:text-[#ff7b72] border-[#ff8182]/40',
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${jobTone[status]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === 'completed'
            ? 'bg-[#1a7f37] dark:bg-[#3fb950]'
            : status === 'failed'
            ? 'bg-[#cf222e] dark:bg-[#ff7b72]'
            : status === 'queued'
            ? 'bg-[#8b949e]'
            : 'bg-[#0969da] dark:bg-[#58a6ff] animate-pulse'
        }`}
      />
      {status}
    </span>
  )
}

export function AgentStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'online'
      ? 'bg-[#dafbe1] dark:bg-emerald-500/15 text-[#1a7f37] dark:text-[#3fb950] border-[#4ac26b]/40'
      : status === 'busy'
      ? 'bg-[#ddf4ff] dark:bg-sky-500/15 text-[#0969da] dark:text-[#58a6ff] border-[#54aeff]/40'
      : 'bg-[#eff1f3] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] border-[#d0d7de] dark:border-[#30363d]'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${tone}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === 'online'
            ? 'bg-[#1a7f37] dark:bg-[#3fb950]'
            : status === 'busy'
            ? 'bg-[#0969da] dark:bg-[#58a6ff] animate-pulse'
            : 'bg-[#8b949e]'
        }`}
      />
      {status}
    </span>
  )
}

const riskTone = (score: number): string =>
  score >= 8
    ? 'bg-[#ffebe9] dark:bg-rose-500/15 text-[#cf222e] dark:text-[#ff7b72] border-[#ff8182]/40'
    : score >= 4
    ? 'bg-[#fff8c5] dark:bg-amber-500/15 text-[#9a6700] dark:text-[#d29922] border-[#d4a72c]/40'
    : score > 0
    ? 'bg-[#ddf4ff] dark:bg-sky-500/15 text-[#0969da] dark:text-[#58a6ff] border-[#54aeff]/40'
    : 'bg-[#eff1f3] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] border-[#d0d7de] dark:border-[#30363d]'

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
