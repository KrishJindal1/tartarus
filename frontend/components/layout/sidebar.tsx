'use client'

import React, { useState } from 'react'
import { Radar, Settings2, PanelLeftClose, X } from 'lucide-react'
import { StatusDot, DynamicIcon, useToast } from '@/components/ui'
import { EnvironmentConfigModal, UserProfileModal } from '@/components/modals'
import { navItems } from '@/data/navigation'

interface SidebarProps {
  activeNav: string
  onSelectNav: (label: string) => void
  isOpen?: boolean
  onToggle?: () => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export function Sidebar({
  activeNav,
  onSelectNav,
  isOpen = true,
  onToggle,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { toast } = useToast()
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState('NTRO-OP-07')

  const handleSaveEnv = (config: any) => {
    toast(`Updated telemetry mode: ${config.telemetryMode}`, 'success')
  }

  const handleUpdateRole = (role: string) => {
    toast(`Active operator role updated to: ${role}`, 'info')
  }

  const handleNavClick = (label: string) => {
    onSelectNav(label)
    if (onCloseMobile) {
      onCloseMobile()
    }
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden animate-in fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#010409] transition-transform duration-300 ease-in-out ${
          isMobileOpen
            ? 'translate-x-0 shadow-2xl z-50'
            : isOpen
            ? '-translate-x-full lg:translate-x-0'
            : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-[#0969da] dark:text-[#58a6ff] ring-1 ring-sky-500/30">
              <Radar className="size-4" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider text-[#1f2328] dark:text-[#f0f6fc]">
                JOCKEY
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="flex size-2 rounded-full bg-[#1a7f37] dark:bg-[#3fb950] ring-2 ring-emerald-400/20 animate-pulse"
              title="Central Control Active"
            />

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="flex lg:hidden size-7 items-center justify-center rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] text-[#656d76] dark:text-[#8b949e] hover:bg-[#eff1f3] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition-colors shadow-2xs cursor-pointer"
                title="Close navigation"
                aria-label="Close navigation"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation section */}
        <div className="px-3 pt-4 flex-1 overflow-y-auto">
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#656d76] dark:text-[#8b949e]">
            Navigation
          </div>
          <nav className="flex flex-col gap-1" aria-label="Primary navigation">
            {navItems.map((item) => {
              const active = activeNav === item.label
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => handleNavClick(item.label)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-xs transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#f6f8fa] text-[#0969da] dark:bg-[#1f242c] dark:text-[#f0f6fc] font-bold border border-[#d0d7de] dark:border-[#30363d]'
                      : 'text-[#1f2328] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                  }`}
                >
                  <DynamicIcon name={item.iconName} className="size-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.count !== undefined && (
                    <span className="rounded bg-[#eff1f3] dark:bg-[#21262d] border border-[#d0d7de]/60 dark:border-[#30363d] px-1.5 py-0.5 text-[10px] text-[#656d76] dark:text-[#8b949e] font-mono font-semibold">
                      {item.count}
                    </span>
                  )}
                  {item.live && <StatusDot tone="emerald" pulse />}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Footer info on Left Side */}
        <div className="p-3 border-t border-[#d0d7de] dark:border-[#30363d] flex items-center justify-between gap-2">
          {/* Profile Context */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex flex-1 items-center gap-2 rounded-lg p-1.5 text-xs text-[#1f2328] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] dark:hover:text-[#f0f6fc] transition-colors cursor-pointer"
          >
            <div className="flex size-6 items-center justify-center rounded-full bg-[#ddf4ff] dark:bg-sky-500/20 text-[10px] font-bold text-[#0969da] dark:text-[#58a6ff]">
              OP
            </div>
            <span className="flex-1 text-left font-semibold text-[#1f2328] dark:text-[#f0f6fc] truncate">{currentRole}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEnvModalOpen(true)}
            className="flex size-7 items-center justify-center rounded-md text-[#656d76] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition-colors cursor-pointer"
            title="Telemetry Settings"
          >
            <Settings2 className="size-3.5" />
          </button>
        </div>
      </aside>

      <EnvironmentConfigModal
        isOpen={isEnvModalOpen}
        onClose={() => setIsEnvModalOpen(false)}
        onSave={handleSaveEnv}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdateRole={handleUpdateRole}
      />
    </>
  )
}
