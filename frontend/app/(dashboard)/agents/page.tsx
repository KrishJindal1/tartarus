'use client'

import React, { useState } from 'react'
import { Plus, Loader2, Server } from 'lucide-react'
import { AgentsTable } from '@/components/dashboard'
import { RegisterAgentModal } from '@/components/modals/register-agent-modal'
import { useDashboard } from '@/providers/dashboard-provider'

export default function AgentsPage() {
  const { agents, loaded } = useDashboard()
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  const online = agents.filter((a) => a.status === 'online').length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#1f2328] dark:text-[#f0f6fc]">Endpoints</h1>
          <p className="text-xs text-[#656d76] dark:text-[#8b949e]">
            {loaded ? (
              <>
                {online} of {agents.length} agent(s) online · self-registered, polling for jobs
              </>
            ) : (
              'Loading agents…'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsRegisterOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#0969da]/50 dark:border-[#58a6ff]/50 bg-[#0969da] dark:bg-[#1f6feb] px-3 py-2 text-xs font-bold text-white hover:bg-[#0550ae] dark:hover:bg-[#388bfd] transition-colors cursor-pointer"
        >
          <Plus className="size-3.5" /> Register endpoint
        </button>
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] py-20 text-xs text-[#656d76] dark:text-[#8b949e]">
          <Loader2 className="size-4 animate-spin" /> Loading agents…
        </div>
      ) : (
        <AgentsTable agents={agents} />
      )}

      <RegisterAgentModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </div>
  )
}
