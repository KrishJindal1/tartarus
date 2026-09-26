'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui'

interface GuardrailPolicyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (policy: { peerReview: boolean; autoSmoke: boolean; rollbackKeep: boolean }) => void
}

export function GuardrailPolicyModal({ isOpen, onClose, onSave }: GuardrailPolicyModalProps) {
  const [peerReview, setPeerReview] = useState(true)
  const [autoSmoke, setAutoSmoke] = useState(true)
  const [rollbackKeep, setRollbackKeep] = useState(true)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ peerReview, autoSmoke, rollbackKeep })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deployment Guardrail Policy"
      description="Configure CI/CD safety checks and automatic deployment boundaries."
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <label className="flex items-start gap-3 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-3 cursor-pointer hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors">
            <input
              type="checkbox"
              checked={peerReview}
              onChange={(e) => setPeerReview(e.target.checked)}
              className="mt-0.5 size-4 rounded border-[#d0d7de] dark:border-[#30363d] text-[#1f883d] focus:ring-[#1f883d]"
            />
            <div className="text-xs">
              <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] block">Require Peer Review</span>
              <span className="text-[#656d76] dark:text-[#8b949e]">Block automated production rollouts until cryptographically signed by an auditor.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-3 cursor-pointer hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors">
            <input
              type="checkbox"
              checked={autoSmoke}
              onChange={(e) => setAutoSmoke(e.target.checked)}
              className="mt-0.5 size-4 rounded border-[#d0d7de] dark:border-[#30363d] text-[#1f883d] focus:ring-[#1f883d]"
            />
            <div className="text-xs">
              <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] block">Post-Deployment Smoke Suite</span>
              <span className="text-[#656d76] dark:text-[#8b949e]">Automatically run in-memory sanity tests immediately following successful binary injection.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-3 cursor-pointer hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors">
            <input
              type="checkbox"
              checked={rollbackKeep}
              onChange={(e) => setRollbackKeep(e.target.checked)}
              className="mt-0.5 size-4 rounded border-[#d0d7de] dark:border-[#30363d] text-[#1f883d] focus:ring-[#1f883d]"
            />
            <div className="text-xs">
              <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] block">Maintain Zero-Downtime Rollback</span>
              <span className="text-[#656d76] dark:text-[#8b949e]">Keep prior stable polymorphic binary buffered in target cache for immediate restoration.</span>
            </div>
          </label>
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
            Update Policy
          </button>
        </div>
      </form>
    </Modal>
  )
}
