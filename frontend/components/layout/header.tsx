'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Radar, PanelLeftOpen, PanelLeftClose, Search } from 'lucide-react'
import { ThemeToggle } from '@/components/ui'

interface HeaderProps {
  onOpenCommandPalette?: () => void
  isSidebarOpen?: boolean
  onToggleSidebar?: () => void
}

function titleForPath(pathname: string): string {
  if (pathname === '/') return 'Overview'
  const first = pathname.split('/').filter(Boolean)[0] ?? ''
  const known: Record<string, string> = {
    agents: 'Agents',
    scripts: 'Scripts',
    jobs: 'Jobs',
    evidence: 'Evidence',
    reports: 'Reports',
  }
  if (!known[first]) return 'Overview'
  const second = pathname.split('/').filter(Boolean)[1]
  if (first === 'scripts' && second === 'new') return 'New Script'
  if (second) return known[first]
  return known[first]
}

export function Header({
  onOpenCommandPalette,
  isSidebarOpen = true,
  onToggleSidebar,
}: HeaderProps) {
  const pathname = usePathname()
  const title = titleForPath(pathname)

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] bg-white/95 dark:bg-[#010409]/90 px-4 sm:px-8 backdrop-blur z-20 relative transition-colors duration-200">
      {/* Left: toggle + breadcrumb */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex size-8 items-center justify-center rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] text-[#656d76] dark:text-[#e6edf3] hover:bg-[#eff1f3] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition-colors cursor-pointer shadow-2xs"
            title={isSidebarOpen ? 'Close sidebar (Ctrl+B)' : 'Open sidebar (Ctrl+B)'}
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4 text-[#0969da] dark:text-[#58a6ff]" />
            )}
          </button>
        )}

        {!isSidebarOpen && (
          <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-[#0969da] dark:text-[#58a6ff] ring-1 ring-sky-500/30">
            <Radar className="size-4" />
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-[#656d76] dark:text-[#8b949e] font-medium">
          <span>JOCKEY</span>
          <span className="text-[#afb8c1] dark:text-[#6e7681]">/</span>
          <span className="text-[#1f2328] dark:text-[#f0f6fc] font-semibold">{title}</span>
        </div>
      </div>

      {/* Right: command palette + theme */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-2 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] px-2.5 py-1.5 text-xs text-[#656d76] dark:text-[#8b949e] hover:bg-[#eff1f3] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition-colors shadow-2xs cursor-pointer"
            title="Command palette"
          >
            <Search className="size-3.5" />
            <span>Search…</span>
            <kbd className="rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-1 py-0.5 text-[10px] font-mono">
              Ctrl K
            </kbd>
          </button>
        )}

        <ThemeToggle compact />
      </div>
    </header>
  )
}
