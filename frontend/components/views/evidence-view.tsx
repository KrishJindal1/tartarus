'use client'

import React, { useState, useMemo } from 'react'
import {
  FileCheck2,
  ArrowDownToLine,
  Tag,
  Eye,
  Search,
  ShieldCheck,
  Binary,
  Lock,
  Copy,
  Check,
  Filter,
  FileCode,
  RotateCcw,
  Layers,
} from 'lucide-react'
import { Card, useToast } from '@/components/ui'
import { DestinationViewShell } from './destination-view-shell'
import { EvidencePreviewModal, EvidenceTagModal } from '@/components/modals'
import { EvidenceItem } from '@/types'

interface EvidenceViewProps {
  evidence: EvidenceItem[]
  onRun: () => void
  onExport: () => void
  onDownloadFile: (fileName: string) => void
}

export function EvidenceView({
  evidence,
  onRun,
  onExport,
  onDownloadFile,
}: EvidenceViewProps) {
  const { toast } = useToast()
  const [selectedPreview, setSelectedPreview] = useState<EvidenceItem | null>(null)
  const [selectedTag, setSelectedTag] = useState<EvidenceItem | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [techniqueFilter, setTechniqueFilter] = useState('ALL')
  const [fileTypeFilter, setFileTypeFilter] = useState('ALL')

  const distinctTechniques = useMemo(() => {
    const set = new Set<string>()
    evidence.forEach((e) => e.technique && set.add(e.technique))
    return Array.from(set).sort()
  }, [evidence])

  const handleDownload = (fileName: string) => {
    onDownloadFile(fileName)
    toast(`Downloaded forensic evidence artifact: ${fileName}`, 'success')
  }

  const handleCopyHash = (hash: string, fileName: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(fileName)
    toast(`Copied SHA-256 integrity hash for ${fileName}`, 'info')
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const handleSaveTags = (fileName: string, tags: string[]) => {
    toast(`Saved ${tags.length} classification tags for "${fileName}"`, 'info')
  }

  const filteredEvidence = useMemo(() => {
    return evidence.filter((file) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        file.fileName.toLowerCase().includes(q) ||
        (file.targetNode?.toLowerCase() || '').includes(q) ||
        (file.technique?.toLowerCase() || '').includes(q) ||
        (file.sha256?.toLowerCase() || '').includes(q)

      const matchesTechnique =
        techniqueFilter === 'ALL' || file.technique === techniqueFilter

      const matchesType =
        fileTypeFilter === 'ALL' ||
        (fileTypeFilter === 'bin' && file.fileName.endsWith('.bin')) ||
        (fileTypeFilter === 'json' && file.fileName.endsWith('.json')) ||
        (fileTypeFilter === 'log' && file.fileName.endsWith('.log')) ||
        (fileTypeFilter === 'csv' && file.fileName.endsWith('.csv'))

      return matchesSearch && matchesTechnique && matchesType
    })
  }, [evidence, search, techniqueFilter, fileTypeFilter])

  const totalBytes = useMemo(() => {
    return evidence.reduce((acc, curr) => {
      if (curr.size.includes('MB')) return acc + parseFloat(curr.size) * 1024 * 1024
      if (curr.size.includes('KB')) return acc + parseFloat(curr.size) * 1024
      return acc
    }, 0)
  }, [evidence])

  const formattedTotalSize = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`

  const buttonClass =
    'rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] px-3 py-1.5 text-xs font-medium text-[#1f2328] dark:text-[#c9d1d9] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer flex-1'

  return (
    <>
      <DestinationViewShell name="Evidence" onRun={onRun} onExport={onExport}>
        <div className="flex flex-col gap-6">
          {/* Top Control & Filter Bar */}
          <Card className="p-4 border-[#d0d7de] dark:border-[#30363d]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                    Forensic Evidence Vault ({filteredEvidence.length} Artifacts · {formattedTotalSize})
                  </h3>
                  <span className="rounded-full bg-[#dafbe1] dark:bg-[#238636]/20 border border-[#4ac26b]/40 dark:border-[#238636]/40 text-[#1a7f37] dark:text-[#3fb950] px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                    <Lock className="size-3" /> AES-256-GCM Sealed
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">
                  Cryptographically verified, tamper-evident forensic memory dumps and telemetry captures.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#656d76] dark:text-[#8b949e]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search artifact name, SHA-256..."
                    className="w-36 sm:w-56 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] pl-8 pr-3 py-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] placeholder:text-[#656d76] dark:placeholder:text-[#8b949e] focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] focus:outline-none"
                  />
                </div>

                {/* Technique Filter */}
                <select
                  value={techniqueFilter}
                  onChange={(e) => setTechniqueFilter(e.target.value)}
                  className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2.5 py-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none cursor-pointer focus:border-[#0969da] dark:focus:border-[#58a6ff]"
                >
                  <option value="ALL">All Techniques</option>
                  {distinctTechniques.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                {/* File Type Filter */}
                <select
                  value={fileTypeFilter}
                  onChange={(e) => setFileTypeFilter(e.target.value)}
                  className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2.5 py-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none cursor-pointer font-mono focus:border-[#0969da] dark:focus:border-[#58a6ff]"
                >
                  <option value="ALL">All File Formats</option>
                  <option value="bin">.bin (Binary Dumps)</option>
                  <option value="json">.json (Telemetry)</option>
                  <option value="log">.log (Syscall Logs)</option>
                  <option value="csv">.csv (Socket Maps)</option>
                </select>

                {(search || techniqueFilter !== 'ALL' || fileTypeFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setTechniqueFilter('ALL')
                      setFileTypeFilter('ALL')
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#656d76] dark:text-[#8b949e] hover:text-[#cf222e] dark:hover:text-[#f85149] hover:bg-[#ffebe9] dark:hover:bg-[#f85149]/10 border border-transparent transition-colors cursor-pointer"
                  >
                    <RotateCcw className="size-3" /> Reset
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Evidence Grid */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvidence.map((file) => {
              const isBin = file.fileName.endsWith('.bin')
              const isJson = file.fileName.endsWith('.json')
              const isLog = file.fileName.endsWith('.log')

              return (
                <Card
                  key={file.fileName}
                  className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22]"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${
                        isBin
                          ? 'bg-[#fbefff] dark:bg-[#8250df]/20 text-[#8250df] dark:text-[#d2a8ff] border-[#d8b9ff]/60 dark:border-[#8250df]/40'
                          : isJson
                          ? 'bg-[#ddf4ff] dark:bg-[#388bfd]/15 text-[#0969da] dark:text-[#58a6ff] border-[#54aeff]/40 dark:border-[#388bfd]/30'
                          : 'bg-[#dafbe1] dark:bg-[#238636]/20 text-[#1a7f37] dark:text-[#3fb950] border-[#4ac26b]/40 dark:border-[#238636]/40'
                      }`}>
                        {isBin ? <Binary className="size-5" /> : isJson ? <FileCode className="size-5" /> : <FileCheck2 className="size-5" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3
                            className="truncate text-xs sm:text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] font-mono"
                            title={file.fileName}
                          >
                            {file.fileName}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleDownload(file.fileName)}
                            aria-label={`Download ${file.fileName}`}
                            className="text-[#656d76] dark:text-[#8b949e] hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors p-1 cursor-pointer"
                            title="Download artifact"
                          >
                            <ArrowDownToLine className="size-4" />
                          </button>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#656d76] dark:text-[#8b949e]">
                          {file.captureTime} · <span className="font-mono font-semibold text-[#1f2328] dark:text-[#e6edf3]">{file.size}</span>
                        </p>
                      </div>
                    </div>

                    {/* Metadata summary */}
                    <div className="mt-3.5 flex flex-col gap-2 rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117] p-2.5 border border-[#d0d7de] dark:border-[#30363d] text-[11px]">
                      <div className="flex items-center justify-between text-[#656d76] dark:text-[#8b949e]">
                        <span className="font-semibold">Target Node:</span>
                        <span className="font-mono text-[#1f2328] dark:text-[#e6edf3] truncate max-w-[170px]">{file.targetNode}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#656d76] dark:text-[#8b949e]">Technique:</span>
                        <span className="rounded bg-[#fbefff] dark:bg-[#8250df]/20 border border-[#d8b9ff]/60 dark:border-[#8250df]/40 px-1.5 py-0.2 text-[10px] font-mono text-[#8250df] dark:text-[#d2a8ff] font-semibold">
                          {file.technique}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#656d76] dark:text-[#8b949e]">AV Evasion:</span>
                        <span className="text-[#1a7f37] dark:text-[#3fb950] font-bold flex items-center gap-1">
                          <ShieldCheck className="size-3.5" />
                          {file.avDetectionScore}
                        </span>
                      </div>
                    </div>

                    {/* SHA-256 Hash */}
                    <div className="mt-3 flex items-center justify-between gap-1 text-[10px] font-mono text-[#656d76] dark:text-[#8b949e] bg-white dark:bg-[#0d1117] p-2 rounded border border-[#d0d7de] dark:border-[#30363d]">
                      <span className="truncate" title={file.sha256}>
                        SHA-256: {file.sha256?.slice(0, 18)}…{file.sha256?.slice(-8)}
                      </span>
                      <button
                        type="button"
                        onClick={() => file.sha256 && handleCopyHash(file.sha256, file.fileName)}
                        className="text-[#656d76] dark:text-[#8b949e] hover:text-[#0969da] dark:hover:text-[#58a6ff] p-0.5 cursor-pointer shrink-0"
                        title="Copy full SHA-256 hash"
                      >
                        {copiedHash === file.fileName ? (
                          <Check className="size-3 text-[#1a7f37] dark:text-[#3fb950]" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2 pt-3 border-t border-[#d0d7de] dark:border-[#30363d]">
                    <button
                      type="button"
                      onClick={() => setSelectedPreview(file)}
                      className={buttonClass}
                    >
                      <Eye className="size-3.5 text-[#656d76] dark:text-[#8b949e]" /> Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTag(file)}
                      className={buttonClass}
                    >
                      <Binary className="size-3.5 text-[#0969da] dark:text-[#58a6ff]" /> Deep Analysis
                    </button>
                  </div>
                </Card>
              )
            })}

            {filteredEvidence.length === 0 && (
              <div className="col-span-full p-12 text-center text-xs text-slate-500 dark:text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Filter className="size-6 text-slate-400" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No evidence files match the current filter selection.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </DestinationViewShell>

      <EvidencePreviewModal
        evidence={selectedPreview}
        isOpen={!!selectedPreview}
        onClose={() => setSelectedPreview(null)}
      />

      <EvidenceTagModal
        evidence={selectedTag}
        isOpen={!!selectedTag}
        onClose={() => setSelectedTag(null)}
        onSaveTags={handleSaveTags}
      />
    </>
  )
}
