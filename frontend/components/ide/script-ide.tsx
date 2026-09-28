'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Play,
  Save,
  Upload,
  FilePlus2,
  Hammer,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { useToast } from '@/components/ui'
import { api, BackendScriptDetail, CompileResult } from '@/lib/api'
import { useDashboard } from '@/providers/dashboard-provider'
import { JockeyEditor } from './jockey-editor'

const CATEGORIES = [
  'process',
  'memory',
  'network',
  'persistence',
  'registry',
  'logons',
  'files',
  'system',
]
const RISKS = ['low', 'medium', 'high', 'critical']
const OS_TARGETS = [
  { value: 'linux', label: 'linux' },
  { value: 'windows', label: 'windows' },
  { value: 'both', label: 'both' },
]

const NEW_TEMPLATE = `# New Tartarus script — see documentation.md for the language reference
fn main() {
  let procs = collect_processes()
  output procs
}
`

type CompileState =
  | { status: 'idle' }
  | { status: 'compiling' }
  | { status: 'ok'; sha: string; size: number; irListing: string; ast: string }
  | { status: 'error'; error: string }

const btn =
  'inline-flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] px-2.5 py-1.5 text-[11px] font-bold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#1B1F26] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
const btnPrimary =
  'inline-flex items-center gap-1.5 rounded-md border border-[#12A594]/50 dark:border-[#2DD4BF]/50 bg-[#0F766E] dark:bg-[#0E8C7F] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#0B5C53] dark:hover:bg-[#12A594] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
const btnRun =
  'inline-flex items-center gap-1.5 rounded-md border border-[#0E8C7F]/40 dark:border-[#4ADE9E]/40 bg-[#DDF7EC] dark:bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-bold text-[#0F766E] dark:text-[#4ADE9E] hover:bg-[#C6F0DE] dark:hover:bg-emerald-500/25 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
const selectCls =
  'rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#0C0E11] px-2 py-1.5 text-[11px] font-semibold text-[#1f2328] dark:text-[#e6edf3] outline-none cursor-pointer'

interface ScriptIdeProps {
  scriptId?: string
}

export function ScriptIde({ scriptId }: ScriptIdeProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { agents, runScript, refresh } = useDashboard()

  const [name, setName] = useState('')
  const [source, setSource] = useState(NEW_TEMPLATE)
  const [category, setCategory] = useState('system')
  const [riskLevel, setRiskLevel] = useState('medium')
  const [osTarget, setOsTarget] = useState('both')
  const [isPredefined, setIsPredefined] = useState(false)
  const [version, setVersion] = useState(1)
  const [currentId, setCurrentId] = useState<string | null>(scriptId ?? null)
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(Boolean(scriptId))
  const [saving, setSaving] = useState(false)
  const [compile, setCompile] = useState<CompileState>({ status: 'idle' })
  const [tab, setTab] = useState<'ir' | 'ast'>('ir')
  const [runAgentId, setRunAgentId] = useState('')
  const [running, setRunning] = useState(false)
  const [lastJobId, setLastJobId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ---- load existing script ----
  useEffect(() => {
    if (!scriptId) return
    let cancelled = false
    setLoading(true)
    api
      .getScript(scriptId)
      .then((s: BackendScriptDetail) => {
        if (cancelled) return
        setCurrentId(s.id)
        setName(s.name)
        setSource(s.jocky_source)
        setCategory(s.category)
        setRiskLevel(s.risk_level)
        setOsTarget(s.os_target)
        setIsPredefined(s.is_predefined)
        setVersion(s.version)
        setDirty(false)
        if (s.ir_listing) {
          setCompile({
            status: 'ok',
            sha: s.ir_sha256 ?? '',
            size: s.ir_bytes?.length ?? 0,
            irListing: s.ir_listing,
            ast: s.ast_structure ?? '',
          })
        }
      })
      .catch((err) => {
        if (!cancelled) toast(err instanceof Error ? err.message : 'Failed to load script', 'error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [scriptId, toast])

  const setSrc = useCallback((next: string) => {
    setSource(next)
    setDirty(true)
  }, [])

  // ---- compile (dry run) ----
  const handleCompile = useCallback(async () => {
    setCompile({ status: 'compiling' })
    try {
      const res: CompileResult = await api.compileScript(source)
      if (res.ok) {
        setCompile({
          status: 'ok',
          sha: res.ir_sha256 ?? '',
          size: res.size ?? 0,
          irListing: res.ir_listing ?? '',
          ast: res.ast_structure ?? '',
        })
        toast('Compile OK — polymorphic IR generated.', 'success')
      } else {
        setCompile({ status: 'error', error: res.error ?? 'Unknown compile error' })
      }
    } catch (err) {
      setCompile({
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }, [source, toast])

  // ---- save ----
  const handleSave = useCallback(async (): Promise<string | null> => {
    if (!name.trim()) {
      toast('Give the script a name before saving.', 'error')
      return null
    }
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        jocky_source: source,
        category,
        risk_level: riskLevel,
        os_target: osTarget,
      }
      if (currentId && !isPredefined) {
        const res = await api.updateScript(currentId, payload)
        setVersion(res.script.version)
        setDirty(false)
        toast(`Saved “${res.script.name}” v${res.script.version}.`, 'success')
        return currentId
      }
      if (isPredefined) {
        payload.name = `${name.trim()} (copy)`
      }
      const res = await api.createScript(payload)
      setCurrentId(res.script.id)
      setIsPredefined(false)
      setVersion(res.script.version)
      setDirty(false)
      await refresh()
      router.replace(`/scripts/${res.script.id}`)
      toast(`Created “${res.script.name}” (v${res.script.version}).`, 'success')
      return res.script.id
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast(msg, 'error')
      if (msg.toLowerCase().includes('compile error')) {
        setCompile({ status: 'error', error: msg })
      }
      return null
    } finally {
      setSaving(false)
    }
  }, [name, source, category, riskLevel, osTarget, currentId, isPredefined, toast, refresh, router])

  const handleDelete = useCallback(async () => {
    if (!currentId || isPredefined) return
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return
    try {
      await api.deleteScript(currentId)
      toast(`Deleted “${name}”.`, 'success')
      await refresh()
      router.push('/scripts')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error')
    }
  }, [currentId, isPredefined, name, toast, refresh, router])

  // ---- open / new ----
  const handleOpenFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        const text = String(reader.result ?? '')
        setSource(text)
        setDirty(true)
        if (!currentId && !name.trim()) {
          setName(file.name.replace(/\.(jky|jocky|txt)$/i, ''))
        }
        setCompile({ status: 'idle' })
        toast(`Loaded ${file.name} — compile and save to stage it.`, 'info')
      }
      reader.readAsText(file)
    },
    [currentId, name, toast]
  )

  const handleNew = useCallback(() => {
    setCurrentId(null)
    setName('')
    setSource(NEW_TEMPLATE)
    setCategory('system')
    setRiskLevel('medium')
    setOsTarget('both')
    setIsPredefined(false)
    setVersion(1)
    setDirty(false)
    setCompile({ status: 'idle' })
    setLastJobId(null)
    router.replace('/scripts/new')
  }, [router])

  // ---- run ----
  const handleRun = useCallback(async () => {
    let id = currentId
    if (dirty || !id) {
      id = await handleSave()
      if (!id) return
    }
    const agent = agents.find((a) => a.agentId === runAgentId) ?? agents.find((a) => a.status === 'online') ?? agents[0]
    if (!agent) {
      toast('No registered agent available.', 'error')
      return
    }
    setRunning(true)
    try {
      const res = await runScript(id, agent.agentId)
      if (res.ok && res.jobId) {
        setLastJobId(res.jobId)
        toast(`Job queued on ${agent.hostname}.`, 'success')
      } else {
        toast(res.message, 'error')
      }
    } finally {
      setRunning(false)
    }
  }, [currentId, dirty, handleSave, runAgentId, agents, runScript, toast])

  // ---- Ctrl+S ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSave])

  const onlineAgents = agents.filter((a) => a.status === 'online')
  const agentOptions = onlineAgents.length > 0 ? onlineAgents : agents

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] py-24 text-xs text-[#656d76] dark:text-[#8b949e]">
        <Loader2 className="size-4 animate-spin" /> Loading script…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setDirty(true)
            }}
            placeholder="script-name"
            disabled={isPredefined}
            className="rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] px-2.5 py-1.5 text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] outline-none focus:border-[#12A594] dark:focus:border-[#2DD4BF] min-w-0 flex-1 disabled:opacity-60"
          />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setDirty(true)
            }}
            className={selectCls}
            title="Category"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={riskLevel}
            onChange={(e) => {
              setRiskLevel(e.target.value)
              setDirty(true)
            }}
            className={selectCls}
            title="Risk level"
          >
            {RISKS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={osTarget}
            onChange={(e) => {
              setOsTarget(e.target.value)
              setDirty(true)
            }}
            className={selectCls}
            title="Target OS"
          >
            {OS_TARGETS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jky,.jocky,.txt,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleOpenFile(f)
              e.target.value = ''
            }}
          />
          <button type="button" className={btn} onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-3" /> Open file
          </button>
          <button type="button" className={btn} onClick={handleNew}>
            <FilePlus2 className="size-3" /> New
          </button>
          <button
            type="button"
            className={btn}
            onClick={handleCompile}
            disabled={compile.status === 'compiling'}
            title="Dry-run compile: IR listing + AST, no save"
          >
            {compile.status === 'compiling' ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Hammer className="size-3" />
            )}
            Compile
          </button>
          <button
            type="button"
            className={btnPrimary}
            onClick={() => void handleSave()}
            disabled={saving}
            title="Ctrl+S"
          >
            {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
            {isPredefined ? 'Save as new' : currentId ? 'Save' : 'Create'}
          </button>
          {currentId && !isPredefined && (
            <button
              type="button"
              className={`${btn} text-[#D64936] dark:text-[#FF8A7A]`}
              onClick={handleDelete}
              title="Delete script"
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-[#8b949e] w-full sm:w-auto">
          {currentId ? (
            <>
              <span>v{version}</span>
              <span>·</span>
              <span className="truncate max-w-[140px]">{currentId.slice(0, 8)}</span>
            </>
          ) : (
            <span>unsaved draft</span>
          )}
          {dirty && (
            <span className="rounded border border-amber-400/40 bg-amber-500/10 px-1.5 py-0.5 font-bold text-[#96690F] dark:text-[#E3B341]">
              unsaved changes
            </span>
          )}
          {isPredefined && (
            <span className="rounded border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#1B1F26] px-1.5 py-0.5 font-bold text-[#8b949e]">
              builtin · read-only (Save as new)
            </span>
          )}
        </div>
      </div>

      {/* Editor + inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-4">
        {/* Editor */}
        <div className="rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#d0d7de] dark:border-[#24282F] px-4 py-2.5 bg-[#f6f8fa] dark:bg-[#0C0E11]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
              Tartarus source
            </span>
            <span className="text-[10px] font-mono text-[#8b949e]">
              {source.split('\n').length} lines
            </span>
          </div>
          <JockeyEditor value={source} onChange={setSrc} minHeight={560} />
        </div>

        {/* Inspector */}
        <div className="flex flex-col gap-4">
          {/* compile status */}
          <div className="rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#d0d7de] dark:border-[#24282F] px-4 py-2.5 bg-[#f6f8fa] dark:bg-[#0C0E11]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                Compiler
              </span>
              {compile.status === 'ok' && (
                <button
                  type="button"
                  className="text-[10px] font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:underline cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(compile.sha)
                    toast('IR SHA-256 copied.', 'info')
                  }}
                >
                  <Copy className="size-3 inline mr-1" />
                  copy sha
                </button>
              )}
            </div>
            <div className="p-3 text-xs">
              {compile.status === 'idle' && (
                <p className="text-[#656d76] dark:text-[#8b949e]">
                  Not compiled yet — press <b>Compile</b> to dry-run (no save) and inspect the
                  polymorphic IR + AST.
                </p>
              )}
              {compile.status === 'compiling' && (
                <p className="flex items-center gap-2 text-[#656d76] dark:text-[#8b949e]">
                  <Loader2 className="size-3.5 animate-spin" /> Compiling…
                </p>
              )}
              {compile.status === 'error' && (
                <div className="rounded-md border border-[#FF8A7A]/40 bg-[#FDE8E4] dark:bg-rose-500/10 p-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#D64936] dark:text-[#FF8A7A] mb-1">
                    <AlertTriangle className="size-3.5" /> Compile error
                  </div>
                  <pre className="whitespace-pre-wrap break-words font-mono text-[10px] text-[#D64936] dark:text-[#FF8A7A]">
                    {compile.error}
                  </pre>
                </div>
              )}
              {compile.status === 'ok' && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#0F766E] dark:text-[#4ADE9E]">
                    <CheckCircle2 className="size-3.5" /> Compile OK
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="rounded bg-[#f6f8fa] dark:bg-[#0C0E11] border border-[#d0d7de] dark:border-[#24282F] p-2">
                      <div className="text-[9px] uppercase font-bold text-[#8b949e]">IR size</div>
                      <div className="font-mono font-bold">{compile.size} bytes</div>
                    </div>
                    <div className="rounded bg-[#f6f8fa] dark:bg-[#0C0E11] border border-[#d0d7de] dark:border-[#24282F] p-2">
                      <div className="text-[9px] uppercase font-bold text-[#8b949e]">
                        SHA-256
                      </div>
                      <div className="font-mono font-bold truncate">
                        {compile.sha ? `${compile.sha.slice(0, 12)}…` : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* IR / AST tabs */}
          <div className="rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] overflow-hidden flex-1">
            <div className="flex border-b border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11]">
              {(
                [
                  ['ir', 'IR listing'],
                  ['ast', 'AST'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 -mb-px ${
                    tab === key
                      ? 'border-[#12A594] dark:border-[#2DD4BF] text-[#0F766E] dark:text-[#2DD4BF]'
                      : 'border-transparent text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <pre className="p-3 max-h-[340px] overflow-auto text-[11px] leading-5 font-mono text-[#1f2328] dark:text-[#e6edf3] whitespace-pre">
              {compile.status !== 'ok' ? (
                <span className="text-[#8b949e]">
                  {tab === 'ir'
                    ? 'Compile to see the polymorphic IR.'
                    : 'Compile to see the AST structure.'}
                </span>
              ) : tab === 'ir' ? (
                compile.irListing
              ) : (
                compile.ast
              )}
            </pre>
          </div>

          {/* Run panel */}
          <div className="rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e] mb-2">
              Run on endpoint
            </div>
            <div className="flex items-center gap-2">
              <select
                value={runAgentId}
                onChange={(e) => setRunAgentId(e.target.value)}
                className={`${selectCls} flex-1 min-w-0`}
                title="Target agent"
              >
                <option value="">
                  {agentOptions.length > 0
                    ? `auto (${(agentOptions.find((a) => a.status === 'online') ?? agentOptions[0]).hostname})`
                    : 'no agents registered'}
                </option>
                {agentOptions.map((a) => (
                  <option key={a.agentId} value={a.agentId}>
                    {a.hostname} ({a.status})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={btnRun}
                onClick={handleRun}
                disabled={running || agentOptions.length === 0}
              >
                {running ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
                Run
              </button>
            </div>
            {lastJobId && (
              <button
                type="button"
                onClick={() => router.push(`/jobs/${lastJobId}`)}
                className="mt-2 w-full flex items-center justify-between rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] px-2.5 py-2 text-[11px] font-semibold text-[#0F766E] dark:text-[#2DD4BF] hover:bg-[#D9F5F2] dark:hover:bg-teal-500/10 transition-colors cursor-pointer"
              >
                Last job {lastJobId.slice(0, 8).toUpperCase()}
                <ArrowRight className="size-3" />
              </button>
            )}
            <p className="mt-2 text-[10px] leading-snug text-[#8b949e]">
              Saves first if there are unsaved changes, then dispatches the compiled polymorphic IR
              for in-memory execution.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
