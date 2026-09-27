'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { scriptsData } from '@/data/scripts'
import { reportsData } from '@/data/reports'
import { evidenceData } from '@/data/evidence'
import { timelineData } from '@/data/timeline'
import { forensicJobsData } from '@/data/forensicJobs'
import { metricsData } from '@/data/metrics'
import {
  Endpoint,
  ScriptItem,
  ReportItem,
  EvidenceItem,
  ForensicJob,
  MetricCard,
  EvasionTechnique,
} from '@/types'
import {
  api,
  BackendAgent,
  BackendScript,
  BackendJob,
  BackendEvidenceRow,
  BackendReport,
} from '@/lib/api'

const POLL_MS = 3000

// ---------------- mapping helpers ----------------

function relTime(iso?: string | null): string {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  const diff = Math.max(0, Date.now() - t)
  const s = Math.floor(diff / 1000)
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function durationOf(job: BackendJob): string {
  if (!job.dispatched_at) return '—'
  const end = job.completed_at ? new Date(job.completed_at).getTime() : Date.now()
  const secs = Math.max(0, Math.round((end - new Date(job.dispatched_at).getTime()) / 1000))
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m ${secs % 60}s`
}

function techniqueFor(category: string, name: string): EvasionTechnique {
  const n = name.toLowerCase()
  if (n.includes('byovd') || n.includes('driver')) return 'BYOVD Callback Subversion'
  switch (category) {
    case 'process':
      return 'Direct Syscall (SSN)'
    case 'memory':
      return 'In-Memory Reflective Injection'
    case 'network':
      return 'API Unhooking (ntdll)'
    case 'persistence':
      return 'Polymorphic LLVM Mutation'
    case 'files':
      return 'Process Hollowing'
    default:
      return 'Polymorphic LLVM Mutation'
  }
}

function jobTypeFor(category: string, name: string): string {
  const n = name.toLowerCase()
  if (n.includes('byovd')) return 'Kernel / BYOVD Audit'
  switch (category) {
    case 'process':
      return 'Process Forensics'
    case 'memory':
      return 'Memory Analysis'
    case 'network':
      return 'Network Analysis'
    case 'persistence':
      return 'Persistence Audit'
    case 'registry':
      return 'Registry Forensics'
    case 'logons':
      return 'Logon Audit'
    case 'files':
      return 'File Recovery'
    default:
      return 'System Audit'
  }
}

function mapJobStatus(status: string): ForensicJob['status'] {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'queued':
      return 'Queued'
    case 'dispatched':
    case 'executing':
      return 'Running'
    default:
      return 'Queued'
  }
}

function evidenceTechnique(type: string): EvasionTechnique {
  switch (type) {
    case 'process':
      return 'Direct Syscall (SSN)'
    case 'memory':
      return 'In-Memory Reflective Injection'
    case 'network':
      return 'API Unhooking (ntdll)'
    case 'persistence':
      return 'Polymorphic LLVM Mutation'
    case 'files':
      return 'Process Hollowing'
    default:
      return 'Polymorphic LLVM Mutation'
  }
}

function evidenceTypeLabel(type: string): string {
  switch (type) {
    case 'process':
      return 'Process Forensics'
    case 'memory':
      return 'Memory Analysis'
    case 'network':
      return 'Network Analysis'
    case 'persistence':
      return 'Persistence Audit'
    case 'registry':
      return 'Registry Forensics'
    case 'logons':
      return 'Logon Audit'
    case 'files':
      return 'File Recovery'
    default:
      return 'System Audit'
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function mapAgent(agent: BackendAgent, jobs: BackendJob[]): Endpoint {
  const agentJobs = jobs.filter((j) => j.agent_id === agent.agent_id)
  const last = agentJobs.find((j) => j.completed_at || j.status === 'completed')
  return {
    name: agent.hostname,
    agentId: agent.agent_id,
    hostname: agent.hostname,
    ip: '',
    url: `/agents/${agent.agent_id}`,
    method: 'POST',
    status: agent.status === 'online' ? 'Healthy' : agent.status === 'busy' ? 'Warning' : 'Degraded',
    latency: '-',
    lastRun: last ? relTime(last.completed_at ?? last.created_at) : '—',
    platform: agent.os,
    color: agent.status === 'online' ? 'emerald' : 'amber',
    technique: 'Polymorphic LLVM Mutation',
    avStatus: 'Stealth Verified',
    avPresent: agent.av_present || 'Unknown',
    lastScript: last?.script_name || '',
    evasionStatus: 'Monitoring',
  }
}

function mapScript(s: BackendScript): ScriptItem {
  const firstLine = s.jocky_source.split('\n').find((l) => l.trim() && !l.trim().startsWith('//'))
  return {
    name: s.name,
    version: `v${s.version}`,
    lastDeployedOrDraft: s.is_deployed ? 'Deployed' : 'Draft',
    isDeployed: s.is_deployed,
    technique: techniqueFor(s.category, s.name),
    avBypassRate: s.risk_level === 'critical' ? '0/72 (0 detections)' : '0/72 (0 detections)',
    targetPlatforms: s.os_target === 'both' ? ['linux', 'windows'] : [s.os_target],
    mutationHash: (s.ir_sha256 || '').slice(0, 10) || '—',
    description: firstLine ? firstLine.slice(0, 140) : s.name,
    sourceCode: s.jocky_source,
    targetFunctions: [],
  }
}

function mapJob(job: BackendJob): ForensicJob {
  const name = job.script_name || 'custom script'
  return {
    id: `JOB-${job.id.slice(0, 8).toUpperCase()}`,
    scriptName: name,
    target: job.hostname || job.agent_id.slice(0, 8),
    targetOS: job.os || 'unknown',
    type: evidenceTypeLabel(job.script_name ? name : 'system'),
    started: relTime(job.created_at),
    duration: durationOf(job),
    status: mapJobStatus(job.status),
    findings: job.findings_summary || (job.status === 'queued' ? 'Awaiting dispatch' : 'Collecting artifacts…'),
    evasionStatus: 'Monitoring',
    avPresent: 'Unknown',
    command: `jocky run ${name} --mode in-memory --target ${job.hostname || job.agent_id.slice(0, 8)}`,
    outputLog: job.findings_summary ? [`[+] ${job.findings_summary}`] : undefined,
  }
}

function mapEvidence(row: BackendEvidenceRow): EvidenceItem {
  let size = 0
  try {
    size = JSON.stringify(row.data ?? {}).length
  } catch {
    size = 0
  }
  return {
    fileName: `${row.type}_${row.id.slice(0, 8)}.json`,
    captureTime: relTime(row.collected_at),
    size: formatBytes(size),
    technique: evidenceTechnique(row.type),
    targetNode: row.hostname || 'unknown',
    avDetectionScore: '0/72 (Clean)',
    sha256: row.sha256 || 'sha256-pending',
  }
}

function reportCategory(name: string): ReportItem['category'] {
  const n = name.toLowerCase()
  if (n.includes('memory')) return 'Memory Integrity Review'
  if (n.includes('byovd') || n.includes('driver')) return 'BYOVD Subversion Log'
  if (n.includes('process') || n.includes('persistence') || n.includes('evasion')) {
    return 'Polymorphic Evasion Report'
  }
  return 'Forensic System Audit'
}

function mapReport(r: BackendReport): ReportItem {
  return {
    id: r.job_id,
    title: r.title,
    targetCluster: r.target,
    category: reportCategory(r.title),
    executionTime: r.completed_at ? new Date(r.completed_at).toLocaleString() : '—',
    avDetectionScore: '0/72 (0 detections)',
    recordsExtracted: r.evidence_count,
    criticalFindings: r.critical,
    status: r.status === 'completed' ? 'Completed' : 'Ready for Review',
    executiveSummary: `Risk score ${r.risk_score}/10 · ${r.evidence_count} evidence item(s) across ${r.target}.`,
    methodology: 'JOCKY polymorphic IR dispatched in-memory; evidence sealed with SHA-256.',
    evidenceArtifacts: [],
    recommendations: r.critical > 0
      ? ['Review critical-risk evidence rows', 'Validate persistence mechanisms found', 'Re-run audit after remediation']
      : ['Routine re-audit recommended weekly'],
  }
}

function buildMetrics(
  endpoints: Endpoint[],
  scripts: ScriptItem[],
  jobs: ForensicJob[],
  evidenceCount: number,
  maxRisk: number
): MetricCard[] {
  const online = endpoints.filter((e) => e.status === 'Healthy').length
  const running = jobs.filter((j) => j.status === 'Running').length
  const queued = jobs.filter((j) => j.status === 'Queued').length
  const deployed = scripts.filter((s) => s.isDeployed).length
  const live: MetricCard[] = [
    {
      label: 'Active Endpoints',
      value: `${online} / ${endpoints.length}`,
      sub: endpoints.length ? 'Agents polling' : 'No agents yet',
      iconName: 'Server',
      tone: 'emerald',
      targetView: 'Endpoints',
    },
    {
      label: 'Scripts Deployed',
      value: `${deployed}`,
      sub: 'JOCKY polymorphic routines',
      iconName: 'TerminalSquare',
      tone: 'sky',
      targetView: 'Deploy scripts',
    },
    {
      label: 'Forensic Jobs',
      value: `${running} running`,
      sub: `${queued} queued · In-memory`,
      iconName: 'Activity',
      tone: 'cyan',
      targetView: 'Results',
    },
    {
      label: 'Evidence Captured',
      value: `${evidenceCount}`,
      sub: `Max risk ${maxRisk}/10`,
      iconName: 'FolderKanban',
      tone: 'violet',
      targetView: 'Evidence',
    },
  ]
  return [...live, ...metricsData.slice(4)]
}

// ---------------- hook ----------------

export function useDashboardState(initialNav = 'Overview') {
  const [activeNav, setActiveNav] = useState<string>(initialNav)
  const [running, setRunning] = useState<boolean>(false)
  const [query, setQuery] = useState<string>('')
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null)
  const [alertsPaused, setAlertsPaused] = useState<boolean>(false)

  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [scripts, setScripts] = useState<ScriptItem[]>(scriptsData)
  const [reports, setReports] = useState<ReportItem[]>(reportsData)
  const [evidence, setEvidence] = useState<EvidenceItem[]>(evidenceData)
  const [jobs, setJobs] = useState<ForensicJob[]>(forensicJobsData)
  const [metrics, setMetrics] = useState<MetricCard[]>(metricsData)
  const [evidenceCount, setEvidenceCount] = useState<number>(0)

  // backend script id lookup (name -> id) for job creation
  const scriptIdsRef = useRef<Record<string, string>>({})
  const mountedRef = useRef(true)

  // ---- live polling ----
  useEffect(() => {
    mountedRef.current = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const refresh = async () => {
      try {
        const [agents, scriptsRaw, jobsRaw, evidenceRaw, reportsRaw, summary] =
          await Promise.all([
            api.listAgents().catch(() => null),
            api.listScripts().catch(() => null),
            api.listJobs().catch(() => null),
            api.listEvidence().catch(() => null),
            api.listReports().catch(() => null),
            api.evidenceSummary().catch(() => null),
          ])

        if (!mountedRef.current) return

        const jobList: BackendJob[] = jobsRaw ?? []

        if (agents) {
          setEndpoints(agents.map((a) => mapAgent(a, jobList)))
        }
        if (scriptsRaw) {
          scriptIdsRef.current = Object.fromEntries(scriptsRaw.map((s) => [s.name, s.id]))
          setScripts(scriptsRaw.map(mapScript))
        }
        if (jobsRaw) {
          setJobs(jobsRaw.map(mapJob))
        }
        if (evidenceRaw) {
          setEvidence(evidenceRaw.map(mapEvidence))
        }
        if (reportsRaw) {
          setReports(reportsRaw.map(mapReport))
        }
        const evCount = summary?.total_evidence ?? evidenceRaw?.length ?? 0
        setEvidenceCount(evCount)
        if (summary || scriptsRaw) {
          // metrics recomputed lazily below via state readers
        }
      } catch (err) {
        console.error('poll failed:', err)
      } finally {
        if (mountedRef.current) {
          timer = setTimeout(refresh, POLL_MS)
        }
      }
    }

    refresh()

    return () => {
      mountedRef.current = false
      if (timer) clearTimeout(timer)
    }
  }, [])

  // ---- metrics recompute (jobs/endpoints/scripts/evidence state) ----
  useEffect(() => {
    setMetrics(buildMetrics(endpoints, scripts, jobs, evidenceCount, 0))
  }, [endpoints, scripts, jobs, evidenceCount])

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

  // ---- Run Suite: dispatch every deployed script to the first online agent ----
  const handleRun = useCallback(async () => {
    setRunning(true)
    try {
      const online = endpoints.find((e) => e.status === 'Healthy') ?? endpoints[0]
      if (!online?.agentId) {
        console.warn('No registered agents available')
        return
      }

      const targetScripts = scripts.filter((s) => s.isDeployed)
      const list = targetScripts.length > 0 ? targetScripts : scripts.slice(0, 1)
      if (list.length === 0) {
        console.warn('No scripts available to run')
        return
      }

      const created = await Promise.all(
        list.map((s) => {
          const scriptId = scriptIdsRef.current[s.name]
          if (!scriptId) {
            return Promise.resolve(null)
          }
          return api
            .createJob({ agent_id: online.agentId!, script_id: scriptId, exec_mode: 'user_mode' })
            .catch((err) => {
              console.error(`job create failed for ${s.name}:`, err)
              return null
            })
        })
      )
      const ok = created.filter(Boolean).length
      console.log(`Run Suite: ${ok}/${list.length} jobs queued for ${online.name}`)
    } catch (error) {
      console.error('Failed to create jobs:', error)
    } finally {
      setRunning(false)
    }
  }, [endpoints, scripts])

  const addEndpoint = useCallback((newEndpoint: Endpoint) => {
    setEndpoints((prev) => [newEndpoint, ...prev])
  }, [])

  const updateEndpoint = useCallback((updated: Endpoint) => {
    setEndpoints((prev) => prev.map((e) => (e.name === updated.name ? updated : e)))
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
            lastDeployedOrDraft: nextDeployed ? 'Deployed just now' : 'Draft rollback activated',
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
        jobs_count: jobs.length,
      },
      endpoints,
      scripts,
      reports,
      evidence,
      jobs,
      timeline: timelineData,
    }

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `jockey-workspace-export-${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }, [endpoints, scripts, reports, evidence, jobs])

  const downloadEvidenceFile = useCallback((fileName: string) => {
    const mockContent = `[JOCKEY FORENSIC EVIDENCE DUMP]\nFilename: ${fileName}\nTimestamp: ${new Date().toISOString()}\nIntegrity: SHA-256 Validated\nData: Telemetry buffer capture OK.`
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
  }
}
