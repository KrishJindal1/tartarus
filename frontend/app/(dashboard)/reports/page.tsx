'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { ReportsTable } from '@/components/dashboard'
import { useDashboard } from '@/providers/dashboard-provider'

export default function ReportsPage() {
  const { reports, loaded } = useDashboard()

  const critical = reports.reduce((n, r) => n + r.critical, 0)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-bold text-[#1f2328] dark:text-[#f0f6fc]">Reports</h1>
        <p className="text-xs text-[#656d76] dark:text-[#8b949e]">
          {loaded ? (
            <>
              {reports.length} report(s) · {critical} critical finding(s) · generated automatically
              when a job completes (JSON + PDF)
            </>
          ) : (
            'Loading reports…'
          )}
        </p>
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] py-20 text-xs text-[#656d76] dark:text-[#8b949e]">
          <Loader2 className="size-4 animate-spin" /> Loading reports…
        </div>
      ) : (
        <ReportsTable reports={reports} />
      )}
    </div>
  )
}
