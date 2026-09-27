'use client'

import React, { use } from 'react'
import { ScriptIde } from '@/components/ide/script-ide'

export default function EditScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-[#1f2328] dark:text-[#f0f6fc]">Script IDE</h1>
        <p className="text-xs text-[#656d76] dark:text-[#8b949e]">
          Edit, compile and run this script. IR is re-generated on every compile (polymorphic).
        </p>
      </div>
      <ScriptIde scriptId={id} />
    </div>
  )
}
