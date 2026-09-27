'use client'

import React from 'react'
import Link from 'next/link'
import { DynamicIcon } from '@/components/ui'
import type { MetricCard } from '@/types'

interface MetricsGridProps {
  metrics: MetricCard[]
}

const toneClasses: Record<string, string> = {
  sky: 'bg-teal-500/10 text-[#0F766E] dark:text-[#2DD4BF] ring-teal-500/30',
  emerald: 'bg-emerald-500/10 text-[#0F766E] dark:text-[#4ADE9E] ring-emerald-500/30',
  violet: 'bg-violet-500/10 text-[#A78BFA] dark:text-[#B9A6FD] ring-violet-500/30',
  cyan: 'bg-cyan-500/10 text-[#0F766E] dark:text-[#2DD4BF] ring-cyan-500/30',
  blue: 'bg-teal-500/10 text-[#0F766E] dark:text-[#2DD4BF] ring-teal-500/30',
  rose: 'bg-rose-500/10 text-[#D64936] dark:text-[#FF8A7A] ring-rose-500/30',
  amber: 'bg-amber-500/10 text-[#96690F] dark:text-[#E3B341] ring-amber-500/30',
  slate: 'bg-slate-500/10 text-[#57606a] dark:text-[#8b949e] ring-slate-500/30',
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {metrics.map((metric) => (
        <Link
          key={metric.label}
          href={metric.href}
          className="group rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] p-4 hover:border-[#12A594] dark:hover:border-[#2DD4BF] hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div
              className={`flex size-8 items-center justify-center rounded-lg ring-1 ${
                toneClasses[metric.tone] ?? toneClasses.slate
              }`}
            >
              <DynamicIcon name={metric.iconName} className="size-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tabular-nums text-[#1f2328] dark:text-[#f0f6fc]">
            {metric.value}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3]">
            {metric.label}
          </div>
          <div className="mt-0.5 text-[11px] text-[#656d76] dark:text-[#8b949e]">{metric.sub}</div>
        </Link>
      ))}
    </div>
  )
}
