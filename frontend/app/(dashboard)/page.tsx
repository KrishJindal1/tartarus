'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Play, Plus, Server, ArrowRight, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui'
import { JobsTable, MetricsGrid } from '@/components/dashboard'
import { AgentStatusBadge } from '@/components/dashboard/status-badge'
import { useDashboard } from '@/providers/dashboard-provider'

export default function OverviewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { metrics, jobs, agents, loaded, running, runSuite } = useDashboard()

  const handleRunSuite = async () => {
    const res = await runSuite()
    if (!res) {
      toast('Nothing to run — need an online agent and at least one staged script.', 'info')
      return
    }
    toast(`Queued ${res.queued}/${res.total} script job(s) on ${res.target}.`, res.queued > 0 ? 'success' : 'error')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Page head */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#1f2328] dark:text-[#f0f6fc]">Operations overview</h1>
          <p className="text-xs text-[#656d76] dark:text-[#8b949e]">
            Live state of agents, JOCKY scripts, jobs and evidence — polled every 3s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/run"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0F766E] dark:bg-[#0E8C7F] px-3 py-2 text-xs font-bold text-white hover:bg-[#0B5C53] dark:hover:bg-[#12A594] transition-colors cursor-pointer"
            title="Guided workflow: endpoint → script → execute → response"
          >
            <Play className="size-3.5" /> Run script
          </Link>
          <Link
            href="/scripts/new"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] px-3 py-2 text-xs font-bold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#1B1F26] transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" /> New script
          </Link>
          <button
            type="button"
            onClick={handleRunSuite}
            disabled={running || !loaded}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#0E8C7F]/40 dark:border-[#4ADE9E]/40 bg-[#DDF7EC] dark:bg-emerald-500/15 px-3 py-2 text-xs font-bold text-[#0F766E] dark:text-[#4ADE9E] hover:bg-[#C6F0DE] dark:hover:bg-emerald-500/25 transition-colors cursor-pointer disabled:opacity-50"
            title="Dispatch every deployed script to the first online agent"
          >
            {running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            Run suite
          </button>
        </div>
      </div>

      {metrics.length > 0 && <MetricsGrid metrics={metrics} />}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5">
        {/* Recent jobs */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">Recent jobs</h2>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:underline"
            >
              All jobs <ArrowRight className="size-3" />
            </Link>
          </div>
          <JobsTable jobs={jobs} compact />
        </section>

        {/* Side column */}
        <section className="flex flex-col gap-4">
          {/* Agents */}
          <div className="rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#d0d7de] dark:border-[#24282F] px-4 py-2.5 bg-[#f6f8fa] dark:bg-[#0C0E11]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
                Endpoints
              </span>
              <Link
                href="/agents"
                className="text-[11px] font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:underline"
              >
                Manage
              </Link>
            </div>
            <ul className="divide-y divide-[#d0d7de]/60 dark:divide-[#24282F]">
              {agents.slice(0, 6).map((a) => (
                <li key={a.agentId}>
                  <Link
                    href={`/agents/${a.agentId}`}
                    className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-[#f6f8fa] dark:hover:bg-[#0C0E11] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                        {a.hostname}
                      </div>
                      <div className="text-[10px] capitalize text-[#8b949e]">
                        {a.os} · {a.jobCount} job(s)
                      </div>
                    </div>
                    <AgentStatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
              {loaded && agents.length === 0 && (
                <li className="px-4 py-5 text-center text-xs text-[#8b949e]">
                  <Server className="size-4 mx-auto mb-1.5 opacity-50" />
                  No agents registered yet.
                </li>
              )}
              {!loaded && (
                <li className="px-4 py-5 text-center text-xs text-[#8b949e]">
                  <Loader2 className="size-4 mx-auto mb-1.5 animate-spin" />
                  Loading…
                </li>
              )}
            </ul>
          </div>

          {/* Quick links */}
          <div className="rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] p-4 flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
              Quick actions
            </span>
            {[
              { label: 'Run a script (endpoint → response)', href: '/run', icon: Play },
              { label: 'Write a script in the IDE', href: '/scripts/new', icon: Plus },
              { label: 'Browse evidence artifacts', href: '/evidence', icon: ArrowRight },
              { label: 'Open forensic reports', href: '/reports', icon: ArrowRight },
            ].map((action) => (
              <button
                key={action.href}
                type="button"
                onClick={() => router.push(action.href)}
                className="flex items-center justify-between rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] px-3 py-2 text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] hover:border-[#12A594] dark:hover:border-[#2DD4BF] transition-colors cursor-pointer text-left"
              >
                {action.label}
                <action.icon className="size-3.5 text-[#8b949e]" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
