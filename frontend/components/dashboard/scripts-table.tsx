'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, TerminalSquare, Code2, Play, FileCode2 } from 'lucide-react'
import { useToast } from '@/components/ui'
import { useDashboard } from '@/providers/dashboard-provider'
import type { ScriptView } from '@/types'

interface ScriptsTableProps {
  scripts: ScriptView[]
}

const th =
  'px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]'
const td = 'px-4 py-3 text-xs align-middle'

const riskTone = (risk: string): string =>
  risk === 'critical'
    ? 'text-[#cf222e] dark:text-[#ff7b72] font-bold'
    : risk === 'high'
    ? 'text-[#bc4c00] dark:text-[#ff9492] font-semibold'
    : risk === 'medium'
    ? 'text-[#9a6700] dark:text-[#d29922] font-semibold'
    : 'text-[#1a7f37] dark:text-[#3fb950] font-semibold'

export function ScriptsTable({ scripts }: ScriptsTableProps) {
  const { toast } = useToast()
  const { runScript, agents } = useDashboard()
  const [query, setQuery] = useState('')
  const [runningId, setRunningId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return scripts
    return scripts.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.riskLevel.toLowerCase().includes(q)
    )
  }, [scripts, query])

  const onlineAgent = agents.find((a) => a.status === 'online') ?? agents[0]

  const handleRun = async (script: ScriptView) => {
    if (!onlineAgent) {
      toast('No registered agent available — register an endpoint first.', 'error')
      return
    }
    setRunningId(script.id)
    try {
      const res = await runScript(script.id, onlineAgent.agentId)
      if (res.ok) {
        toast(`Queued “${script.name}” on ${onlineAgent.hostname}.`, 'success')
      } else {
        toast(res.message, 'error')
      }
    } finally {
      setRunningId(null)
    }
  }

  return (
    <div className="rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] overflow-hidden">
      <div className="border-b border-[#d0d7de] dark:border-[#30363d] p-3">
        <div className="flex items-center gap-2 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] px-2.5 py-1.5 max-w-md">
          <Search className="size-3.5 text-[#8b949e]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scripts by name, category, risk…"
            className="w-full bg-transparent text-xs outline-none placeholder:text-[#8b949e]"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-[#f6f8fa] dark:bg-[#0d1117]">
            <tr className="border-b border-[#d0d7de] dark:border-[#30363d]">
              <th className={th}>Script</th>
              <th className={th}>Category</th>
              <th className={th}>Risk</th>
              <th className={th}>Target OS</th>
              <th className={th}>Version</th>
              <th className={th}>IR SHA-256</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((script) => (
              <tr
                key={script.id}
                className="border-b border-[#d0d7de]/60 dark:border-[#30363d] last:border-0 hover:bg-[#f6f8fa] dark:hover:bg-[#0d1117] transition-colors"
              >
                <td className={td}>
                  <div className="flex items-center gap-2">
                    <FileCode2 className="size-3.5 text-[#8b949e] shrink-0" />
                    <div>
                      <Link
                        href={`/scripts/${script.id}`}
                        className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] hover:text-[#0969da] dark:hover:text-[#58a6ff] hover:underline"
                      >
                        {script.name}
                      </Link>
                      <div className="text-[10px] text-[#8b949e] truncate max-w-[260px]">
                        {script.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={td}>
                  <span className="capitalize text-[#656d76] dark:text-[#8b949e]">
                    {script.category}
                  </span>
                  {script.isPredefined && (
                    <span className="ml-1.5 rounded border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#8b949e]">
                      builtin
                    </span>
                  )}
                </td>
                <td className={`${td} capitalize ${riskTone(script.riskLevel)}`}>
                  {script.riskLevel}
                </td>
                <td className={`${td} capitalize text-[#656d76] dark:text-[#8b949e]`}>
                  {script.osTarget}
                </td>
                <td className={`${td} tabular-nums text-[#656d76] dark:text-[#8b949e]`}>
                  v{script.version}
                </td>
                <td className={`${td} font-mono text-[10px] text-[#656d76] dark:text-[#8b949e]`}>
                  {script.irSha256 ? `${script.irSha256.slice(0, 12)}…` : '—'}
                </td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  <div className="inline-flex items-center gap-1.5">
                    <Link
                      href={`/scripts/${script.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] px-2 py-1 text-[11px] font-semibold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors cursor-pointer"
                      title="Open in IDE"
                    >
                      <Code2 className="size-3" /> Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRun(script)}
                      disabled={runningId === script.id}
                      className="inline-flex items-center gap-1 rounded-md border border-[#1a7f37]/40 dark:border-[#3fb950]/40 bg-[#dafbe1] dark:bg-emerald-500/15 px-2 py-1 text-[11px] font-bold text-[#1a7f37] dark:text-[#3fb950] hover:bg-[#bcf7cb] dark:hover:bg-emerald-500/25 transition-colors cursor-pointer disabled:opacity-50"
                      title={onlineAgent ? `Run on ${onlineAgent.hostname}` : 'No agent available'}
                    >
                      <Play className="size-3" />
                      {runningId === script.id ? 'Queueing…' : 'Run'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-xs text-[#8b949e]">
                  <TerminalSquare className="size-5 mx-auto mb-2 opacity-50" />
                  {scripts.length === 0
                    ? 'No scripts staged — create one in the IDE.'
                    : 'No scripts match the current search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-[#d0d7de] dark:border-[#30363d] px-4 py-2 flex items-center justify-between text-[11px] text-[#656d76] dark:text-[#8b949e]">
        <span>
          {filtered.length} of {scripts.length} script(s)
        </span>
        <span>IR is re-generated on every compile (polymorphic)</span>
      </div>
    </div>
  )
}
