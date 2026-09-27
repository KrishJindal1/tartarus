'use client'

import React from 'react'
import { ScriptIde } from '@/components/ide/script-ide'

export default function NewScriptPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-[#1f2328] dark:text-[#f0f6fc]">New JOCKEY script</h1>
        <p className="text-xs text-[#656d76] dark:text-[#8b949e]">
          Write, compile (dry-run) and stage a script — then dispatch it to an endpoint for
          in-memory execution. Ctrl+S to save.
        </p>
      </div>
      <ScriptIde />
    </div>
  )
}
