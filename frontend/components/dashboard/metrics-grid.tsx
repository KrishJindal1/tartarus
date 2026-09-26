import React, { memo } from 'react'
import { Card } from '@/components/ui'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { MetricCard } from '@/types'

interface MetricsGridProps {
  metrics: MetricCard[]
  onNavigate?: (viewName: string) => void
}

const toneIconColors: Record<string, string> = {
  cyan: 'text-[#0969da] dark:text-[#58a6ff]',
  violet: 'text-[#8250df] dark:text-[#d2a8ff]',
  sky: 'text-[#0969da] dark:text-[#58a6ff]',
  slate: 'text-[#656d76] dark:text-[#8b949e]',
  emerald: 'text-[#1a7f37] dark:text-[#3fb950]',
  amber: 'text-[#9a6700] dark:text-[#d29922]',
}

export const MetricsGrid = memo(function MetricsGrid({ metrics, onNavigate }: MetricsGridProps) {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3" aria-label="Summary metrics">
      {metrics.map((metric) => {
        const iconColor = toneIconColors[metric.tone] || 'text-[#0969da] dark:text-[#58a6ff]'
        return (
          <button
            key={metric.label}
            type="button"
            onClick={() => metric.targetView && onNavigate && onNavigate(metric.targetView)}
            className="text-left group cursor-pointer focus:outline-hidden"
          >
            <Card className="p-3.5 h-full flex flex-col justify-between transition-all duration-200 border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] group-hover:border-[#0969da] dark:group-hover:border-[#58a6ff] group-hover:shadow-xs group-hover:-translate-y-0.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-[#656d76] dark:text-[#8b949e] font-medium group-hover:text-[#1f2328] dark:group-hover:text-[#f0f6fc] transition-colors">
                  {metric.label}
                </span>
                <DynamicIcon name={metric.iconName} className={`size-4 ${iconColor} group-hover:scale-110 transition-transform`} />
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#1f2328] dark:text-[#f0f6fc] font-mono">
                {metric.value}
              </div>
              <div className="mt-1 text-[11px] leading-snug text-[#656d76] dark:text-[#8b949e] truncate">
                {metric.sub}
              </div>
            </Card>
          </button>
        )
      })}
    </section>
  )
})
