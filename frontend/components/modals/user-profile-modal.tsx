'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui'
import { User, Shield, Key, LogOut } from 'lucide-react'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdateRole: (role: string) => void
}

export function UserProfileModal({
  isOpen,
  onClose,
  onUpdateRole,
}: UserProfileModalProps) {
  const [role, setRole] = useState('Lead Forensic Auditor')
  const [name, setName] = useState('Jordan Davis')
  const [email, setEmail] = useState('jordan.davis@controlplane.gov')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateRole(role)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Operator Profile & Security"
      description="Manage active role credentials, session identity, and workspace permissions."
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 bg-[#f6f8fa] dark:bg-[#0d1117] rounded-lg border border-[#d0d7de] dark:border-[#30363d]">
          <div className="flex size-11 items-center justify-center rounded-full bg-[#1f883d] dark:bg-[#238636] text-white font-bold text-sm">
            JD
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-[#1f2328] dark:text-[#f0f6fc]">{name}</h4>
            <p className="text-xs text-[#656d76] dark:text-[#8b949e] truncate">{email}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
            Assigned Workspace Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs cursor-pointer"
          >
            <option value="Lead Forensic Auditor">Lead Forensic Auditor (Full Access)</option>
            <option value="System Security Engineer">System Security Engineer (Deploy & Audit)</option>
            <option value="Telemetry Operator">Telemetry Operator (Read & Run Only)</option>
            <option value="Audit Viewer">Audit Viewer (Read Only)</option>
          </select>
        </div>

        <div className="rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-3 divide-y divide-[#d0d7de]/60 dark:divide-[#30363d] text-xs">
          <div className="pb-2 flex justify-between items-center">
            <span className="text-[#656d76] dark:text-[#8b949e]">Session Status</span>
            <span className="font-semibold text-[#1a7f37] dark:text-[#3fb950]">Authenticated (JWT HS256)</span>
          </div>
          <div className="pt-2 flex justify-between items-center">
            <span className="text-[#656d76] dark:text-[#8b949e]">Access Scope</span>
            <span className="font-mono text-[#1f2328] dark:text-[#e6edf3]">workspace:controlplane:admin</span>
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
            Update Profile
          </button>
        </div>
      </form>
    </Modal>
  )
}
