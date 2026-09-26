'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui'
import { ShieldCheck, Network, KeyRound, Radio } from 'lucide-react'

interface EnvironmentConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: any) => void
}

export function EnvironmentConfigModal({
  isOpen,
  onClose,
  onSave,
}: EnvironmentConfigModalProps) {
  const [telemetryMode, setTelemetryMode] = useState('Polymorphic In-Memory')
  const [cdnRouting, setCdnRouting] = useState('Encrypted TLS 1.3 Tunnel')
  const [heartbeatSec, setHeartbeatSec] = useState('15')
  const [byovdMonitoring, setByovdMonitoring] = useState(true)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ telemetryMode, cdnRouting, heartbeatSec, byovdMonitoring })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Environment & Telemetry Configuration"
      description="Manage node isolation, communication routing, and in-memory execution parameters."
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
            Telemetry Execution Mode
          </label>
          <select
            value={telemetryMode}
            onChange={(e) => setTelemetryMode(e.target.value)}
            className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs cursor-pointer"
          >
            <option value="Polymorphic In-Memory">Polymorphic In-Memory (Direct Syscalls)</option>
            <option value="Reflective Dynamic Injection">Reflective Dynamic Injection</option>
            <option value="Passive Endpoint Telemetry">Passive Endpoint Telemetry Only</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
            Network Routing Infrastructure
          </label>
          <select
            value={cdnRouting}
            onChange={(e) => setCdnRouting(e.target.value)}
            className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs cursor-pointer"
          >
            <option value="Encrypted TLS 1.3 Tunnel">Encrypted TLS 1.3 Tunnel (Port 443)</option>
            <option value="Direct HTTPS Gateway">Direct HTTPS Gateway</option>
            <option value="Encrypted SOCKS5 Proxy Relay">Encrypted SOCKS5 Proxy Relay</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
              Heartbeat Interval (sec)
            </label>
            <input
              type="number"
              value={heartbeatSec}
              onChange={(e) => setHeartbeatSec(e.target.value)}
              className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
              Kernel Driver Guard
            </label>
            <div className="flex items-center h-9">
              <label className="flex items-center gap-2 text-xs font-medium text-[#1f2328] dark:text-[#e6edf3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={byovdMonitoring}
                  onChange={(e) => setByovdMonitoring(e.target.checked)}
                  className="rounded border-[#d0d7de] dark:border-[#30363d] text-[#1f883d] focus:ring-[#1f883d] size-4 cursor-pointer"
                />
                Audit BYOVD Callbacks
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-[#ddf4ff] dark:bg-[#388bfd]/10 border border-[#54aeff]/40 dark:border-[#388bfd]/30 p-3 text-xs text-[#1f2328] dark:text-[#e6edf3]">
          <div className="flex items-center gap-2 font-semibold text-[#0969da] dark:text-[#58a6ff]">
            <ShieldCheck className="size-4 text-[#0969da] dark:text-[#58a6ff]" /> Environment Health
          </div>
          <p className="mt-1 text-[11px] text-[#656d76] dark:text-[#8b949e]">
            Current node certificate valid. Memory sandbox verified unhooked on Windows & Ubuntu targets.
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t border-[#d0d7de] dark:border-[#30363d] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] px-3.5 py-2 text-xs font-medium text-[#1f2328] dark:text-[#c9d1d9] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            Save Environment Config
          </button>
        </div>
      </form>
    </Modal>
  )
}
