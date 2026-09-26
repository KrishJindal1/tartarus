'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui'
import {
  Search,
  LayoutDashboard,
  Server,
  TerminalSquare,
  Activity,
  BarChart3,
  FolderKanban,
  FileText,
  Clock3,
  Plus,
  Play,
  ArrowDownToLine,
} from 'lucide-react'

interface CommandPaletteModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (viewName: string) => void
  onAction: (actionName: string) => void
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  onNavigate,
  onAction,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else onAction('open-palette')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onAction])

  const actions = [
    { label: 'Go to Overview', icon: LayoutDashboard, action: () => onNavigate('Overview'), category: 'Navigation' },
    { label: 'Go to Endpoints', icon: Server, action: () => onNavigate('Endpoints'), category: 'Navigation' },
    { label: 'Go to Deploy Scripts', icon: TerminalSquare, action: () => onNavigate('Deploy scripts'), category: 'Navigation' },
    { label: 'Go to Live Status', icon: Activity, action: () => onNavigate('Live status'), category: 'Navigation' },
    { label: 'Go to Results', icon: BarChart3, action: () => onNavigate('Results'), category: 'Navigation' },
    { label: 'Go to Evidence', icon: FolderKanban, action: () => onNavigate('Evidence'), category: 'Navigation' },
    { label: 'Go to Reports', icon: FileText, action: () => onNavigate('Reports'), category: 'Navigation' },
    { label: 'Go to Timeline', icon: Clock3, action: () => onNavigate('Timeline'), category: 'Navigation' },
    { label: 'Add new Endpoint', icon: Plus, action: () => onAction('add-endpoint'), category: 'Actions' },
    { label: 'Run Test Suite Now', icon: Play, action: () => onAction('run-suite'), category: 'Actions' },
    { label: 'Export Report Summary', icon: ArrowDownToLine, action: () => onAction('export-json'), category: 'Actions' },
  ]

  const filtered = actions.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (action: () => void) => {
    action()
    setQuery('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Command Palette"
      description="Type a command, action, or navigate to any workspace module."
      maxWidth="lg"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-inner">
          <Search className="size-4 text-slate-500 dark:text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page... (e.g. Endpoints, Run, Export)"
            className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((item) => {
            const Icon = item.icon
            return (
              <button
                type="button"
                key={item.label}
                onClick={() => handleSelect(item.action)}
                className="flex items-center gap-3 p-2.5 rounded-md text-left hover:bg-sky-50 dark:hover:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 transition-colors group cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded bg-slate-100 dark:bg-slate-800 group-hover:bg-sky-100 dark:group-hover:bg-sky-950 text-slate-600 dark:text-slate-400 group-hover:text-sky-800 dark:group-hover:text-sky-400 transition-colors">
                  <Icon className="size-3.5" />
                </div>
                <span className="flex-1 font-medium">{item.label}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{item.category}</span>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching commands found.
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
