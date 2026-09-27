'use client'

import React, { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useToast } from '@/components/ui'

interface ThemeToggleProps {
  className?: string
  compact?: boolean
}

export function ThemeToggle({ className = '', compact = false }: ThemeToggleProps) {
  const { toast } = useToast()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('jocky-theme') as 'dark' | 'light' | null
    if (saved) {
      setTheme(saved)
      if (saved === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
      }
    } else {
      // Default to dark theme for cyber forensic operations
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
      setTheme('dark')
    }
  }, [])

  const toggleTheme = (nextTheme?: 'dark' | 'light') => {
    const target = nextTheme || (theme === 'dark' ? 'light' : 'dark')
    setTheme(target)
    localStorage.setItem('jocky-theme', target)

    if (target === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
      toast('Switched to Dark Cyber-Forensic Theme', 'info')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      toast('Switched to Light Operational Theme', 'info')
    }
  }

  if (!mounted) {
    return (
      <div className={`h-8 w-20 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse ${className}`} />
    )
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => toggleTheme()}
        className={`flex size-8 items-center justify-center rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#1B1F26] text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#24282F] transition-colors shadow-2xs cursor-pointer ${className}`}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Toggle ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      >
        {theme === 'dark' ? (
          <Sun className="size-4 text-[#e3b341]" />
        ) : (
          <Moon className="size-4 text-[#0F766E]" />
        )}
      </button>
    )
  }

  return (
    <div
      className={`flex items-center gap-1 rounded-lg border border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#0C0E11] p-1 text-xs ${className}`}
    >
      <button
        type="button"
        onClick={() => toggleTheme('light')}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-white text-[#1f2328] shadow-xs border border-[#d0d7de]'
            : 'text-[#656d76] hover:text-[#1f2328] dark:text-[#8b949e] dark:hover:text-[#f0f6fc]'
        }`}
      >
        <Sun className={`size-3.5 ${theme === 'light' ? 'text-[#96690F]' : ''}`} />
        <span>Light</span>
      </button>

      <button
        type="button"
        onClick={() => toggleTheme('dark')}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-all cursor-pointer ${
          theme === 'dark'
            ? 'bg-[#1B1F26] text-[#f0f6fc] shadow-xs border border-[#24282F]'
            : 'text-[#656d76] hover:text-[#1f2328] dark:text-[#8b949e] dark:hover:text-[#f0f6fc]'
        }`}
      >
        <Moon className={`size-3.5 ${theme === 'dark' ? 'text-[#2DD4BF]' : ''}`} />
        <span>Dark</span>
      </button>
    </div>
  )
}
