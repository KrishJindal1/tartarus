'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui'
import { Endpoint, HttpMethod, ToneColor } from '@/types'

interface AddEndpointModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (endpoint: Endpoint) => void
}

export function AddEndpointModal({ isOpen, onClose, onAdd }: AddEndpointModalProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState<HttpMethod>('POST')
  const [platform, setPlatform] = useState('Windows Server 2022')
  const [threshold, setThreshold] = useState('200')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !url.trim()) return

    const newEndpoint: Endpoint = {
      name: name.trim(),
      url: url.trim().startsWith('/') ? url.trim() : `/${url.trim()}`,
      method,
      status: 'Healthy',
      latency: `${threshold} ms`,
      lastRun: 'Just now',
      platform,
      color: 'sky',
    }

    onAdd(newEndpoint)
    setName('')
    setUrl('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Target Endpoint"
      description="Register a new API route or system forensic target for continuous monitoring."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
            Endpoint Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kernel Telemetry Ingestion"
            className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs placeholder:text-[#656d76] dark:placeholder:text-[#8b949e]"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
              Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2.5 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs cursor-pointer"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
              Path / Route
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/api/v1/telemetry"
              className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs font-mono text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs placeholder:text-[#656d76] dark:placeholder:text-[#8b949e]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
              Target Platform
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

          <div>
            <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
              Latency Target (ms)
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs"
            />
          </div>
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
            Register Endpoint
          </button>
        </div>
      </form>
    </Modal>
  )
}
