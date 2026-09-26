'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui'
import { Endpoint } from '@/types'

interface ConfigureEndpointModalProps {
  endpoint: Endpoint | null
  isOpen: boolean
  onClose: () => void
  onSave: (updated: Endpoint) => void
  onDelete?: (name: string) => void
}

export function ConfigureEndpointModal({
  endpoint,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: ConfigureEndpointModalProps) {
  if (!endpoint) return null

  const [latency, setLatency] = useState(endpoint.latency)
  const [status, setStatus] = useState(endpoint.status)
  const [platform, setPlatform] = useState(endpoint.platform)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...endpoint,
      latency,
      status,
      platform,
      color: status === 'Healthy' ? 'sky' : 'slate',
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure ${endpoint.name}`}
      description="Update health thresholds, operating environment, and operational status."
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
            Route Identifier
          </label>
          <input
            type="text"
            disabled
            value={endpoint.url}
            className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] px-3 py-2 text-xs font-mono text-[#656d76] dark:text-[#8b949e] cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
              Operational Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2.5 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs cursor-pointer"
            >
              <option value="Healthy">Healthy</option>
              <option value="Degraded">Degraded</option>
              <option value="Warning">Warning</option>
              <option value="Down">Down</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
              Current Latency
            </label>
            <input
              type="text"
              value={latency}
              onChange={(e) => setLatency(e.target.value)}
              className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
            Platform Environment
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2.5 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs cursor-pointer"
          >
            <option value="Windows Server 2022">Windows Server 2022</option>
            <option value="Windows Server 2019">Windows Server 2019</option>
            <option value="Ubuntu 24.04 LTS">Ubuntu 24.04 LTS</option>
            <option value="Ubuntu 22.04 LTS">Ubuntu 22.04 LTS</option>
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#d0d7de] dark:border-[#30363d] pt-4">
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete(endpoint.name)
                onClose()
              }}
              className="text-xs font-semibold text-[#cf222e] dark:text-[#f85149] hover:underline cursor-pointer"
            >
              Delete Endpoint
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
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
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
