'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui'

interface ScheduleDeliveryModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (config: { frequency: string; channel: string; target: string }) => void
}

export function ScheduleDeliveryModal({
  isOpen,
  onClose,
  onSchedule,
}: ScheduleDeliveryModalProps) {
  const [frequency, setFrequency] = useState('Daily (Midnight UTC)')
  const [channel, setChannel] = useState('Webhook / Slack')
  const [target, setTarget] = useState('https://hooks.slack.com/services/T00/B00/XXXX')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSchedule({ frequency, channel, target })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Delivery Schedule"
      description="Automate automated export generation and alert dispatches to team notification channels."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
            Execution Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs cursor-pointer"
          >
            <option value="Daily (Midnight UTC)">Daily (Midnight UTC)</option>
            <option value="After Each Test Suite Run">After Each Test Suite Run</option>
            <option value="Weekly (Monday 08:00 UTC)">Weekly (Monday 08:00 UTC)</option>
            <option value="On Critical Finding Alert">On Critical Finding Alert Only</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
            Delivery Channel
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs cursor-pointer"
          >
            <option value="Webhook / Slack">Webhook (Slack / Discord / Teams)</option>
            <option value="Email Distribution List">Email Distribution List</option>
            <option value="Encrypted Cloud Storage Bucket">Encrypted Cloud Storage Bucket</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
            Destination Webhook / Email Endpoint
          </label>
          <input
            type="text"
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs font-mono text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs placeholder:text-[#656d76] dark:placeholder:text-[#8b949e]"
          />
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
            Save Schedule
          </button>
        </div>
      </form>
    </Modal>
  )
}
