import React, { memo } from 'react'
import { Card, CardHeader } from '@/components/ui'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { ToneColor } from '@/types'

interface QuickActionItem {
  iconName: string
  label: string
  tone: ToneColor
}

interface QuickActionsGridProps {
  onActionClick?: (action: string) => void
}

const quickActions: QuickActionItem[] = [
  { iconName: 'TerminalSquare', label: 'Deploy script', tone: 'violet' },
  { iconName: 'Server', label: 'Add endpoint', tone: 'cyan' },
  { iconName: 'FileCheck2', label: 'Generate report', tone: 'sky' },
  { iconName: 'Database', label: 'Browse evidence', tone: 'slate' },
]

const toneMap: Record<string, { bg: string; text: string }> = {
  violet: { bg: 'bg-[#fbefff] dark:bg-[#bc8cff]/15', text: 'text-[#8250df] dark:text-[#d2a8ff]' },
  cyan: { bg: 'bg-[#ddf4ff] dark:bg-[#388bfd]/15', text: 'text-[#0969da] dark:text-[#58a6ff]' },
  sky: { bg: 'bg-[#ddf4ff] dark:bg-[#388bfd]/15', text: 'text-[#0969da] dark:text-[#58a6ff]' },
  slate: { bg: 'bg-[#f6f8fa] dark:bg-[#21262d]', text: 'text-[#656d76] dark:text-[#8b949e]' },
}

export const QuickActionsGrid = memo(function QuickActionsGrid({
  onActionClick,
}: QuickActionsGridProps) {
  return (
    <Card aria-labelledby="quick-title" className="border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] overflow-hidden">
      <CardHeader className="bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d]">
        <div>
          <h3 id="quick-title" className="text-sm font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
            Quick actions
          </h3>
          <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">Common operations for your workspace.</p>
        </div>
      </CardHeader>

      <div className="grid grid-cols-2 gap-2 p-4">
        {quickActions.map((action) => {
          const toneConfig = toneMap[action.tone] || { bg: 'bg-[#ddf4ff] dark:bg-[#388bfd]/15', text: 'text-[#0969da] dark:text-[#58a6ff]' }
          return (
            <button
              type="button"
              key={action.label}
              onClick={() => onActionClick?.(action.label)}
              className="group flex flex-col items-start gap-3 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] p-3 text-left transition-all hover:border-[#0969da] dark:hover:border-[#58a6ff] hover:bg-white dark:hover:bg-[#1f242c] shadow-2xs cursor-pointer"
            >
              <div
                className={`flex size-7 items-center justify-center rounded-md ${toneConfig.bg} ${toneConfig.text}`}
              >
                <DynamicIcon name={action.iconName} className="size-3.5" />
              </div>
              <span className="text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff]">
                {action.label}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
})
