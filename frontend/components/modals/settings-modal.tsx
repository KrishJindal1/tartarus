'use client'

import React, { useEffect, useState } from 'react'
import { Modal, ThemeToggle, useToast } from '@/components/ui'
import { api, type AdminDataStats } from '@/lib/api'
import { useDashboard } from '@/providers/dashboard-provider'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Fingerprint,
  FileText,
  Loader2,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  Terminal,
  Trash2,
} from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type CategoryKey = 'jobs' | 'evidence' | 'reports' | 'results' | 'audit'

interface Category {
  key: CategoryKey
  label: string
  icon: LucideIcon
  defaultOn: boolean
}

const CATEGORIES: Category[] = [
  { key: 'jobs', label: 'Jobs', icon: ClipboardList, defaultOn: true },
  { key: 'evidence', label: 'Evidence', icon: Fingerprint, defaultOn: true },
  { key: 'reports', label: 'Reports', icon: FileText, defaultOn: true },
  { key: 'results', label: 'Agent Results', icon: Terminal, defaultOn: true },
  { key: 'audit', label: 'Audit Log', icon: ScrollText, defaultOn: false },
]

const ARM_MS = 5000

function fmt(n: number | undefined): string | null {
  return n === undefined || n === null ? null : n.toLocaleString()
}

function MiniButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] px-2 py-1 text-[11px] font-medium text-[#656d76] dark:text-[#8b949e] hover:border-slate-400 dark:hover:border-slate-500 hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition-colors"
    >
      {children}
    </button>
  )
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { toast } = useToast()
  const { refresh, counts } = useDashboard()
  const [selected, setSelected] = useState<Record<CategoryKey, boolean>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.key, c.defaultOn])) as Record<
      CategoryKey,
      boolean
    >,
  )
  const [stats, setStats] = useState<AdminDataStats | null>(null)
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setArmed(false)
    if (!isOpen) return
    let live = true
    api
      .adminDataStats()
      .then((s) => {
        if (live) setStats(s)
      })
      .catch(() => {
        if (live) setStats(null)
      })
    return () => {
      live = false
    }
  }, [isOpen])

  useEffect(() => {
    setArmed(false)
  }, [selected])

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), ARM_MS)
    return () => clearTimeout(t)
  }, [armed])

  const countFor = (key: CategoryKey): number | undefined => {
    if (stats) return stats[key]
    if (key === 'jobs') return counts.jobs
    if (key === 'evidence') return counts.evidence
    if (key === 'reports') return counts.reports
    return undefined
  }

  const picked = CATEGORIES.filter((c) => selected[c.key])
  const pickedRows = picked.reduce((n, c) => n + (countFor(c.key) ?? 0), 0)

  const selectAll = () =>
    setSelected(
      Object.fromEntries(CATEGORIES.map((c) => [c.key, true])) as Record<CategoryKey, boolean>,
    )
  const selectNone = () =>
    setSelected(
      Object.fromEntries(CATEGORIES.map((c) => [c.key, false])) as Record<
        CategoryKey,
        boolean
      >,
    )
  const selectDefault = () =>
    setSelected(
      Object.fromEntries(CATEGORIES.map((c) => [c.key, c.defaultOn])) as Record<
        CategoryKey,
        boolean
      >,
    )

  const handleClear = async () => {
    setBusy(true)
    try {
      const res = await api.adminClearData({
        jobs: selected.jobs,
        evidence: selected.evidence,
        reports: selected.reports,
        results: selected.results,
        audit: selected.audit,
      })
      const detail = Object.entries(res.deleted)
        .map(([k, v]) => `${v} ${k}`)
        .join(', ')
      toast(`Cleared ${detail || 'nothing'}.`, 'success')
      await refresh()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Clear failed', 'error')
    } finally {
      setBusy(false)
      setArmed(false)
    }
  }

  const onClearClick = () => {
    if (picked.length === 0) {
      toast('Select at least one data category to clear.', 'error')
      return
    }
    if (!armed) {
      setArmed(true)
      return
    }
    void handleClear()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      description="Manage console appearance and platform data storage."
      maxWidth="3xl"
    >
      <div className="flex flex-col gap-5 py-1">
        {/* Top Control Bar: Appearance & Quick Select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Theme */}
          <div className="flex items-center justify-between rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] px-4 py-3">
            <div>
              <span className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3]">
                Appearance
              </span>
              <span className="block text-[11px] text-[#656d76] dark:text-[#8b949e]">
                Interface theme
              </span>
            </div>
            <ThemeToggle className="shrink-0" />
          </div>

          {/* Categories Quick Select */}
          <div className="flex items-center justify-between rounded-xl border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] px-4 py-3">
            <div>
              <span className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3]">
                Data Selection
              </span>
              <span className="block text-[11px] text-[#656d76] dark:text-[#8b949e]">
                {picked.length} of {CATEGORIES.length} selected ({fmt(pickedRows) ?? 0} rows)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MiniButton onClick={selectAll}>All</MiniButton>
              <MiniButton onClick={selectNone}>None</MiniButton>
              <MiniButton onClick={selectDefault}>
                <RotateCcw className="size-3" />
              </MiniButton>
            </div>
          </div>
        </div>

        {/* Categories Grid (Horizontal Wide Cards) */}
        <div>
          <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
            Purge Storage Categories
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {CATEGORIES.map((opt) => {
              const on = !!selected[opt.key]
              const Icon = opt.icon
              const count = countFor(opt.key)
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelected((s) => ({ ...s, [opt.key]: !s[opt.key] }))}
                  className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all cursor-pointer min-h-[90px] ${
                    on
                      ? 'border-teal-500/60 dark:border-teal-400/50 bg-teal-500/[0.05] dark:bg-teal-400/[0.06] shadow-2xs'
                      : 'border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span
                      className={`flex size-6 items-center justify-center rounded-md ${
                        on
                          ? 'text-teal-600 dark:text-teal-400'
                          : 'text-[#656d76] dark:text-[#8b949e]'
                      }`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span
                      className={`flex size-4 items-center justify-center rounded border transition-colors ${
                        on
                          ? 'border-teal-600 bg-teal-600 dark:border-teal-400 dark:bg-teal-500 text-white'
                          : 'border-[#d0d7de] dark:border-[#30363D] bg-white dark:bg-[#14181E]'
                      }`}
                    >
                      {on && <Check className="size-3 stroke-[3]" />}
                    </span>
                  </div>

                  <div className="mt-2">
                    <span className="block text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] truncate">
                      {opt.label}
                    </span>
                    <span className="block text-[11px] font-mono text-[#656d76] dark:text-[#8b949e] mt-0.5">
                      {count !== undefined ? `${fmt(count)} rows` : '0 rows'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#d0d7de] dark:border-[#24282F] pt-4">
          <div className="flex items-center gap-2 text-[11px] text-[#656d76] dark:text-[#8b949e]">
            <ShieldCheck className="size-4 shrink-0 text-slate-500 dark:text-slate-400" />
            <span>Core configuration, agents & accounts are preserved</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {armed && (
              <button
                type="button"
                onClick={() => setArmed(false)}
                className="rounded-lg border border-[#d0d7de] dark:border-[#24282F] px-3 py-1.5 text-xs font-medium text-[#656d76] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#1B1F26] hover:text-[#1f2328] dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={onClearClick}
              disabled={busy || picked.length === 0}
              className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed ${
                armed
                  ? 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 animate-pulse'
                  : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
              }`}
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : armed ? (
                <AlertTriangle className="size-3.5" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              {busy
                ? 'Clearing…'
                : armed
                ? `Confirm Delete (${fmt(pickedRows) ?? 0} rows)`
                : `Purge Selected (${picked.length})`}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
