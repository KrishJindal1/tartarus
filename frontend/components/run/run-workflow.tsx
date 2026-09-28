'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  FileCode2,
  FileText,
  FolderKanban,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Server,
} from 'lucide-react'
import { useToast } from '@/components/ui'
import { AgentStatusBadge, JobStatusBadge, RiskBadge } from '@/components/dashboard/status-badge'
import { durationBetween, formatBytes, useDashboard } from '@/providers/dashboard-provider'
import { api, BackendEvidenceRow, BackendJobDetail, BackendResultRow } from '@/lib/api'
import type { AgentView, JobStatus, ScriptView } from '@/types'

const STEP_LABELS = ['Endpoint', 'Script', 'Review', 'Response'] as const

const cardBase =
  'rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E]'
const inputBase =
  'flex items-center gap-2 rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] px-2.5 py-1.5'
const primaryBtn =
  'inline-flex items-center gap-1.5 rounded-md bg-[#0F766E] dark:bg-[#0E8C7F] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0B5C53] dark:hover:bg-[#12A594] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
const ghostBtn =
  'inline-flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] px-3 py-2 text-xs font-bold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#1B1F26] transition-colors cursor-pointer'
const mintBtn =
  'inline-flex items-center gap-1.5 rounded-md border border-[#0E8C7F]/40 dark:border-[#4ADE9E]/40 bg-[#DDF7EC] dark:bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-[#0F766E] dark:text-[#4ADE9E] hover:bg-[#C6F0DE] dark:hover:bg-emerald-500/25 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'

interface RunWorkflowProps {
  initialAgentId?: string
  initialScriptId?: string
}

function Stepper({ step, maxReached }: { step: number; maxReached: number }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const done = n < step && n <= maxReached
        const current = n === step
        const clickable = n <= maxReached && n < 4 && !current
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <div
                className={`h-px w-4 sm:w-8 ${
                  n <= step ? 'bg-[#0F766E] dark:bg-[#2DD4BF]' : 'bg-[#d0d7de] dark:bg-[#24282F]'
                }`}
              />
            )}
            <div
              className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-bold whitespace-nowrap ${
                current
                  ? 'border-[#12A594] dark:border-[#2DD4BF] bg-[#D9F5F2] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#2DD4BF]'
                  : done
                  ? 'border-[#0E8C7F]/40 dark:border-[#4ADE9E]/40 bg-[#DDF7EC] dark:bg-emerald-500/15 text-[#0F766E] dark:text-[#4ADE9E]'
                  : 'border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] text-[#656d76] dark:text-[#8b949e]'
              } ${clickable ? 'cursor-pointer' : ''}`}
              onClick={
                clickable
                  ? () => window.dispatchEvent(new CustomEvent('jocky-run-goto', { detail: n }))
                  : undefined
              }
            >
              <span className="flex size-4 items-center justify-center rounded-full text-[10px] tabular-nums">
                {done ? <Check className="size-3" /> : n}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

export function RunWorkflow({ initialAgentId, initialScriptId }: RunWorkflowProps) {
  const { agents, scripts, loaded, refresh } = useDashboard()
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [maxReached, setMaxReached] = useState(1)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [scriptId, setScriptId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [executing, setExecuting] = useState(false)
  const [execError, setExecError] = useState<string | null>(null)

  const [jobId, setJobId] = useState<string | null>(null)
  const [job, setJob] = useState<BackendJobDetail | null>(null)
  const [results, setResults] = useState<BackendResultRow[]>([])
  const [evidenceRows, setEvidenceRows] = useState<BackendEvidenceRow[]>([])
  const [pollError, setPollError] = useState<string | null>(null)

  // apply ?agent= / ?script= preselection once data is loaded
  useEffect(() => {
    if (!loaded) return
    if (initialAgentId && agents.some((a) => a.agentId === initialAgentId)) {
      setAgentId(initialAgentId)
      setStep((s) => Math.max(s, 2))
      setMaxReached((m) => Math.max(m, 2))
    }
    if (initialScriptId && scripts.some((s) => s.id === initialScriptId)) {
      setScriptId(initialScriptId)
      if (initialAgentId && agents.some((a) => a.agentId === initialAgentId)) {
        setStep(3)
        setMaxReached(3)
      }
    }
  }, [loaded, agents, scripts, initialAgentId, initialScriptId])

  // stepper click navigation
  useEffect(() => {
    const handler = (e: Event) => {
      const n = (e as CustomEvent<number>).detail
      setStep(n)
    }
    window.addEventListener('jocky-run-goto', handler)
    return () => window.removeEventListener('jocky-run-goto', handler)
  }, [])

  const agent: AgentView | undefined = agents.find((a) => a.agentId === agentId)
  const script: ScriptView | undefined = scripts.find((s) => s.id === scriptId)

  const filteredScripts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return scripts
    return scripts.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.riskLevel.toLowerCase().includes(q) ||
        s.osTarget.toLowerCase().includes(q)
    )
  }, [scripts, query])

  const goto = (n: number) => {
    setStep(n)
    setMaxReached((m) => Math.max(m, n))
  }

  const handleExecute = async () => {
    if (!agent || !script) return
    setExecuting(true)
    setExecError(null)
    try {
      const res = await api.createJob({
        agent_id: agent.agentId,
        script_id: script.id,
        exec_mode: 'user_mode',
      })
      const id = res.job?.id
      if (!id) throw new Error(res.message || 'No job id returned')
      setJobId(id)
      setJob(null)
      setResults([])
      setEvidenceRows([])
      setPollError(null)
      goto(4)
      await refresh()
    } catch (err) {
      setExecError(err instanceof Error ? err.message : String(err))
    } finally {
      setExecuting(false)
    }
  }

  // poll the job until it reaches a terminal state, then pull the response
  useEffect(() => {
    if (!jobId) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const tick = async () => {
      try {
        const detail = await api.getJob(jobId)
        if (cancelled) return
        setJob(detail)
        setPollError(null)
        const st = detail.status
        if (st === 'completed' || st === 'failed') {
          const [resRows, evRows] = await Promise.all([
            api.listResults(jobId).catch(() => [] as BackendResultRow[]),
            api.evidenceByJob(jobId).catch(() => []),
          ])
          if (cancelled) return
          setResults(resRows)
          setEvidenceRows(evRows)
          refresh()
          return
        }
      } catch (err) {
        if (!cancelled) setPollError(err instanceof Error ? err.message : String(err))
      }
      if (!cancelled) timer = setTimeout(tick, 2000)
    }
    tick()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [jobId, refresh])

  const reset = () => {
    setJobId(null)
    setJob(null)
    setResults([])
    setEvidenceRows([])
    setExecError(null)
    setPollError(null)
    setAgentId(null)
    setScriptId(null)
    setQuery('')
    setMaxReached(1)
    setStep(1)
  }

  const terminal = job?.status === 'completed' || job?.status === 'failed'
  const firstResult = results[0]

  return (
    <div className="flex flex-col gap-5">
      {/* Page head + stepper */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#1f2328] dark:text-[#f0f6fc]">Run a script</h1>
          <p className="text-xs text-[#656d76] dark:text-[#8b949e]">
            Pick an endpoint, pick a JOCKY script, execute it in memory and inspect the
            response.
          </p>
        </div>
        <Stepper step={step} maxReached={maxReached} />
      </div>

      {/* ---------------- step 1: endpoint ---------------- */}
      {step === 1 && (
        <section className="flex flex-col gap-3">
          <div className={cardBase}>
            <div className="border-b border-[#d0d7de] dark:border-[#24282F] px-4 py-3 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                1 — Choose an endpoint
              </span>
              <span className="text-[11px] text-[#8b949e]">
                {loaded ? `${agents.length} registered` : 'Loading…'}
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!loaded &&
                [0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-lg border border-[#d0d7de] dark:border-[#24282F] animate-pulse bg-[#f6f8fa] dark:bg-[#0C0E11]"
                  />
                ))}
              {loaded && agents.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-[#8b949e]">
                  <Server className="size-5 mx-auto mb-2 opacity-50" />
                  No endpoints registered yet — use “Register endpoint” on the Agents page.
                </div>
              )}
              {agents.map((a) => {
                const selected = a.agentId === agentId
                return (
                  <button
                    key={a.agentId}
                    type="button"
                    onClick={() => setAgentId(a.agentId)}
                    className={`flex items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#12A594] dark:border-[#2DD4BF] bg-[#D9F5F2] dark:bg-teal-500/10'
                        : 'border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] hover:border-[#2DD4BF]/50 dark:hover:border-[#2DD4BF]/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] truncate">
                        {a.hostname}
                      </div>
                      <div className="mt-0.5 text-[11px] capitalize text-[#656d76] dark:text-[#8b949e]">
                        {a.os} · {a.architecture}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-[#8b949e] truncate">
                        {a.agentId.slice(0, 13)}…
                      </div>
                    </div>
                    <AgentStatusBadge status={a.status} />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!agent}
              onClick={() => goto(2)}
              className={primaryBtn}
            >
              Continue <ArrowRight className="size-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* ---------------- step 2: script ---------------- */}
      {step === 2 && (
        <section className="flex flex-col gap-3">
          <div className={cardBase}>
            <div className="border-b border-[#d0d7de] dark:border-[#24282F] p-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                2 — Choose a script
                {agent && (
                  <span className="ml-2 normal-case tracking-normal font-semibold text-[#0F766E] dark:text-[#2DD4BF]">
                    for {agent.hostname}
                  </span>
                )}
              </span>
              <div className={`${inputBase} w-full sm:w-72`}>
                <Search className="size-3.5 text-[#8b949e]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, category, risk, OS…"
                  className="w-full bg-transparent text-xs outline-none placeholder:text-[#8b949e]"
                />
              </div>
            </div>
            <div className="divide-y divide-[#d0d7de]/60 dark:divide-[#24282F] max-h-[440px] overflow-y-auto">
              {filteredScripts.map((s) => {
                const selected = s.id === scriptId
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScriptId(s.id)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#D9F5F2] dark:bg-teal-500/10'
                        : 'hover:bg-[#f6f8fa] dark:hover:bg-[#0C0E11]'
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <FileCode2
                        className={`mt-0.5 size-4 shrink-0 ${
                          selected
                            ? 'text-[#0F766E] dark:text-[#2DD4BF]'
                            : 'text-[#8b949e]'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                            {s.name}
                          </span>
                          {s.isPredefined && (
                            <span className="rounded border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#1B1F26] px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#8b949e]">
                              builtin
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-[#8b949e] max-w-[520px]">
                          {s.description}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#656d76] dark:text-[#8b949e]">
                          <span className="capitalize">{s.category}</span>
                          <span className="opacity-40">·</span>
                          <span className="capitalize">risk {s.riskLevel}</span>
                          <span className="opacity-40">·</span>
                          <span className="capitalize">{s.osTarget}</span>
                          <span className="opacity-40">·</span>
                          <span className="font-mono">v{s.version}</span>
                        </div>
                      </div>
                    </div>
                    <RiskBadge
                      score={
                        s.riskLevel === 'critical'
                          ? 9
                          : s.riskLevel === 'high'
                          ? 7
                          : s.riskLevel === 'medium'
                          ? 5
                          : 2
                      }
                    />
                  </button>
                )
              })}
              {loaded && filteredScripts.length === 0 && (
                <div className="px-4 py-10 text-center text-xs text-[#8b949e]">
                  No scripts match the search.
                </div>
              )}
              {!loaded && (
                <div className="px-4 py-10 text-center text-xs text-[#8b949e]">
                  <Loader2 className="size-4 mx-auto animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => goto(1)} className={ghostBtn}>
              <ArrowLeft className="size-3.5" /> Back
            </button>
            <button
              type="button"
              disabled={!script}
              onClick={() => goto(3)}
              className={primaryBtn}
            >
              Review <ArrowRight className="size-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* ---------------- step 3: review & execute ---------------- */}
      {step === 3 && agent && script && (
        <section className="flex flex-col gap-3">
          <div className={cardBase}>
            <div className="border-b border-[#d0d7de] dark:border-[#24282F] px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                3 — Review and execute
              </span>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
              {[
                {
                  k: 'Endpoint',
                  v: `${agent.hostname} (${agent.os}/${agent.architecture})`,
                  sub: agent.status === 'online' ? 'online' : `status: ${agent.status}`,
                  warn: agent.status !== 'online',
                },
                {
                  k: 'Script',
                  v: script.name,
                  sub: `${script.category} · risk ${script.riskLevel} · v${script.version}`,
                  warn: false,
                },
                {
                  k: 'Execution mode',
                  v: 'user_mode',
                  sub: 'in-memory IR, user-level process',
                  warn: false,
                },
                {
                  k: 'IR fingerprint',
                  v: script.irSha256 ? `${script.irSha256.slice(0, 16)}…` : 'polymorphic (re-generated at dispatch)',
                  sub: script.irSha256 ? 'stored build' : 'compile-on-create',
                  warn: false,
                },
              ].map((row) => (
                <div
                  key={row.k}
                  className="flex items-start justify-between gap-4 border-b border-[#d0d7de]/60 dark:border-[#24282F] py-3 px-4 last:border-b-0"
                >
                  <dt className="text-[11px] font-semibold text-[#656d76] dark:text-[#8b949e]">
                    {row.k}
                  </dt>
                  <dd className="text-right">
                    <div className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                      {row.v}
                    </div>
                    <div
                      className={`text-[10px] ${
                        row.warn
                          ? 'text-[#96690F] dark:text-[#E3B341] font-semibold'
                          : 'text-[#8b949e]'
                      }`}
                    >
                      {row.sub}
                    </div>
                  </dd>
                </div>
              ))}
            </dl>
            {execError && (
              <div className="m-4 flex items-start gap-2 rounded-md border border-[#E5654E]/40 dark:border-[#FF8A7A]/40 bg-[#FDE8E4] dark:bg-rose-500/15 px-3 py-2 text-xs text-[#D64936] dark:text-[#FF8A7A]">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span className="font-mono break-all">{execError}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => goto(2)} className={ghostBtn} disabled={executing}>
              <ArrowLeft className="size-3.5" /> Back
            </button>
            <button type="button" onClick={handleExecute} disabled={executing} className={mintBtn}>
              {executing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
              {executing ? 'Dispatching…' : 'Execute script'}
            </button>
          </div>
        </section>
      )}

      {/* ---------------- step 4: response ---------------- */}
      {step === 4 && jobId && (
        <section className="flex flex-col gap-3">
          {/* status card */}
          <div className={cardBase}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d0d7de] dark:border-[#24282F] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                  4 — Response
                </span>
                {job && <JobStatusBadge status={job.status as JobStatus} />}
                <span className="text-[11px] text-[#8b949e]">
                  {script?.name ?? 'script'} → {agent?.hostname ?? 'endpoint'}
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#8b949e]">{jobId.slice(0, 12)}…</span>
            </div>

            {!terminal && (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Loader2 className="size-5 animate-spin text-[#0F766E] dark:text-[#2DD4BF]" />
                <div className="text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                  {job?.status === 'completed'
                    ? 'Collecting response…'
                    : job
                    ? `Endpoint is ${job.status}…`
                    : 'Waiting for the endpoint to claim the job…'}
                </div>
                <div className="text-[11px] text-[#8b949e]">
                  In-memory execution usually finishes within seconds · polling every 2s
                  {pollError && (
                    <span className="text-[#D64936] dark:text-[#FF8A7A]"> · {pollError}</span>
                  )}
                </div>
              </div>
            )}

            {terminal && job && (
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#d0d7de]/60 dark:divide-[#24282F] border-b border-[#d0d7de]/60 dark:border-[#24282F]">
                <div className="px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                    Verdict
                  </div>
                  <div
                    className={`mt-1 text-sm font-bold capitalize ${
                      job.status === 'completed'
                        ? 'text-[#0F766E] dark:text-[#4ADE9E]'
                        : 'text-[#D64936] dark:text-[#FF8A7A]'
                    }`}
                  >
                    {job.status}
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                    Risk score
                  </div>
                  <div className="mt-1">
                    <RiskBadge score={job.risk_score ?? null} />
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                    Evidence
                  </div>
                  <div className="mt-1 text-sm font-bold tabular-nums text-[#1f2328] dark:text-[#f0f6fc]">
                    {evidenceRows.length}
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                    Duration
                  </div>
                  <div className="mt-1 text-sm font-bold tabular-nums text-[#1f2328] dark:text-[#f0f6fc]">
                    {durationBetween(job.dispatched_at ?? job.created_at, job.completed_at)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* findings + results */}
          {terminal && job && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div className={cardBase}>
                <div className="border-b border-[#d0d7de] dark:border-[#24282F] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                  Findings
                </div>
                <div className="px-4 py-3 text-xs text-[#1f2328] dark:text-[#e6edf3] leading-relaxed">
                  {job.findings_summary || 'No findings recorded by the endpoint.'}
                </div>
                <div className="border-t border-[#d0d7de]/60 dark:border-[#24282F] px-4 py-2.5 flex flex-wrap gap-2">
                  <Link href={`/jobs/${job.id}`} className={ghostBtn}>
                    <FileText className="size-3.5" /> Job detail
                  </Link>
                  <Link href={`/reports/${job.id}`} className={ghostBtn}>
                    <FileText className="size-3.5" /> Report
                  </Link>
                  <Link href="/evidence" className={ghostBtn}>
                    <FolderKanban className="size-3.5" /> Evidence
                  </Link>
                </div>
              </div>

              <div className={cardBase}>
                <div className="border-b border-[#d0d7de] dark:border-[#24282F] px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                    Raw response
                  </span>
                  <span className="font-mono text-[10px] text-[#8b949e]">
                    {results.length} result row(s)
                  </span>
                </div>
                {firstResult ? (
                  <div className="p-3">
                    <div className="mb-2 flex items-center gap-2 text-[11px]">
                      <span
                        className={`font-bold capitalize ${
                          firstResult.status === 'success'
                            ? 'text-[#0F766E] dark:text-[#4ADE9E]'
                            : 'text-[#D64936] dark:text-[#FF8A7A]'
                        }`}
                      >
                        {firstResult.status}
                      </span>
                      <span className="text-[#8b949e] truncate">{firstResult.message}</span>
                    </div>
                    <pre className="max-h-64 overflow-auto rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] p-3 font-mono text-[11px] leading-relaxed text-[#1f2328] dark:text-[#e6edf3] whitespace-pre-wrap break-all">
                      {formatResult(firstResult)}
                    </pre>
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-xs text-[#8b949e]">
                    No result rows returned for this job.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* evidence */}
          {terminal && evidenceRows.length > 0 && (
            <div className={cardBase}>
              <div className="border-b border-[#d0d7de] dark:border-[#24282F] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                Evidence captured ({evidenceRows.length})
              </div>
              <ul className="divide-y divide-[#d0d7de]/60 dark:divide-[#24282F]">
                {evidenceRows.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="rounded border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#1B1F26] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#656d76] dark:text-[#8b949e]">
                        {e.type}
                      </span>
                      <span className="font-mono text-[10px] text-[#8b949e] truncate">
                        {e.sha256 ? `${e.sha256.slice(0, 16)}…` : '—'}
                      </span>
                      <span className="text-[10px] text-[#8b949e]">
                        {formatBytes(JSON.stringify(e.data ?? {}).length)}
                      </span>
                    </div>
                    <RiskBadge score={e.risk_score ?? null} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={reset} className={ghostBtn}>
              <RefreshCw className="size-3.5" /> New run
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setJobId(null)
                  setJob(null)
                  setResults([])
                  setEvidenceRows([])
                  goto(2)
                }}
                className={ghostBtn}
              >
                Run another script
              </button>
              <Link href={`/jobs/${jobId}`} className={primaryBtn}>
                Open job detail <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function formatResult(row: BackendResultRow): string {
  if (!row.raw) return row.message || '(empty)'
  try {
    return JSON.stringify(JSON.parse(row.raw), null, 2)
  } catch {
    return row.raw
  }
}

export function RunWorkflowContainer() {
  const params = useSearchParams()
  return (
    <RunWorkflow
      initialAgentId={params.get('agent') ?? undefined}
      initialScriptId={params.get('script') ?? undefined}
    />
  )
}
