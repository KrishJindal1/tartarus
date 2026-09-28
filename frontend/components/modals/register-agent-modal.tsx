'use client'

import React, { useState } from 'react'
import { Modal, useToast } from '@/components/ui'
import { API_BASE } from '@/lib/api'
import { Copy, Terminal } from 'lucide-react'

interface RegisterAgentModalProps {
  isOpen: boolean
  onClose: () => void
}

function CodeBlock({
  label,
  code,
  onCopy,
}: {
  label: string
  code: string
  onCopy: (text: string, what: string) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
          {label}
        </span>
        <button
          type="button"
          onClick={() => onCopy(code, label)}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:underline cursor-pointer"
        >
          <Copy className="size-3" /> Copy
        </button>
      </div>
      <div className="flex items-start gap-2 rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#0C0E11] p-2.5">
        <Terminal className="size-3.5 text-[#4ADE9E] mt-0.5 shrink-0" />
        <code className="font-mono text-[11px] text-[#e6edf3] break-all whitespace-pre-wrap">
          {code}
        </code>
      </div>
    </div>
  )
}

export function RegisterAgentModal({ isOpen, onClose }: RegisterAgentModalProps) {
  const { toast } = useToast()
  const [hostname, setHostname] = useState('')
  const [os, setOs] = useState('auto')

  const base = API_BASE
  const linuxInstall = `curl -fsSL https://raw.githubusercontent.com/himkarr/tartarus/main/agent/install/install-linux.sh | bash -s -- --c2 ${base}`
  const windowsInstall = `iwr https://raw.githubusercontent.com/himkarr/tartarus/main/agent/install/install-windows.ps1 -OutFile i.ps1; .\\i.ps1 -C2 ${base} -Autostart`
  const registerCmd = `python3 scripts/register_agent.py --hostname ${hostname || '<HOSTNAME>'} --os ${os} --backend ${base}`

  const copy = (text: string, what: string) => {
    navigator.clipboard.writeText(text)
    toast(`${what} copied to clipboard.`, 'success')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register an endpoint"
      description="Install the agent on the target machine — it generates its own RSA-2048 keypair and self-registers with the backend on start."
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
            1 · Recommended — one-line installer
          </span>
          <p className="mt-1 mb-2 text-[11px] leading-snug text-[#656d76] dark:text-[#8b949e]">
            Downloads the binary to <code className="font-mono">~/.jocky-agent</code> (Windows:{' '}
            <code className="font-mono">%LOCALAPPDATA%\jocky-agent</code>), generates the key,
            registers against <code className="font-mono">{base}</code> and starts the agent.
          </p>
          <div className="flex flex-col gap-3">
            <CodeBlock label="Linux" code={linuxInstall} onCopy={copy} />
            <CodeBlock label="Windows (PowerShell)" code={windowsInstall} onCopy={copy} />
          </div>
        </div>

        <div className="border-t border-[#d0d7de] dark:border-[#24282F] pt-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
            2 · Alternative — manual pre-registration
          </span>
          <p className="mt-1 mb-2 text-[11px] leading-snug text-[#656d76] dark:text-[#8b949e]">
            From the repo root: generates the keypair, calls{' '}
            <code className="font-mono">POST /agents/register</code>, and prints the exact agent
            start command for your machine.
          </p>
          <div className="flex flex-wrap items-end gap-2 mb-2">
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
                <option value="auto">auto (detect)</option>
                <option value="linux">linux</option>
                <option value="windows">windows</option>
                <option value="darwin">darwin</option>
              </select>
            </label>
          </div>
          <CodeBlock label="Register command" code={registerCmd} onCopy={copy} />
        </div>

        <div className="rounded-md border border-[#2DD4BF]/40 bg-[#D9F5F2] dark:bg-teal-500/10 p-2.5 text-[11px] leading-snug text-[#0F766E] dark:text-[#2DD4BF]">
          Once started, the agent polls{' '}
          <code className="font-mono">GET /jobs/pending/&#123;agent_id&#125;</code> and executes
          dispatched JOCKY IR in memory — it appears in the console within one heartbeat (~15s).
          Cross-compile: <code className="font-mono">GOOS=windows GOARCH=amd64 go build -o tartarus-agent.exe ./agent</code>
        </div>
      </div>
    </Modal>
  )
}
