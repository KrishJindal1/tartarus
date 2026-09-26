'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui'
import { EvidenceItem } from '@/types'
import { ShieldCheck, Binary, Search, Terminal, Copy, Check, FileText } from 'lucide-react'

interface EvidenceTagModalProps {
  evidence: EvidenceItem | null
  isOpen: boolean
  onClose: () => void
  onSaveTags?: (fileName: string, tags: string[]) => void
}

const mockHexView: Record<string, string> = {
  'kernel_callback_table_dump.bin': `00000000  4d 5a 90 00 03 00 00 00  04 00 00 00 ff ff 00 00  |MZ..............|
00000010  b8 00 00 00 00 00 00 00  40 00 00 00 00 00 00 00  |........@.......|
00000020  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|
00000030  00 00 00 00 00 00 00 00  00 00 00 00 80 00 00 00  |................|
00000040  0e 1f ba 0e 00 b4 09 cd  21 b8 01 4c cd 21 54 68  |........!..L.!Th|
00000050  69 73 20 70 72 6f 67 72  61 6d 20 63 61 6e 6e 6f  |is program canno|
00000060  74 20 62 65 20 72 75 6e  20 69 6e 20 44 4f 53 20  |t be run in DOS |
00000070  6d 6f 64 65 2e 0d 0d 0a  24 00 00 00 00 00 00 00  |mode....$.......|`,
  'default': `00000000  7b 0a 20 20 22 74 61 72  67 65 74 22 3a 20 22 75  |{.  "target": "u|
00000010  73 2d 65 61 73 74 2d 70  72 6f 64 2d 30 32 22 2c  |s-east-prod-02",|
00000020  0a 20 20 22 65 76 65 6e  74 22 3a 20 22 49 4e 5f  |.  "event": "IN_|
00000030  4d 45 4d 4f 52 59 5f 53  43 41 4e 22 2c 0a 20 20  |MEMORY_SCAN",.  |
00000040  22 66 69 6e 64 69 6e 67  73 22 3a 20 31 34 0a 7d  |"findings": 14.}|`,
}

export function EvidenceAnalyzeModal({
  evidence,
  isOpen,
  onClose,
}: EvidenceTagModalProps) {
  const [activeTab, setActiveTab] = useState<'iocs' | 'hex' | 'json'>('iocs')
  const [copied, setCopied] = useState(false)

  if (!evidence) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(evidence, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hexContent = mockHexView[evidence.fileName] || mockHexView['default']

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Forensic Analysis: ${evidence.fileName}`}
      description="Deep forensic artifact analysis, IOC decomposition, and memory inspection."
      maxWidth="xl"
    >
      <div className="flex flex-col gap-4">
        {/* Forensic Metadata Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] p-2.5">
            <span className="text-[10px] text-[#656d76] dark:text-[#8b949e] uppercase font-bold block">Target Host</span>
            <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] truncate block mt-0.5">{evidence.targetNode}</span>
          </div>
          <div className="rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] p-2.5">
            <span className="text-[10px] text-[#656d76] dark:text-[#8b949e] uppercase font-bold block">Size</span>
            <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] block mt-0.5">{evidence.size}</span>
          </div>
          <div className="rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] p-2.5">
            <span className="text-[10px] text-[#656d76] dark:text-[#8b949e] uppercase font-bold block">AV Evasion</span>
            <span className="font-semibold text-[#1a7f37] dark:text-[#3fb950] block mt-0.5">{evidence.avDetectionScore}</span>
          </div>
          <div className="rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] p-2.5">
            <span className="text-[10px] text-[#656d76] dark:text-[#8b949e] uppercase font-bold block">Technique</span>
            <span className="font-semibold text-[#8250df] dark:text-[#d2a8ff] truncate block mt-0.5">{evidence.technique}</span>
          </div>
        </div>

        {/* Analyzer Tool Switcher */}
        <div className="flex items-center gap-1.5 bg-[#f6f8fa] dark:bg-[#0d1117] p-1 rounded-md text-xs border border-[#d0d7de] dark:border-[#30363d]">
          <button
            type="button"
            onClick={() => setActiveTab('iocs')}
            className={`px-3 py-1 rounded font-semibold transition-colors cursor-pointer ${
              activeTab === 'iocs'
                ? 'bg-[#1f883d] dark:bg-[#238636] text-white shadow-xs'
                : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
            }`}
          >
            Extracted IOCs & Symbols
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hex')}
            className={`px-3 py-1 rounded font-semibold transition-colors cursor-pointer ${
              activeTab === 'hex'
                ? 'bg-[#1f883d] dark:bg-[#238636] text-white shadow-xs'
                : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
            }`}
          >
            Hex & Byte Disassembler
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`px-3 py-1 rounded font-semibold transition-colors cursor-pointer ${
              activeTab === 'json'
                ? 'bg-[#1f883d] dark:bg-[#238636] text-white shadow-xs'
                : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
            }`}
          >
            JSON Telemetry Tree
          </button>
        </div>

        {/* Content Views */}
        {activeTab === 'iocs' && (
          <div className="rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-3 divide-y divide-[#d0d7de]/60 dark:divide-[#30363d] text-xs">
            <div className="pb-2">
              <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc] block mb-1">Volatile In-Memory Indicators</span>
              <p className="text-[#656d76] dark:text-[#8b949e] text-[11px]">Identified unbacked memory segments, hooked kernel callbacks, and unhooked DLL routines.</p>
            </div>
            <div className="py-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2 rounded bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de]/80 dark:border-[#30363d] font-mono text-[11px]">
                <span className="text-[#656d76] dark:text-[#8b949e] block text-[10px] uppercase">Memory Region:</span>
                <span className="text-[#0969da] dark:text-[#58a6ff] font-bold">0x00007FF7B4000000 - 0x00007FF7B4020000</span>
              </div>
              <div className="p-2 rounded bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de]/80 dark:border-[#30363d] font-mono text-[11px]">
                <span className="text-[#656d76] dark:text-[#8b949e] block text-[10px] uppercase">Alloc Protection:</span>
                <span className="text-[#1a7f37] dark:text-[#3fb950] font-bold">PAGE_EXECUTE_READWRITE</span>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between text-[11px] text-[#656d76] dark:text-[#8b949e]">
              <span>Integrity: Zero disk traces detected</span>
              <span className="text-[#1a7f37] dark:text-[#3fb950] font-semibold">Verified by Go Engine</span>
            </div>
          </div>
        )}

        {activeTab === 'hex' && (
          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3 font-mono text-[11px] text-[#7ee787] max-h-56 overflow-y-auto leading-relaxed shadow-inner">
            <pre>{hexContent}</pre>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3 font-mono text-[11px] text-[#7ee787] max-h-56 overflow-y-auto leading-relaxed shadow-inner">
            <pre>{JSON.stringify(evidence, null, 2)}</pre>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-[#d0d7de] dark:border-[#30363d]">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] px-3 py-1.5 text-xs font-medium text-[#1f2328] dark:text-[#c9d1d9] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors shadow-2xs cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-[#1a7f37] dark:text-[#3fb950]" /> : <Copy className="size-3.5 text-[#656d76] dark:text-[#8b949e]" />}
            {copied ? 'Copied Telemetry' : 'Copy JSON'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Backward-compatible alias
export const EvidenceTagModal = EvidenceAnalyzeModal

