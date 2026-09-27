'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Server, ArrowRight, Play } from 'lucide-react'
import { AgentStatusBadge } from './status-badge'
import { TablePagination } from './table-pagination'
import { relTime } from '@/providers/dashboard-provider'
import type { AgentView } from '@/types'

interface AgentsTableProps {
  agents: AgentView[]
}

const th =
  'px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]'
const td = 'px-4 py-3 text-xs align-middle'

const PAGE_SIZE = 10

export function AgentsTable({ agents }: AgentsTableProps) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return agents
    return agents.filter(
      (a) =>
        a.hostname.toLowerCase().includes(q) ||
        a.os.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q) ||
        a.agentId.toLowerCase().includes(q)
    )
  }, [agents, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <div className="rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] overflow-hidden">
      <div className="border-b border-[#d0d7de] dark:border-[#24282F] p-3">
        <div className="flex items-center gap-2 rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] px-2.5 py-1.5 max-w-md">
          <Search className="size-3.5 text-[#8b949e]" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search hostname, OS, status, agent id…"
            className="w-full bg-transparent text-xs outline-none placeholder:text-[#8b949e]"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-[#f6f8fa] dark:bg-[#0C0E11]">
            <tr className="border-b border-[#d0d7de] dark:border-[#24282F]">
              <th className={th}>Hostname</th>
              <th className={th}>Status</th>
              <th className={th}>OS / Arch</th>
              <th className={th}>AV Present</th>
              <th className={th}>Jobs</th>
              <th className={th}>Last Seen</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((agent) => (
              <tr
                key={agent.agentId}
                className="border-b border-[#d0d7de]/60 dark:border-[#24282F] last:border-0 hover:bg-[#f6f8fa] dark:hover:bg-[#0C0E11] transition-colors"
              >
                <td className={td}>
                  <Link
                    href={`/agents/${agent.agentId}`}
                    className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] hover:text-[#0F766E] dark:hover:text-[#2DD4BF] hover:underline"
                  >
                    {agent.hostname}
                  </Link>
                  <div className="text-[10px] text-[#8b949e] font-mono truncate max-w-[200px]">
                    {agent.agentId}
                  </div>
                </td>
                <td className={td}>
                  <AgentStatusBadge status={agent.status} />
                </td>
                <td className={td}>
                  <div className="capitalize">{agent.os}</div>
                  <div className="text-[10px] text-[#8b949e]">{agent.architecture}</div>
                </td>
                <td className={`${td} text-[#656d76] dark:text-[#8b949e]`}>
                  {agent.avPresent ?? '—'}
                </td>
                <td className={`${td} tabular-nums`}>
                  {agent.jobCount}
                  {agent.runningJobs > 0 && (
                    <span className="ml-1.5 text-[10px] font-bold text-[#0F766E] dark:text-[#2DD4BF]">
                      {agent.runningJobs} active
                    </span>
                  )}
                </td>
                <td className={`${td} text-[#656d76] dark:text-[#8b949e] whitespace-nowrap`}>
                  {relTime(agent.lastSeenAt)}
                </td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  <div className="inline-flex items-center gap-3">
                    <Link
                      href={`/run?agent=${agent.agentId}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F766E] dark:text-[#4ADE9E] hover:underline"
                      title="Run a script on this endpoint"
                    >
                      <Play className="size-3" /> Run
                    </Link>
                    <Link
                      href={`/agents/${agent.agentId}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F766E] dark:text-[#2DD4BF] hover:underline"
                    >
                      View <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-xs text-[#8b949e]">
                  <Server className="size-5 mx-auto mb-2 opacity-50" />
                  {agents.length === 0
                    ? 'No agents registered yet — use “Register endpoint” to add one.'
                    : 'No agents match the current search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={current}
        pageCount={pageCount}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        onPage={setPage}
      />
    </div>
  )
}
