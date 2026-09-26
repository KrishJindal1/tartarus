'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Radar,
  Bell,
  Server,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react'
import { useToast, ThemeToggle } from '@/components/ui'

interface HeaderProps {
  activeNav: string
  onNavigate?: (viewName: string) => void
  onOpenCommandPalette?: () => void
  onOpenAddEndpoint?: () => void
  isSidebarOpen?: boolean
  onToggleSidebar?: () => void
}

const mockForensicAlerts = [
  {
    id: 'ALT-101',
    title: 'BYOVD Callback Subversion Detected',
    time: '2m ago',
    type: 'warning',
    targetView: 'Live status',
    desc: 'Target driver handle disarmed kernel telemetry without EDR alert on NTRO-WIN-04.',
  },
  {
    id: 'ALT-102',
    title: 'Polymorphic Routine Regenerated',
    time: '14m ago',
    type: 'success',
    targetView: 'Deploy scripts',
    desc: 'Intermediate code hash mutated for jocky-core-forensics v2.4.1.',
  },
  {
    id: 'ALT-103',
    title: 'Covert Channel Verified',
    time: '26m ago',
    type: 'success',
    targetView: 'Endpoints',
    desc: 'Port 443 TLS 1.3 encrypted tunnel confirmed on FORENSIC-LNX-11.',
  },
]

export function Header({
  activeNav,
  onNavigate,
  onOpenCommandPalette,
  onOpenAddEndpoint,
  isSidebarOpen = true,
  onToggleSidebar,
}: HeaderProps) {
  const { toast } = useToast()
  const [isAlertsOpen, setIsAlertsOpen] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState('All Targets (Windows & Ubuntu)')
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false)
  const alertsRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
        setIsAlertsOpen(false)
      }
      if (targetRef.current && !targetRef.current.contains(event.target as Node)) {
        setIsTargetDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAlertClick = (alert: (typeof mockForensicAlerts)[0]) => {
    setIsAlertsOpen(false)
    if (onNavigate) {
      onNavigate(alert.targetView)
      toast(`Navigating to ${alert.targetView}: ${alert.title}`, 'info')
    }
  }

  const handleSelectTarget = (targetName: string) => {
    setSelectedTarget(targetName)
    setIsTargetDropdownOpen(false)
    toast(`Switched active forensic target to: ${targetName}`, 'info')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] bg-white/95 dark:bg-[#010409]/90 px-4 sm:px-8 backdrop-blur z-20 relative transition-colors duration-200">
      {/* Left title, toggle & breadcrumb */}
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

        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#656d76] dark:text-[#8b949e] font-medium">
            <span>JOCKEY</span>
            <span className="text-[#afb8c1] dark:text-[#6e7681]">/</span>
            <span className="text-[#1f2328] dark:text-[#f0f6fc] font-semibold">{activeNav}</span>
          </div>
        </div>
      </div>

      {/* Right controls: Target switcher, Secure routing badge, search, alerts & action */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Multi-System Target Switcher */}
        <div className="relative" ref={targetRef}>
          <button
            type="button"
            onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
            className="flex items-center gap-2 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] px-2.5 py-1.5 text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#eff1f3] dark:hover:bg-[#21262d] transition-colors shadow-2xs cursor-pointer"
          >
            <Server className="size-3.5 text-[#0969da] dark:text-[#58a6ff]" />
            <span className="max-w-[140px] sm:max-w-[180px] truncate">{selectedTarget}</span>
            <ChevronDown className="size-3 text-[#656d76] dark:text-[#8b949e]" />
          </button>

          {isTargetDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-2 shadow-2xl z-30 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                Connected Systems (Simultaneous)
              </div>
              <div className="flex flex-col gap-1 mt-1 text-xs">
                {[
                  { name: 'All Targets (Windows & Ubuntu)', os: 'Hybrid Cluster' },
                  { name: 'NTRO-WIN-04', os: 'Windows 11 Enterprise' },
                  { name: 'FORENSIC-LNX-11', os: 'Ubuntu 22.04.3 LTS' },
                  { name: 'NTRO-SRV-02', os: 'Windows Server 2022' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.name}
                    onClick={() => handleSelectTarget(item.name)}
                    className={`flex items-center justify-between p-2 rounded-md text-left transition-colors cursor-pointer ${
                      selectedTarget === item.name
                        ? 'bg-[#eff1f3] dark:bg-[#21262d] text-[#0969da] dark:text-[#58a6ff] font-bold'
                        : 'hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] text-[#1f2328] dark:text-[#e6edf3]'
                    }`}
                  >
                    <div>
                      <div className="text-xs">{item.name}</div>
                      <div className="text-[10px] text-[#656d76] dark:text-[#8b949e]">{item.os}</div>
                    </div>
                    {selectedTarget === item.name && (
                      <CheckCircle2 className="size-3.5 text-[#1a7f37] dark:text-[#3fb950] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle compact />

        {/* Forensic Alerts Popover */}
        <div className="relative" ref={alertsRef}>
          <button
            type="button"
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="relative flex size-8 items-center justify-center rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] text-[#656d76] dark:text-[#e6edf3] hover:bg-[#eff1f3] dark:hover:bg-[#21262d] shadow-2xs transition-colors cursor-pointer"
            aria-label="Forensic Alerts"
          >
            <Bell className="size-4" />
            <span className="absolute right-1 top-1 size-2 rounded-full bg-[#0969da] dark:bg-[#58a6ff] ring-2 ring-white dark:ring-[#161b22] animate-pulse" />
          </button>

          {isAlertsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-4 shadow-2xl z-30 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1f2328] dark:text-[#f0f6fc]">
                    Forensic & Telemetry Alerts
                  </h4>
                  <span className="rounded-full bg-[#eff1f3] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 text-[10px] font-bold text-[#0969da] dark:text-[#58a6ff]">
                    3 New
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAlertsOpen(false)
                    toast('Cleared notification badge.', 'info')
                  }}
                  className="text-[11px] text-[#0969da] dark:text-[#58a6ff] hover:underline cursor-pointer font-medium"
                >
                  Mark all read
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                {mockForensicAlerts.map((alert) => (
                  <button
                    type="button"
                    key={alert.id}
                    onClick={() => handleAlertClick(alert)}
                    className="w-full text-left rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] p-2.5 text-xs hover:border-[#0969da] dark:hover:border-[#58a6ff] hover:bg-white dark:hover:bg-[#21262d] transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-1.5 group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition-colors">
                        {alert.type === 'warning' ? (
                          <AlertTriangle className="size-3.5 text-[#9a6700] dark:text-[#d29922] shrink-0" />
                        ) : (
                          <CheckCircle2 className="size-3.5 text-[#1a7f37] dark:text-[#3fb950] shrink-0" />
                        )}
                        {alert.title}
                      </span>
                      <span className="text-[10px] text-[#656d76] dark:text-[#8b949e]">{alert.time}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-[#656d76] dark:text-[#8b949e]">
                      {alert.desc}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-[#0969da] dark:text-[#58a6ff] pt-1.5 border-t border-[#d0d7de]/80 dark:border-[#30363d]">
                      <span>Go to {alert.targetView}</span>
                      <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
