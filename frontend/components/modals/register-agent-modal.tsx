'use client'

import React, { useState } from 'react'
import { Modal, useToast } from '@/components/ui'
import { Copy, Terminal } from 'lucide-react'

interface RegisterAgentModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RegisterAgentModal({ isOpen, onClose }: RegisterAgentModalProps) {
  const { toast } = useToast()
  const [hostname, setHostname] = useState('')
  const [os, setOs] = useState('linux')

  const cmd = `python3 scripts/register_agent.py --hostname ${hostname || '<HOSTNAME>'} --os ${os}`

  const copy = (text: string, what: string) => {
    navigator.clipboard.writeText(text)
    toast(`${what} copied to clipboard.`, 'success')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register an endpoint"
      description="Agents self-register by generating an RSA keypair and calling POST /agents/register."
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4 text-xs">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
              Hostname
            </span>
            <input
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              placeholder="e.g. FORENSIC-LNX-11"
              className="rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#0C0E11] px-2.5 py-1.5 text-xs outline-none focus:border-[#12A594] dark:focus:border-[#2DD4BF] w-56"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
              OS
            </span>
            <select
              value={os}
              onChange={(e) => setOs(e.target.value)}
              className="rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#0C0E11] px-2.5 py-1.5 text-xs outline-none cursor-pointer"
            >
              <option value="linux">linux</option>
              <option value="windows">windows</option>
              <option value="darwin">darwin</option>
            </select>
          </label>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
              1 · Register from the repo root
            </span>
            <button
              type="button"
              onClick={() => copy(cmd, 'Register command')}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:underline cursor-pointer"
            >
              <Copy className="size-3" /> Copy
            </button>
          </div>
          <div className="flex items-start gap-2 rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#0C0E11] p-2.5">
            <Terminal className="size-3.5 text-[#4ADE9E] mt-0.5 shrink-0" />
            <code className="font-mono text-[11px] text-[#e6edf3] break-all">{cmd}</code>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-[#656d76] dark:text-[#8b949e]">
            Generates an RSA-2048 keypair, calls <code className="font-mono">POST /agents/register</code>,
            writes the private key to disk, and prints the exact agent start command.
          </p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
            2 · Start the agent
          </span>
          <p className="mt-1 text-[11px] leading-snug text-[#656d76] dark:text-[#8b949e]">
            Run the command printed by the script — it includes the agent id, private key path and
            backend URL. The agent then polls{' '}
            <code className="font-mono">GET /jobs/pending/&#123;agent_id&#125;</code> and executes
            dispatched JOCKY IR in memory. It appears here within one heartbeat (~15s).
          </p>
        </div>

        <div className="rounded-md border border-[#2DD4BF]/40 bg-[#D9F5F2] dark:bg-teal-500/10 p-2.5 text-[11px] leading-snug text-[#0F766E] dark:text-[#2DD4BF]">
          Cross-compile for other OSes:{' '}
          <code className="font-mono">
            GOOS=windows GOARCH=amd64 go build -o tartarus-agent.exe ./agent
          </code>
        </div>
      </div>
    </Modal>
  )
}
