'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  api,
  BackendAgent,
  BackendEvidenceRow,
  BackendJob,
  BackendReport,
  BackendScript,
  EvidenceSummary,
} from '@/lib/api'
import type {
  AgentView,
  EvidenceView,
  JobView,
  MetricCard,
  ReportView,
  ScriptView,
} from '@/types'

const POLL_MS = 3000

// ---------------- shared formatters ----------------

export function relTime(iso?: string | null): string {
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

export function durationBetween(
  start?: string | null,
  end?: string | null
): string {
  if (!start) return '—'
  const from = new Date(start).getTime()
  if (Number.isNaN(from)) return '—'
  const to = end ? new Date(end).getTime() : Date.now()
  const secs = Math.max(0, Math.round((to - from) / 1000))
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m ${secs % 60}s`
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

// ---------------- mappers (honest — no fabricated fields) ----------------

function mapAgent(a: BackendAgent, jobs: BackendJob[]): AgentView {
  const agentJobs = jobs.filter((j) => j.agent_id === a.agent_id)
  return {
    agentId: a.agent_id,
    hostname: a.hostname,
    os: a.os,
    architecture: a.architecture,
    status: a.status,
    avPresent: a.av_present ?? null,
    agentVersion: a.agent_version ?? null,
    lastSeenAt: a.last_seen_at ?? null,
    registeredAt: a.registered_at ?? null,
    jobCount: agentJobs.length,
    runningJobs: agentJobs.filter(
      (j) => j.status === 'dispatched' || j.status === 'executing' || j.status === 'queued'
    ).length,
  }
}

function mapScript(s: BackendScript): ScriptView {
  const firstLine = s.jocky_source
    .split('\n')
    .find((l) => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('//'))
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    riskLevel: s.risk_level,
    osTarget: s.os_target,
    isPredefined: s.is_predefined,
    isDeployed: s.is_deployed,
    version: s.version,
    irSha256: s.ir_sha256 ?? null,
    source: s.jocky_source,
    description: firstLine ? firstLine.replace(/^fn\s+\w+\(\)\s*\{?/, '').trim() || firstLine.slice(0, 120) : s.name,
    createdAt: s.created_at ?? null,
  }
}

function mapJob(j: BackendJob): JobView {
  const status = (['queued', 'dispatched', 'executing', 'completed', 'failed'] as const).includes(
    j.status as JobView['status']
  )
    ? (j.status as JobView['status'])
    : 'queued'
  return {
    id: j.id,
    shortId: j.id.slice(0, 8).toUpperCase(),
    scriptId: j.script_id,
    scriptName: j.script_name || 'unknown script',
    agentId: j.agent_id,
    hostname: j.hostname || j.agent_id.slice(0, 8),
    os: j.os || 'unknown',
    status,
    execMode: j.exec_mode,
    irSha256: j.ir_sha256 ?? null,
    findingsSummary: j.findings_summary ?? null,
    riskScore: j.risk_score ?? null,
    createdAt: j.created_at ?? null,
    dispatchedAt: j.dispatched_at ?? null,
    completedAt: j.completed_at ?? null,
    started: relTime(j.created_at),
    duration: durationBetween(j.dispatched_at ?? j.created_at, j.completed_at),
  }
}

function mapEvidence(row: BackendEvidenceRow): EvidenceView {
  let size = 0
  try {
    size = JSON.stringify(row.data ?? {}).length
  } catch {
    size = 0
  }
  return {
    id: row.id,
    jobId: row.job_id,
    type: row.type,
    sha256: row.sha256 ?? null,
    riskScore: row.risk_score ?? null,
    collectedAt: row.collected_at ?? null,
    hostname: row.hostname ?? null,
    size,
    data: row.data,
  }
}

function mapReport(r: BackendReport): ReportView {
  return {
    jobId: r.job_id,
    title: r.title,
    target: r.target,
    os: r.os,
    status: r.status,
    riskScore: r.risk_score,
    evidenceCount: r.evidence_count,
    critical: r.critical,
    completedAt: r.completed_at ?? null,
  }
}

function buildMetrics(
  agents: AgentView[],
  scripts: ScriptView[],
  jobs: JobView[],
  evidenceCount: number,
  reports: ReportView[],
  maxRisk: number
): MetricCard[] {
  const online = agents.filter((a) => a.status === 'online').length
  const running = jobs.filter((j) => j.status === 'dispatched' || j.status === 'executing').length
  const queued = jobs.filter((j) => j.status === 'queued').length
  const deployed = scripts.filter((s) => s.isDeployed).length
  return [
    {
      label: 'Active Endpoints',
      value: `${online} / ${agents.length}`,
      sub: agents.length ? 'Agents registered' : 'No agents yet',
      iconName: 'Server',
      tone: 'emerald',
      href: '/agents',
    },
    {
      label: 'Scripts Staged',
      value: `${deployed}`,
      sub: `${scripts.length} total · JOCKY DSL`,
      iconName: 'TerminalSquare',
      tone: 'violet',
      href: '/scripts',
    },
    {
      label: 'Forensic Jobs',
      value: `${running} running`,
      sub: `${queued} queued · ${jobs.length} total`,
      iconName: 'Activity',
      tone: 'sky',
      href: '/jobs',
    },
    {
      label: 'Evidence Captured',
      value: `${evidenceCount}`,
      sub: maxRisk ? `Max risk ${maxRisk}/10` : 'No evidence yet',
      iconName: 'FolderKanban',
      tone: 'amber',
      href: '/evidence',
    },
    {
      label: 'Reports Generated',
      value: `${reports.length}`,
      sub: reports.length ? 'JSON + PDF available' : 'Generated on job completion',
      iconName: 'FileText',
      tone: 'slate',
      href: '/reports',
    },
    {
      label: 'Critical Findings',
      value: `${reports.reduce((n, r) => n + r.critical, 0)}`,
      sub: 'Across all reports',
      iconName: 'ShieldAlert',
      tone: 'rose',
      href: '/reports',
    },
  ]
}

// ---------------- context ----------------

interface DashboardContextValue {
  agents: AgentView[]
  scripts: ScriptView[]
  jobs: JobView[]
  evidence: EvidenceView[]
  reports: ReportView[]
  summary: EvidenceSummary | null
  metrics: MetricCard[]
  running: boolean
  loaded: boolean
  lastError: string | null
  counts: { agents: number; scripts: number; jobs: number; evidence: number; reports: number }
  refresh: () => Promise<void>
  runSuite: () => Promise<{ queued: number; total: number; target: string } | null>
  runScript: (
    scriptId: string,
    agentId: string
  ) => Promise<{ ok: boolean; message: string; jobId?: string }>
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<AgentView[]>([])
  const [scripts, setScripts] = useState<ScriptView[]>([])
  const [jobs, setJobs] = useState<JobView[]>([])
  const [evidence, setEvidence] = useState<EvidenceView[]>([])
  const [reports, setReports] = useState<ReportView[]>([])
  const [summary, setSummary] = useState<EvidenceSummary | null>(null)
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [running, setRunning] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const mountedRef = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const [agentsRaw, scriptsRaw, jobsRaw, evidenceRaw, reportsRaw, summaryRaw] =
        await Promise.all([
          api.listAgents().catch(() => null),
          api.listScripts().catch(() => null),
          api.listJobs().catch(() => null),
          api.listEvidence().catch(() => null),
          api.listReports().catch(() => null),
          api.evidenceSummary().catch(() => null),
        ])
      if (!mountedRef.current) return

      const agentViews = agentsRaw ? agentsRaw.map((a) => mapAgent(a, jobsRaw ?? [])) : null
      const jobViews = jobsRaw ? jobsRaw.map(mapJob) : null
      const scriptViews = scriptsRaw ? scriptsRaw.map(mapScript) : null
      const evidenceViews = evidenceRaw ? evidenceRaw.map(mapEvidence) : null
      const reportViews = reportsRaw ? reportsRaw.map(mapReport) : null

      if (agentViews) setAgents(agentViews)
      if (scriptViews) setScripts(scriptViews)
      if (jobViews) setJobs(jobViews)
      if (evidenceViews) setEvidence(evidenceViews)
      if (reportViews) setReports(reportViews)
      if (summaryRaw) setSummary(summaryRaw)
      setLastError(null)
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err))
    } finally {
      if (mountedRef.current) {
        setLoaded(true)
      }
    }
  }, [])

  // poll loop
  useEffect(() => {
    mountedRef.current = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    const loop = async () => {
      await refresh()
      if (!stopped && mountedRef.current) {
        timer = setTimeout(loop, POLL_MS)
      }
    }
    loop()

    return () => {
      stopped = true
      mountedRef.current = false
      if (timer) clearTimeout(timer)
    }
  }, [refresh])

  // metrics recompute
  useEffect(() => {
    const evCount = summary?.total_evidence ?? evidence.length
    const maxRisk = summary?.max_risk ?? 0
    setMetrics(buildMetrics(agents, scripts, jobs, evCount, reports, maxRisk))
  }, [agents, scripts, jobs, evidence, reports, summary])

  const runSuite = useCallback(async () => {
    const target = agents.find((a) => a.status === 'online') ?? agents[0]
    if (!target) return null
    const list = scripts.filter((s) => s.isDeployed)
    if (list.length === 0) return null
    setRunning(true)
    try {
      const created = await Promise.all(
        list.map((s) =>
          api
            .createJob({ agent_id: target.agentId, script_id: s.id, exec_mode: 'user_mode' })
            .then((r) => r.job?.id ?? null)
            .catch(() => null)
        )
      )
      const queued = created.filter(Boolean).length
      await refresh()
      return { queued, total: list.length, target: target.hostname }
    } finally {
      setRunning(false)
    }
  }, [agents, scripts, refresh])

  const runScript = useCallback(
    async (scriptId: string, agentId: string) => {
      try {
        const res = await api.createJob({
          agent_id: agentId,
          script_id: scriptId,
          exec_mode: 'user_mode',
        })
        await refresh()
        return { ok: true, message: res.message, jobId: res.job?.id }
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : String(err) }
      }
    },
    [refresh]
  )

  const counts = useMemo(
    () => ({
      agents: agents.length,
      scripts: scripts.length,
      jobs: jobs.length,
      evidence: summary?.total_evidence ?? evidence.length,
      reports: reports.length,
    }),
    [agents, scripts, jobs, evidence, reports, summary]
  )

  const value = useMemo(
    () => ({
      agents,
      scripts,
      jobs,
      evidence,
      reports,
      summary,
      metrics,
      running,
      loaded,
      lastError,
      counts,
      refresh,
      runSuite,
      runScript,
    }),
    [
      agents,
      scripts,
      jobs,
      evidence,
      reports,
      summary,
      metrics,
      running,
      loaded,
      lastError,
      counts,
      refresh,
      runSuite,
      runScript,
    ]
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}
