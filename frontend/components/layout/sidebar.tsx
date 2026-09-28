'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Radar, Settings, X } from 'lucide-react'
import { DynamicIcon } from '@/components/ui'
import { navItems } from '@/data/navigation'
import { useDashboard } from '@/providers/dashboard-provider'
import { SettingsModal } from '@/components/modals/settings-modal'

interface SidebarProps {
  isOpen?: boolean
  onToggle?: () => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar({ isOpen = true, isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname()
  const { counts } = useDashboard()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden animate-in fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#0C0E11] transition-transform duration-300 ease-in-out ${
          isMobileOpen
            ? 'translate-x-0 shadow-2xl z-50'
            : isOpen
            ? '-translate-x-full lg:translate-x-0'
            : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-[#d0d7de] dark:border-[#24282F] px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-teal-500/10 text-[#0F766E] dark:text-[#2DD4BF] ring-1 ring-teal-500/30">
              <Radar className="size-4" />
            </div>
            <div className="text-sm font-bold tracking-wider text-[#1f2328] dark:text-[#f0f6fc]">
              TARTARUS
            </div>
          </Link>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="flex lg:hidden size-7 items-center justify-center rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#14181E] text-[#656d76] dark:text-[#8b949e] hover:bg-[#eff1f3] dark:hover:bg-[#1B1F26] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition-colors shadow-2xs cursor-pointer"
              title="Close navigation"
              aria-label="Close navigation"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="px-3 pt-4 flex-1 overflow-y-auto">
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#656d76] dark:text-[#8b949e]">
            Navigation
          </div>
          <nav className="flex flex-col gap-1" aria-label="Primary navigation">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href)
              const badge = item.badgeKey ? counts[item.badgeKey] : undefined
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={onCloseMobile}
                  className={`flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-xs transition-colors ${
                    active
                      ? 'bg-[#f6f8fa] text-[#0F766E] dark:bg-[#1B1F26] dark:text-[#f0f6fc] font-bold border border-[#d0d7de] dark:border-[#24282F]'
                      : 'text-[#1f2328] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#14181E] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                  }`}
                >
                  <DynamicIcon name={item.iconName} className="size-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="rounded bg-[#eff1f3] dark:bg-[#1B1F26] border border-[#d0d7de]/60 dark:border-[#24282F] px-1.5 py-0.5 text-[10px] text-[#656d76] dark:text-[#8b949e] font-mono font-semibold">
                      {badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer — bottom-left settings */}
        <div className="border-t border-[#d0d7de] dark:border-[#24282F] px-3 py-3">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-xs text-[#656d76] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#14181E] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition-colors cursor-pointer"
            title="Settings — manage data"
          >
            <Settings className="size-4 shrink-0" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
