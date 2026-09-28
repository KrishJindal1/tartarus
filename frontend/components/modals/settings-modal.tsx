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
  hint: string
  icon: LucideIcon
  defaultOn: boolean
}

const CATEGORIES: Category[] = [
  {
    key: 'jobs',
    label: 'Jobs',
    hint: 'queued / dispatched / completed job records',
    icon: ClipboardList,
    defaultOn: true,
  },
  {
    key: 'evidence',
    label: 'Evidence',
    hint: 'collected artifacts, hashes, risk rows',
    icon: Fingerprint,
    defaultOn: true,
  },
  {
    key: 'reports',
    label: 'Reports',
    hint: 'report-generating jobs + their artifacts',
    icon: FileText,
    defaultOn: true,
  },
  {
    key: 'results',
    label: 'Agent results',
    hint: 'raw submissions from endpoints',
    icon: Terminal,
    defaultOn: true,
  },
  {
    key: 'audit',
    label: 'Audit log',
    hint: 'console & API action history',
    icon: ScrollText,
    defaultOn: false,
  },
]

const ARM_MS = 5000

function fmt(n: number | undefined): string | null {
  return n === undefined || n === null ? null : n.toLocaleString()
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e]">
      {children}
    </div>
  )
}

function MiniButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] px-2 py-1 text-[10px] font-bold text-[#656d76] dark:text-[#8b949e] hover:border-[#12A594]/50 hover:text-[#1f2328] dark:hover:border-[#2DD4BF]/40 dark:hover:text-[#f0f6fc] transition-colors"
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
      toast(`Cleared ${detail || 'nothing (already empty)'}.`, 'success')
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
      description="Console preferences & maintenance — appearance and the data generated by the platform."
      maxWidth="xl"
    >
      <div className="flex flex-col gap-5 text-xs">
        {/* Appearance */}
        <section className="flex flex-col gap-2">
          <SectionLabel>Appearance</SectionLabel>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] px-3.5 py-2.5">
            <div className="min-w-0">
              <div className="font-bold text-[#1f2328] dark:text-[#e6edf3]">Theme</div>
              <div className="text-[10px] leading-snug text-[#8b949e]">
                Dark forensic console or light operational view — remembered in this browser.
              </div>
            </div>
            <ThemeToggle className="shrink-0" />
          </div>
        </section>

        {/* Data management */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <SectionLabel>Data management</SectionLabel>
              <p className="mt-1 text-[11px] leading-snug text-[#656d76] dark:text-[#8b949e]">
                Clear generated records and findings. Endpoint agents, JOCKY scripts, users and
                the database schema are never touched.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <MiniButton onClick={selectAll}>All</MiniButton>
              <MiniButton onClick={selectNone}>None</MiniButton>
              <MiniButton onClick={selectDefault}>
                <RotateCcw className="size-3" /> Reset
              </MiniButton>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {CATEGORIES.map((opt) => {
              const on = !!selected[opt.key]
              const Icon = opt.icon
              const count = countFor(opt.key)
              return (
                <label
                  key={opt.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                    on
                      ? 'border-[#12A594]/60 bg-[#12A594]/[0.06] dark:border-[#2DD4BF]/40 dark:bg-[#2DD4BF]/[0.06]'
                      : 'border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] hover:border-[#12A594]/50 dark:hover:border-[#2DD4BF]/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => setSelected((s) => ({ ...s, [opt.key]: e.target.checked }))}
                    className="peer sr-only"
                  />
                  <span className="flex size-4 shrink-0 items-center justify-center rounded border border-[#d0d7de] dark:border-[#30363D] bg-white dark:bg-[#14181E] transition-colors peer-checked:border-[#12A594] peer-checked:bg-[#12A594] peer-focus-visible:ring-2 peer-focus-visible:ring-[#12A594]/50 dark:peer-checked:border-[#2DD4BF] dark:peer-checked:bg-[#0E9384]">
                    {on && <Check className="size-3 text-white" />}
                  </span>
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                      on
                        ? 'bg-[#12A594]/15 text-[#0F766E] dark:text-[#2DD4BF]'
                        : 'bg-[#eff1f3] text-[#656d76] dark:bg-[#1B1F26] dark:text-[#8b949e]'
                    }`}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-[#1f2328] dark:text-[#e6edf3]">
                      {opt.label}
                    </span>
                    <span className="block text-[10px] text-[#8b949e]">{opt.hint}</span>
                  </span>
                  {count !== undefined && (
                    <span className="shrink-0 rounded border border-[#d0d7de]/70 dark:border-[#24282F] bg-[#eff1f3] dark:bg-[#1B1F26] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#656d76] dark:text-[#8b949e]">
                      {fmt(count)} rows
                    </span>
                  )}
                </label>
              )
            })}
          </div>

          {/* Summary strip */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] px-3 py-2">
            <span className="text-[11px] text-[#656d76] dark:text-[#8b949e]">
              <strong className="text-[#1f2328] dark:text-[#e6edf3]">{picked.length}</strong> of{' '}
              {CATEGORIES.length} categories selected
            </span>
            <span className="font-mono text-[11px] font-semibold text-[#1f2328] dark:text-[#e6edf3]">
              {stats ? '' : '≈'}
              {fmt(pickedRows) ?? '—'} rows to delete
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-[#656d76] dark:text-[#8b949e]">
            <ShieldCheck className="size-3.5 shrink-0 text-[#12A594] dark:text-[#2DD4BF]" />
            Always kept: agents · JOCKY scripts · users · schema
          </div>
        </section>

        {/* Danger zone */}
        <section className="flex flex-col gap-2.5 rounded-lg border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 p-3.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-[#CF222E] dark:text-[#FF8A7A]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#CF222E] dark:text-[#FF8A7A]">
              Danger zone
            </span>
          </div>
          <p className="text-[11px] leading-snug text-[#CF222E] dark:text-[#FF8A7A]/90">
            The selected tables are emptied immediately and cannot be restored.
          </p>

          {/* Recap chips */}
          <div className="flex flex-wrap gap-1.5">
            {picked.map((p) => {
              const Icon = p.icon
              const n = countFor(p.key)
              return (
                <span
                  key={p.key}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-300/70 dark:border-rose-500/40 bg-white/70 dark:bg-[#14181E]/70 px-2 py-0.5 text-[10px] font-semibold text-[#CF222E] dark:text-[#FF8A7A]"
                >
                  <Icon className="size-3" />
                  {p.label}
                  {n !== undefined && (
                    <span className="font-mono text-[#656d76] dark:text-[#8b949e]">· {fmt(n)}</span>
                  )}
                </span>
              )
            })}
            {picked.length === 0 && (
              <span className="text-[10px] font-semibold text-[#CF222E]/70 dark:text-[#FF8A7A]/70">
                Nothing selected
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-0.5">
            {armed && (
              <span className="mr-auto text-[10px] font-bold text-[#CF222E] dark:text-[#FF8A7A]">
                Click again within 5 s to confirm
              </span>
            )}
            {armed && (
              <button
                type="button"
                onClick={() => setArmed(false)}
                className="cursor-pointer rounded-md border border-rose-300 dark:border-rose-500/40 px-3 py-2 text-[11px] font-bold text-[#CF222E] dark:text-[#FF8A7A] hover:bg-white dark:hover:bg-[#14181E] transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={onClearClick}
              disabled={busy}
              className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[11px] font-bold text-white transition-colors shadow-2xs disabled:opacity-50 ${
                armed
                  ? 'bg-[#A40E26] dark:bg-[#F85149] hover:bg-[#8B0A1F] dark:hover:bg-[#FF6A5B]'
                  : 'bg-[#CF222E] dark:bg-[#DA3633] hover:bg-[#A40E26] dark:hover:bg-[#F85149]'
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
                ? 'Yes — permanently delete'
                : `Clear selected data (${picked.length})`}
            </button>
          </div>
        </section>
      </div>
    </Modal>
  )
}
