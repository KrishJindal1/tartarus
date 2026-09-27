'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-lg border p-3.5 shadow-xl text-xs font-medium transition-all animate-in slide-in-from-bottom-5 ${
              item.type === 'success'
                ? 'border-[#4ADE9E]/50 bg-[#DDF7EC] text-[#0F766E] dark:border-[#4ADE9E]/60 dark:bg-[#14181E] dark:text-[#4ADE9E]'
                : item.type === 'error'
                ? 'border-[#FF8A7A]/50 bg-[#FDE8E4] text-[#D64936] dark:border-[#F0654E]/60 dark:bg-[#14181E] dark:text-[#F0654E]'
                : 'border-[#d0d7de] bg-white text-[#1f2328] dark:border-[#24282F] dark:bg-[#14181E] dark:text-[#e6edf3]'
            }`}
          >
            {item.type === 'success' && <CheckCircle2 className="size-4 text-[#0F766E] dark:text-[#4ADE9E] shrink-0" />}
            {item.type === 'error' && <AlertCircle className="size-4 text-[#D64936] dark:text-[#F0654E] shrink-0" />}
            {item.type === 'info' && <Info className="size-4 text-[#0F766E] dark:text-[#2DD4BF] shrink-0" />}
            <span className="flex-1 leading-snug">{item.message}</span>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    return { toast: (msg: string) => console.log(msg) }
  }
  return context
}
