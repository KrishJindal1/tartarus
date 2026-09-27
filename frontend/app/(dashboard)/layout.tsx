'use client'

import React, { useEffect, useState } from 'react'
import { Sidebar, Header } from '@/components/layout'
import { CommandPaletteModal } from '@/components/modals'
import { useToast } from '@/components/ui'
import { DashboardProvider, useDashboard } from '@/providers/dashboard-provider'

function Shell({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const { runSuite, running } = useDashboard()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileSidebarOpen((prev) => !prev)
    } else {
      setIsSidebarOpen((prev) => !prev)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        handleToggleSidebar()
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleRunSuite = async () => {
    if (running) return
    const res = await runSuite()
    if (!res) {
      toast('Nothing to run — need at least one online agent and one staged script.', 'info')
      return
    }
    toast(
      `Queued ${res.queued}/${res.total} script job(s) on ${res.target}.`,
      res.queued > 0 ? 'success' : 'error'
    )
  }

  const handlePaletteAction = (actionName: string) => {
    if (actionName === 'run-suite') {
      handleRunSuite()
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fa] dark:bg-[#0d1117] text-[#1f2328] dark:text-[#e6edf3] antialiased font-sans transition-colors duration-200">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'lg:pl-[240px]' : 'lg:pl-0'
        }`}
      >
        <Header
          onOpenCommandPalette={() => setIsPaletteOpen(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />
        <div className="p-5 sm:p-8 max-w-[1600px] mx-auto">{children}</div>
      </div>

      <CommandPaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onAction={handlePaletteAction}
      />
    </main>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <Shell>{children}</Shell>
    </DashboardProvider>
  )
}
