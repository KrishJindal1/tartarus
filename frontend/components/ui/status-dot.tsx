import React, { memo } from 'react'
import { ToneColor } from '@/types'

interface StatusDotProps {
  tone?: ToneColor | string
  className?: string
  pulse?: boolean
}

const toneMap: Record<string, string> = {
  sky: 'bg-[#0969da] dark:bg-[#58a6ff]',
  slate: 'bg-[#656d76] dark:bg-[#8b949e]',
  blue: 'bg-[#0969da] dark:bg-[#58a6ff]',
  violet: 'bg-[#8250df] dark:text-[#d2a8ff]',
  cyan: 'bg-[#0969da] dark:bg-[#58a6ff]',
  emerald: 'bg-[#1a7f37] dark:bg-[#3fb950]',
  amber: 'bg-[#9a6700] dark:bg-[#d29922]',
  rose: 'bg-[#cf222e] dark:bg-[#f85149]',
}

export const StatusDot = memo(function StatusDot({
  tone = 'sky',
  className = '',
  pulse = false,
}: StatusDotProps) {
  const colorClass = toneMap[tone] || 'bg-[#0969da] dark:bg-[#58a6ff]'
  return (
    <span
      className={`inline-block size-2 rounded-full ${colorClass} ${
        pulse ? 'animate-pulse' : ''
      } ${className}`}
      aria-hidden="true"
    />
  )
})
