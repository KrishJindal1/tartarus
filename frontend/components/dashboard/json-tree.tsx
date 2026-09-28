'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface JsonTreeProps {
  data: unknown
  /** Nodes deeper than this start collapsed (default 3). */
  defaultExpandedDepth?: number
  className?: string
}

const MAX_RENDERED = 100

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function primitiveText(v: unknown): { text: string; cls: string } {
  if (v === null) return { text: 'null', cls: 'text-[#8b949e] italic' }
  switch (typeof v) {
    case 'string':
      return { text: `"${v}"`, cls: 'text-[#4ADE9E]' }
    case 'number':
      return { text: String(v), cls: 'text-[#79C0FF]' }
    case 'boolean':
      return { text: String(v), cls: 'text-[#D2A8FF]' }
    default:
      return { text: String(v), cls: 'text-[#8b949e]' }
  }
}

function Branch({
  label,
  value,
  depth,
  defaultExpandedDepth,
  bracketOpen,
  bracketClose,
}: {
  label?: string
  value: Record<string, unknown> | unknown[]
  depth: number
  defaultExpandedDepth: number
  bracketOpen: string
  bracketClose: string
}) {
  const isArray = Array.isArray(value)
  const fullEntries: Array<[string, unknown]> = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v])
    : Object.entries(value as Record<string, unknown>)
  const total = fullEntries.length
  const entries = fullEntries.slice(0, MAX_RENDERED)
  const [open, setOpen] = useState(depth < defaultExpandedDepth)

  const head = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="group inline-flex items-center gap-1 font-mono hover:bg-[#1B1F26] rounded px-0.5 -mx-0.5 cursor-pointer"
    >
      {open ? (
        <ChevronDown className="size-3 shrink-0 text-[#8b949e]" />
      ) : (
        <ChevronRight className="size-3 shrink-0 text-[#8b949e]" />
      )}
      {label !== undefined && <span className="text-[#79C0FF]">{label}</span>}
      {label !== undefined && <span className="text-[#8b949e]">:</span>}
      <span className="text-[#FFAB70]">{bracketOpen}</span>
      {!open && (
        <>
          <span className="text-[#8b949e] text-[10px]">
            {total} {isArray ? (total === 1 ? 'item' : 'items') : total === 1 ? 'key' : 'keys'}
          </span>
          <span className="text-[#FFAB70]">{bracketClose}</span>
        </>
      )}
    </button>
  )

  if (!open) return <div className="leading-5">{head}</div>

  return (
    <div className="leading-5">
      {head}
      <div className="ml-4 border-l border-[#24282F] pl-2">
        {entries.map(([k, v]) => (
          <Node key={k} label={isArray ? k : k} value={v} depth={depth + 1} defaultExpandedDepth={defaultExpandedDepth} />
        ))}
        {!isArray && total > entries.length && (
          <div className="text-[10px] text-[#8b949e] italic">… {total - entries.length} more keys</div>
        )}
        {isArray && (value as unknown[]).length > entries.length && (
          <div className="text-[10px] text-[#8b949e] italic">
            … {(value as unknown[]).length - entries.length} more items
          </div>
        )}
      </div>
      <div className="leading-5">
        <span className="text-[#FFAB70]">{bracketClose}</span>
      </div>
    </div>
  )
}

function Node({
  label,
  value,
  depth,
  defaultExpandedDepth,
}: {
  label: string
  value: unknown
  depth: number
  defaultExpandedDepth: number
}) {
  if (Array.isArray(value) || isPlainObject(value)) {
    const isArray = Array.isArray(value)
    const empty = isArray ? (value as unknown[]).length === 0 : Object.keys(value as object).length === 0
    if (empty) {
      return (
        <div className="leading-5 break-all">
          <span className="text-[#79C0FF]">{label}</span>
          <span className="text-[#8b949e]">: </span>
          <span className="text-[#FFAB70]">{isArray ? '[]' : '{}'}</span>
        </div>
      )
    }
    return (
      <div className="leading-5 break-all">
        <span className="text-[#79C0FF]">{label}</span>
        <span className="text-[#8b949e]">: </span>
        <Branch
          value={value}
          depth={depth}
          defaultExpandedDepth={defaultExpandedDepth}
          bracketOpen={isArray ? '[' : '{'}
          bracketClose={isArray ? ']' : '}'}
        />
      </div>
    )
  }
  const p = primitiveText(value)
  return (
    <div className="leading-5 break-all">
      <span className="text-[#79C0FF]">{label}</span>
      <span className="text-[#8b949e]">: </span>
      <span className={p.cls}>{p.text}</span>
    </div>
  )
}

export function JsonTree({ data, defaultExpandedDepth = 3, className }: JsonTreeProps) {
  if (isPlainObject(data) || Array.isArray(data)) {
    return (
      <div className={`font-mono text-[11px] ${className ?? ''}`}>
        <Branch
          value={data}
          depth={0}
          defaultExpandedDepth={defaultExpandedDepth}
          bracketOpen={Array.isArray(data) ? '[' : '{'}
          bracketClose={Array.isArray(data) ? ']' : '}'}
        />
      </div>
    )
  }
  const p = primitiveText(data)
  return <span className={`font-mono text-[11px] ${className ?? ''} ${p.cls}`}>{p.text}</span>
}
