'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Server } from 'lucide-react'
import { JobsTable } from '@/components/dashboard'
import { AgentStatusBadge } from '@/components/dashboard/status-badge'
import { relTime } from '@/providers/dashboard-provider'
import { useDashboard } from '@/providers/dashboard-provider'

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { agents, jobs, loaded } = useDashboard()

  const agent = agents.find((a) => a.agentId === id)
  const agentJobs = jobs.filter((j) => j.agentId === id)

  if (!loaded) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] py-20 text-xs text-[#656d76] dark:text-[#8b949e]">
        <Loader2 className="size-4 animate-spin" /> Loading agent…
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] py-16 text-center">
        <Server className="size-6 mx-auto mb-3 text-[#8b949e]" />
        <p className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">Agent not found</p>
        <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">
          It may have been de-registered.
        </p>
        <Link
          href="/agents"
          className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#0969da] dark:text-[#58a6ff] hover:underline"
        >
          <ArrowLeft className="size-3.5" /> Back to endpoints
        </Link>
      </div>
    )
  }

  const meta: Array<[string, React.ReactNode]> = [
    ['Agent ID', <span className="font-mono break-all" key="id">{agent.agentId}</span>],
    ['Status', <AgentStatusBadge status={agent.status} key="st" />],
    ['OS / Arch', <span key="os" className="capitalize">{agent.os} · {agent.architecture}</span>],
    ['AV present', <span key="av">{agent.avPresent ?? '—'}</span>],
    ['Agent version', <span key="v" className="font-mono">{agent.agentVersion ?? '—'}</span>],
    ['Registered', <span key="r">{relTime(agent.registeredAt)}</span>],
    ['Last heartbeat', <span key="h">{relTime(agent.lastSeenAt)}</span>],
    ['Jobs', <span key="j" className="tabular-nums">{agent.jobCount} total · {agent.runningJobs} active</span>],
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/agents"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0969da] dark:text-[#58a6ff] hover:underline"
        >
          <ArrowLeft className="size-3" /> Endpoints
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-bold text-[#1f2328] dark:text-[#f0f6fc]">{agent.hostname}</h1>
          <AgentStatusBadge status={agent.status} />
        </div>
        <p className="text-xs text-[#656d76] dark:text-[#8b949e]">
          Registered agent — receives polymorphic IR jobs and executes them in memory.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {meta.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-3"
          >
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#8b949e]">
              {label}
            </div>
            <div className="mt-1 text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3]">
              {value}
            </div>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
          Jobs on this endpoint
        </h2>
        <JobsTable jobs={agentJobs} />
      </section>
    </div>
  )
}
