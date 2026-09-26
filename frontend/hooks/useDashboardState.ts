'use client'

import { useState, useMemo, useCallback } from 'react'
import { endpointsData } from '@/data/endpoints'
import { scriptsData } from '@/data/scripts'
import { reportsData } from '@/data/reports'
import { evidenceData } from '@/data/evidence'
import { timelineData } from '@/data/timeline'
import { Endpoint, ScriptItem, ReportItem, EvidenceItem } from '@/types'

export function useDashboardState(initialNav = 'Overview') {
  const [activeNav, setActiveNav] = useState<string>(initialNav)
  const [running, setRunning] = useState<boolean>(false)
  const [query, setQuery] = useState<string>('')
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null)
  const [alertsPaused, setAlertsPaused] = useState<boolean>(false)

  // Mutable datasets
  const [endpoints, setEndpoints] = useState<Endpoint[]>(endpointsData)
  const [scripts, setScripts] = useState<ScriptItem[]>(scriptsData)
  const [reports, setReports] = useState<ReportItem[]>(reportsData)
  const [evidence, setEvidence] = useState<EvidenceItem[]>(evidenceData)

  const filteredEndpoints = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return endpoints
    return endpoints.filter(
      (endpoint: Endpoint) =>
        endpoint.name.toLowerCase().includes(trimmed) ||
        endpoint.url.toLowerCase().includes(trimmed) ||
        endpoint.platform.toLowerCase().includes(trimmed)
    )
  }, [endpoints, query])

  const handleSelectNav = useCallback((label: string) => {
    setActiveNav(label)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setQuery(value)
  }, [])

  const handleSelectEndpoint = useCallback((name: string) => {
    setSelectedEndpoint((prev) => (prev === name ? null : name))
  }, [])

  const handleRun = useCallback(() => {
    setRunning(true)
    const timer = window.setTimeout(() => {
      setRunning(false)
    }, 1800)
    return () => clearTimeout(timer)
  }, [])

  const addEndpoint = useCallback((newEndpoint: Endpoint) => {
    setEndpoints((prev) => [newEndpoint, ...prev])
  }, [])

  const updateEndpoint = useCallback((updated: Endpoint) => {
    setEndpoints((prev) =>
      prev.map((e) => (e.name === updated.name ? updated : e))
    )
  }, [])

  const deleteEndpoint = useCallback((name: string) => {
    setEndpoints((prev) => prev.filter((e) => e.name !== name))
  }, [])

  const toggleDeployScript = useCallback((scriptName: string) => {
    setScripts((prev) =>
      prev.map((s) => {
        if (s.name === scriptName) {
          const nextDeployed = !s.isDeployed
          return {
            ...s,
            isDeployed: nextDeployed,
            lastDeployedOrDraft: nextDeployed
              ? 'Deployed just now'
              : 'Draft rollback activated',
          }
        }
        return s
      })
    )
  }, [])

  const importScript = useCallback((newScript: ScriptItem) => {
    setScripts((prev) => [newScript, ...prev])
  }, [])

  const addReport = useCallback((newReport: ReportItem) => {
    setReports((prev) => [newReport, ...prev])
  }, [])

  const togglePauseAlerts = useCallback(() => {
    setAlertsPaused((prev) => !prev)
  }, [])

  const exportWorkspaceData = useCallback(() => {
    const payload = {
      exported_at: new Date().toISOString(),
      workspace: 'JOCKEY Forensic & Telemetry Central Plane',
      metrics: {
        active_endpoints: endpoints.length,
        scripts_count: scripts.length,
        reports_count: reports.length,
        evidence_count: evidence.length,
      },
      endpoints,
      scripts,
      reports,
      evidence,
      timeline: timelineData,
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `jockey-workspace-export-${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }, [endpoints, scripts, reports, evidence])

  const downloadEvidenceFile = useCallback((fileName: string) => {
    const mockContent = `[JOCKEY FORENSIC EVIDENCE DUMP]\nFilename: ${fileName}\nTimestamp: ${new Date().toISOString()}\nNode: us-east-prod-02\nIntegrity: SHA-256 Validated\nData: Telemetry buffer capture OK.`
    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(mockContent)
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', fileName)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }, [])

  return {
    activeNav,
    setActiveNav: handleSelectNav,
    running,
    query,
    setQuery: handleSearchChange,
    selectedEndpoint,
    setSelectedEndpoint: handleSelectEndpoint,
    filteredEndpoints,
    endpoints,
    scripts,
    reports,
    evidence,
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
  }
}
