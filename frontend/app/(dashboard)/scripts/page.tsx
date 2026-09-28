'use client'

import React from 'react'
import Link from 'next/link'
import { Plus, Loader2 } from 'lucide-react'
import { ScriptsTable } from '@/components/dashboard'
import { useDashboard } from '@/providers/dashboard-provider'

export default function ScriptsPage() {
  const { scripts, loaded } = useDashboard()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#1f2328] dark:text-[#f0f6fc]">Tartarus scripts</h1>
          <p className="text-xs text-[#656d76] dark:text-[#8b949e]">
            {loaded
              ? `${scripts.length} script(s) staged · each compile produces a unique polymorphic IR`
              : 'Loading scripts…'}
          </p>
        </div>
        <Link
          href="/scripts/new"
          className="inline-flex items-center gap-1.5 rounded-md border border-[#12A594]/50 dark:border-[#2DD4BF]/50 bg-[#0F766E] dark:bg-[#0E8C7F] px-3 py-2 text-xs font-bold text-white hover:bg-[#0B5C53] dark:hover:bg-[#12A594] transition-colors cursor-pointer"
        >
          <Plus className="size-3.5" /> New script
        </Link>
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] py-20 text-xs text-[#656d76] dark:text-[#8b949e]">
          <Loader2 className="size-4 animate-spin" /> Loading scripts…
        </div>
      ) : (
        <ScriptsTable scripts={scripts} />
      )}
    </div>
  )
}
