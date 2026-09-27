'use client'

import React, { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { RunWorkflowContainer } from '@/components/run/run-workflow'

export default function RunPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] py-20 text-xs text-[#656d76] dark:text-[#8b949e]">
          <Loader2 className="size-4 animate-spin" /> Loading workflow…
        </div>
      }
    >
      <RunWorkflowContainer />
    </Suspense>
  )
}
