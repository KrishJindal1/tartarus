'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui'
import { ReportItem } from '@/types'

interface CreateReportModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (report: Partial<ReportItem>) => void
}

export function CreateReportModal({ isOpen, onClose, onCreate }: CreateReportModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ReportItem['category']>('Forensic System Audit')
  const [executiveSummary, setExecutiveSummary] = useState('')
  const [targetCluster, setTargetCluster] = useState('Hybrid Windows & Ubuntu (us-east-prod-02, us-east-worker-09)')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onCreate({
      title: title.trim(),
      category,
      executiveSummary: executiveSummary.trim() || 'Comprehensive multi-target forensic analysis generated via JOCKY central management plane.',
      targetCluster,
    })

    setTitle('')
    setExecutiveSummary('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compile Forensic System Audit Report"
      description="Synthesize in-memory artifacts, kernel BYOVD telemetry, and unhooked syscall logs into an executive report."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
            Report Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q3 BYOVD & In-Memory Forensics Audit"
            className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs placeholder:text-[#656d76] dark:placeholder:text-[#8b949e]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
              Audit Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportItem['category'])}
              className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2.5 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs cursor-pointer"
            >
              <option value="Forensic System Audit">Forensic System Audit</option>
              <option value="Polymorphic Evasion Report">Polymorphic Evasion Report</option>
              <option value="BYOVD Subversion Log">BYOVD Subversion Log</option>
              <option value="Memory Integrity Review">Memory Integrity Review</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
              Target Cluster Scope
            </label>
            <input
              type="text"
              value={targetCluster}
              onChange={(e) => setTargetCluster(e.target.value)}
              className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs placeholder:text-[#656d76] dark:placeholder:text-[#8b949e]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
            Executive Summary
          </label>
          <textarea
            rows={3}
            value={executiveSummary}
            onChange={(e) => setExecutiveSummary(e.target.value)}
            placeholder="Executive overview of the forensic findings and evasion verification..."
            className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs resize-none placeholder:text-[#656d76] dark:placeholder:text-[#8b949e]"
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
            Compile Report Deliverable
          </button>
        </div>
      </form>
    </Modal>
  )
}
