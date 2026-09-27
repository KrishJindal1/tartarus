'use client'

import React, { useState } from 'react'
import { Sidebar, Header } from '@/components/layout'
import {
  OverviewView,
  EndpointsView,
  DeployScriptsView,
  LiveStatusView,
  ResultsView,
  EvidenceView,
  ReportsView,
  TimelineView,
} from '@/components/views'
import { AddEndpointModal, CommandPaletteModal } from '@/components/modals'
import { useDashboardState } from '@/hooks'
import { useToast } from '@/components/ui'

export function DashboardApp() {
  const { toast } = useToast()
  const {
    activeNav,
    setActiveNav,
    running,
    query,
    setQuery,
    selectedEndpoint,
    setSelectedEndpoint,
    filteredEndpoints,
    endpoints,
    scripts,
    reports,
    evidence,
    jobs,
    metrics,
    alertsPaused,
    handleRun,
    addEndpoint,
    updateEndpoint,
    deleteEndpoint,
    toggleDeployScript,
    importScript,
    addReport,
    togglePauseAlerts,
    exportWorkspaceData,
    downloadEvidenceFile,
  } = useDashboardState('Overview')

  const [selectedScriptName, setSelectedScriptName] = useState<string | null>(null)
  const [isHeaderAddOpen, setIsHeaderAddOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const handleNavigateToScript = (scriptName: string) => {
    setSelectedScriptName(scriptName)
    setActiveNav('Deploy scripts')
  }

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileSidebarOpen((prev) => !prev)
    } else {
      setIsSidebarOpen((prev) => !prev)
    }
  }

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        handleToggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCommandPaletteAction = (actionName: string) => {
    if (actionName === 'add-endpoint') {
      setIsHeaderAddOpen(true)
    } else if (actionName === 'run-suite') {
      handleRun()
      toast('Test suite execution started via command palette.', 'info')
    } else if (actionName === 'export-json') {
      exportWorkspaceData()
      toast('Workspace data export generated.', 'success')
    } else if (actionName === 'open-palette') {
      setIsCommandPaletteOpen(true)
    }
  }

  const renderCurrentView = () => {
    switch (activeNav) {
      case 'Endpoints':
        return (
          <EndpointsView
            endpoints={endpoints}
            onRun={handleRun}
            onExport={exportWorkspaceData}
            onAddEndpoint={addEndpoint}
            onUpdateEndpoint={updateEndpoint}
            onDeleteEndpoint={deleteEndpoint}
            onNavigateScript={handleNavigateToScript}
          />
        )
      case 'Deploy scripts':
        return (
          <DeployScriptsView
            scripts={scripts}
            selectedScriptName={selectedScriptName}
            onRun={handleRun}
            onExport={exportWorkspaceData}
            onToggleDeploy={toggleDeployScript}
            onImportScript={importScript}
          />
        )
      case 'Live status':
        return (
          <LiveStatusView
            onRun={handleRun}
            onExport={exportWorkspaceData}
            alertsPaused={alertsPaused}
            onTogglePauseAlerts={togglePauseAlerts}
          />
        )
      case 'Results':
        return <ResultsView onRun={handleRun} onExport={exportWorkspaceData} />
      case 'Evidence':
        return (
          <EvidenceView
            evidence={evidence}
            onRun={handleRun}
            onExport={exportWorkspaceData}
            onDownloadFile={downloadEvidenceFile}
          />
        )
      case 'Reports':
        return (
          <ReportsView
            reports={reports}
            onRun={handleRun}
            onExport={exportWorkspaceData}
            onAddReport={addReport}
          />
        )
      case 'Timeline':
        return <TimelineView onRun={handleRun} onExport={exportWorkspaceData} />
      case 'Overview':
      default:
        return (
          <OverviewView
            running={running}
            jobs={jobs}
            metrics={metrics}
            onRun={handleRun}
            onExport={exportWorkspaceData}
            filteredEndpoints={filteredEndpoints}
            totalEndpointsCount={endpoints.length}
            searchQuery={query}
            onSearchChange={setQuery}
            selectedEndpoint={selectedEndpoint}
            onSelectEndpoint={setSelectedEndpoint}
            onNavigate={setActiveNav}
            onNavigateScript={handleNavigateToScript}
            onOpenAddEndpoint={() => setIsHeaderAddOpen(true)}
          />
        )
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fa] dark:bg-[#0d1117] text-[#1f2328] dark:text-[#e6edf3] antialiased font-sans transition-colors duration-200">
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
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
          activeNav={activeNav}
          onNavigate={setActiveNav}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAddEndpoint={() => setIsHeaderAddOpen(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />
        <div className="p-5 sm:p-8 max-w-[1600px] mx-auto">
          {renderCurrentView()}
        </div>
      </div>

      <AddEndpointModal
        isOpen={isHeaderAddOpen}
        onClose={() => setIsHeaderAddOpen(false)}
        onAdd={(newEndpoint) => {
          addEndpoint(newEndpoint)
          toast(`Endpoint "${newEndpoint.name}" added successfully!`, 'success')
        }}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setActiveNav}
        onAction={handleCommandPaletteAction}
      />
    </main>
  )
}
