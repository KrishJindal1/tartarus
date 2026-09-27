'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { JobsTable } from '@/components/dashboard'
import { useDashboard } from '@/providers/dashboard-provider'

export default function JobsPage() {
  const { jobs, loaded } = useDashboard()

  const completed = jobs.filter((j) => j.status === 'completed').length
  const failed = jobs.filter((j) => j.status === 'failed').length
  const active = jobs.filter(
    (j) => j.status === 'dispatched' || j.status === 'executing' || j.status === 'queued'
  ).length

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-bold text-[#1f2328] dark:text-[#f0f6fc]">Jobs</h1>
        <p className="text-xs text-[#656d76] dark:text-[#8b949e]">
          {loaded ? (
            <>
              {jobs.length} job(s) · {active} active · {completed} completed · {failed} failed
            </>
          ) : (
            'Loading jobs…'
          )}
        </p>
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] py-20 text-xs text-[#656d76] dark:text-[#8b949e]">
          <Loader2 className="size-4 animate-spin" /> Loading jobs…
        </div>
      ) : (
        <JobsTable jobs={jobs} />
      )}
    </div>
  )
}
