'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui'
import { ScriptItem, EvasionTechnique } from '@/types'

interface ImportScriptModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (script: ScriptItem) => void
}

export function ImportScriptModal({ isOpen, onClose, onImport }: ImportScriptModalProps) {
  const [name, setName] = useState('')
  const [version, setVersion] = useState('v1.0.0')
  const [technique, setTechnique] = useState<EvasionTechnique>('Polymorphic LLVM Mutation')
  const [scriptCode, setScriptCode] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const randomHash = Math.random().toString(16).substring(2, 10)

    onImport({
      name: name.trim(),
      version: version.trim() || 'v1.0.0',
      lastDeployedOrDraft: 'Draft changes ready for compile',
      isDeployed: false,
      technique,
      avBypassRate: '100% (0 Detections)',
      targetPlatforms: ['Windows Server 2022', 'Ubuntu 24.04 LTS'],
      mutationHash: randomHash,
      description: description.trim() || 'Custom JOCKY forensic extraction routine.',
    })

    setName('')
    setVersion('v1.0.0')
    setScriptCode('')
    setDescription('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stage New JOCKY Polymorphic Script"
      description="Inject an AV-evading forensic routine into the continuous CI/CD delivery pipeline."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
              Script Identifier
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. kernel-byovd-probe"
              className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs font-mono text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs placeholder:text-[#656d76] dark:placeholder:text-[#8b949e]"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
              Version Tag
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="v1.0.0"
              className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs font-mono text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs placeholder:text-[#656d76] dark:placeholder:text-[#8b949e]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
            Evasion & Forensics Technique
          </label>
          <select
            value={technique}
            onChange={(e) => setTechnique(e.target.value as EvasionTechnique)}
            className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2.5 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs cursor-pointer"
          >
            <option value="Polymorphic LLVM Mutation">Polymorphic LLVM Mutation</option>
            <option value="BYOVD Callback Subversion">BYOVD Callback Subversion</option>
            <option value="Direct Syscall (SSN)">Direct Syscall (SSN)</option>
            <option value="In-Memory Reflective Injection">In-Memory Reflective Injection</option>
            <option value="Process Hollowing">Process Hollowing</option>
            <option value="API Unhooking (ntdll)">API Unhooking (ntdll)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief summary of artifacts this routine extracts..."
            className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-2 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] shadow-xs placeholder:text-[#656d76] dark:placeholder:text-[#8b949e]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] mb-1">
            Script Definition / JOCKY Intermediate Code
          </label>
          <textarea
            rows={4}
            value={scriptCode}
            onChange={(e) => setScriptCode(e.target.value)}
            placeholder="// JOCKY script definition&#10;routine kernel_probe() {&#10;    unhook_native_syscalls();&#10;    disarm_edr_callbacks();&#10;    emit_telemetry_beacon();&#10;}"
            className="w-full rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#0d1117] px-3 py-2 text-xs font-mono text-[#7ee787] outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] shadow-inner resize-none"
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
            Compile & Stage Script
          </button>
        </div>
      </form>
    </Modal>
  )
}
