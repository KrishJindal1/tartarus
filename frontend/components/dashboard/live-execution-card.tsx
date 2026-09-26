import React from 'react'
import { CircleDot, MoreHorizontal, Activity } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui'

interface LiveExecutionCardProps {
  onOpenLiveMonitor: () => void
}

export function LiveExecutionCard({ onOpenLiveMonitor }: LiveExecutionCardProps) {
  return (
    <Card aria-labelledby="live-title" className="border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] overflow-hidden">
      <CardHeader className="bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d]">
        <div>
          <div className="flex items-center gap-2">
            <h3 id="live-title" className="text-sm font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
              Live execution
            </h3>
            <span className="flex items-center gap-1 rounded-full bg-[#ddf4ff] dark:bg-[#388bfd]/20 px-2 py-0.5 text-[10px] font-medium text-[#0969da] dark:text-[#58a6ff]">
              <CircleDot className="size-2.5 animate-pulse text-[#0969da] dark:text-[#58a6ff]" /> Live
            </span>
          </div>
          <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">smoke-test-v4 running now</p>
        </div>
        <MoreHorizontal className="size-4 text-[#656d76] dark:text-[#8b949e] cursor-pointer hover:text-[#1f2328] dark:hover:text-[#f0f6fc]" />
      </CardHeader>

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="text-3xl font-semibold tracking-tight text-[#1f2328] dark:text-[#f0f6fc]">
              78<span className="text-lg text-[#656d76] dark:text-[#8b949e] font-normal">%</span>
            </div>
            <div className="mt-1 text-[11px] text-[#656d76] dark:text-[#8b949e]">18 of 24 endpoints tested</div>
          </div>
          <span className="font-mono text-[11px] font-semibold text-[#0969da] dark:text-[#58a6ff] bg-[#f6f8fa] dark:bg-[#21262d] px-2 py-0.5 rounded border border-[#d0d7de] dark:border-[#30363d]">
            00:04:32
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d]">
          <div className="h-full w-[78%] rounded-full bg-[#1f883d] dark:bg-[#238636] transition-all duration-500" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-md bg-[#dafbe1] dark:bg-[#238636]/20 border border-[#4ac26b]/30 dark:border-[#238636]/40 p-2.5 text-center">
            <div className="text-lg font-bold text-[#1a7f37] dark:text-[#3fb950]">16</div>
            <div className="text-[10px] font-medium text-[#1a7f37] dark:text-[#3fb950]">Passed</div>
          </div>
          <div className="rounded-md bg-[#fff8c5] dark:bg-[#d29922]/15 border border-[#d4a72c]/30 dark:border-[#d29922]/30 p-2.5 text-center">
            <div className="text-lg font-bold text-[#9a6700] dark:text-[#d29922]">2</div>
            <div className="text-[10px] font-medium text-[#9a6700] dark:text-[#d29922]">Warnings</div>
          </div>
          <div className="rounded-md bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] p-2.5 text-center">
            <div className="text-lg font-bold text-[#656d76] dark:text-[#8b949e]">6</div>
            <div className="text-[10px] font-medium text-[#656d76] dark:text-[#8b949e]">Queued</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenLiveMonitor}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] py-2 text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors shadow-2xs cursor-pointer"
        >
          <Activity className="size-3.5 text-[#0969da] dark:text-[#58a6ff]" /> Open live monitor
        </button>
      </div>
    </Card>
  )
}
