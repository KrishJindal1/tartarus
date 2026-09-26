'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { scriptsData } from '@/data/scripts'
import { reportsData } from '@/data/reports'
import { evidenceData } from '@/data/evidence'
import { timelineData } from '@/data/timeline'
import { Endpoint, ScriptItem, ReportItem, EvidenceItem } from '@/types'

interface BackendAgent {
  agent_id: string
  hostname: string
  os: string
  architecture: string
  status: string
}

export function useDashboardState(initialNav = 'Overview') {
  const [activeNav, setActiveNav] = useState<string>(initialNav)
  const [running, setRunning] = useState<boolean>(false)
  const [query, setQuery] = useState<string>('')
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null)
  const [alertsPaused, setAlertsPaused] = useState<boolean>(false)

  // Mutable datasets
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [scripts, setScripts] = useState<ScriptItem[]>(scriptsData)
  const [reports, setReports] = useState<ReportItem[]>(reportsData)
  const [evidence, setEvidence] = useState<EvidenceItem[]>(evidenceData)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/agents/')

        if (!response.ok) {
          throw new Error(`Failed to fetch agents: ${response.status}`)
        }

        const agents: BackendAgent[] = await response.json()

        const mappedEndpoints: Endpoint[] = agents.map((agent) => ({
          name: agent.hostname,
          agentId: agent.agent_id,
          hostname: agent.hostname,
          ip: '',
          url: `/agents/${agent.agent_id}`,
          method: 'POST',
          status: agent.status === 'online' ? 'Healthy' : 'Degraded',
          latency: '-',
          lastRun: '-',
          platform: agent.os,
          color: agent.status === 'online' ? 'emerald' : 'amber',
          technique: 'Forensic Collection',
          avStatus: 'Unknown',
          avPresent: 'Unknown',
          lastScript: '',
          evasionStatus: 'Monitoring',
        }))

        setEndpoints(mappedEndpoints)
      } catch (error) {
        console.error('Failed to load agents:', error)
      }
    }

    fetchAgents()
  }, [])

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

  const handleRun = useCallback(async () => {
  setRunning(true)

  try {
    if (endpoints.length === 0) {
      console.warn('No registered agents available')
      return
    }

    const agent = endpoints[0]

    const response = await fetch('http://127.0.0.1:8000/jobs/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agent.agentId,
        script_id: 'test-script',
        exec_mode: 'user_mode',
      }),
    })

    if (!response.ok) {
      throw new Error(`Job creation failed: HTTP ${response.status}`)
    }

    const data = await response.json()

    console.log('Job created:', data)
  } catch (error) {
    console.error('Failed to create job:', error)
  } finally {
    setRunning(false)
  }
}, [endpoints])

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
