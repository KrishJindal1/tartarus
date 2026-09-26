import React from 'react'
import { Card, CardHeader } from '@/components/ui'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { TimelineEvent } from '@/types'

interface RecentActivityTimelineProps {
  timeline: TimelineEvent[]
  onViewTimeline: () => void
}

const toneStyles: Record<string, { bg: string; text: string }> = {
  sky: { bg: 'bg-[#ddf4ff] dark:bg-[#388bfd]/15', text: 'text-[#0969da] dark:text-[#58a6ff]' },
  blue: { bg: 'bg-[#ddf4ff] dark:bg-[#388bfd]/15', text: 'text-[#0969da] dark:text-[#58a6ff]' },
  slate: { bg: 'bg-[#f6f8fa] dark:bg-[#21262d]', text: 'text-[#656d76] dark:text-[#8b949e]' },
  violet: { bg: 'bg-[#fbefff] dark:bg-[#bc8cff]/15', text: 'text-[#8250df] dark:text-[#d2a8ff]' },
  emerald: { bg: 'bg-[#dafbe1] dark:bg-[#238636]/20', text: 'text-[#1a7f37] dark:text-[#3fb950]' },
  amber: { bg: 'bg-[#fff8c5] dark:bg-[#d29922]/15', text: 'text-[#9a6700] dark:text-[#d29922]' },
}

export function RecentActivityTimeline({ timeline, onViewTimeline }: RecentActivityTimelineProps) {
  return (
    <Card aria-labelledby="timeline-title" className="border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] overflow-hidden">
      <CardHeader className="bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d]">
        <div>
          <h3 id="timeline-title" className="text-sm font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
            Recent activity
          </h3>
          <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">A unified timeline of workspace changes.</p>
        </div>
        <button
          type="button"
          onClick={onViewTimeline}
          className="text-[11px] font-semibold text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition-colors cursor-pointer"
        >
          View timeline →
        </button>
      </CardHeader>

      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          {timeline.map((event) => {
            const toneConfig = toneStyles[event.tone] || { bg: 'bg-[#ddf4ff] dark:bg-[#388bfd]/15', text: 'text-[#0969da] dark:text-[#58a6ff]' }
            return (
              <div key={event.title} className="flex gap-3 items-start">
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${toneConfig.bg} ${toneConfig.text} mt-0.5 border border-[#d0d7de]/50 dark:border-[#30363d]`}
                >
                  <DynamicIcon name={event.iconName} className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col justify-between gap-1 sm:flex-row">
                    <span className="text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc]">{event.title}</span>
                    <span className="text-[10px] text-[#656d76] dark:text-[#8b949e] font-mono">{event.time}</span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[11px] text-[#656d76] dark:text-[#8b949e]">{event.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
