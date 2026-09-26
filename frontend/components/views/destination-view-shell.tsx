'use client'

import React from 'react'
import { StatusDot } from '@/components/ui'
import { viewCopyData } from '@/data/viewCopy'

interface DestinationViewShellProps {
  name: string
  onRun?: () => void
  onExport?: () => void
  children: React.ReactNode
}

export function DestinationViewShell({
  name,
  children,
}: DestinationViewShellProps) {
  const copy = viewCopyData[name] || {
    eyebrow: 'Workspace',
    title: name,
    description: 'Manage and inspect workspace details.',
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#0969da] dark:text-[#58a6ff]">
            <StatusDot tone="sky" /> {copy.eyebrow}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1f2328] dark:text-[#f0f6fc]">{copy.title}</h2>
          <p className="mt-1 text-sm text-[#656d76] dark:text-[#8b949e]">{copy.description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}
