'use client'

import React, { useCallback, useMemo, useRef } from 'react'

// JOCKEY keyword / builtin vocabulary (must match compiler/grammar.py)
const KEYWORDS = new Set(['fn', 'let', 'output', 'log', 'if', 'else'])
const LITERALS = new Set(['true', 'false'])
const BUILTINS = new Set([
  'collect_processes',
  'collect_network',
  'collect_files',
  'collect_logons',
  'collect_system',
  'dump_memory',
  'dump_registry',
  'analyze_persistence',
  'scan_byovd',
  'exec_direct_syscall',
  'exec_hollow',
  'encrypt',
  'log',
  'system.info',
])

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function highlightLine(line: string): string {
  let out = ''
  let i = 0
  while (i < line.length) {
    const ch = line[i]

    // comment: # to end of line
    if (ch === '#') {
      out += `<span class="tok-comment">${escapeHtml(line.slice(i))}</span>`
      return out
    }

    // string literal
    if (ch === '"' || ch === "'") {
      let j = i + 1
      while (j < line.length) {
        if (line[j] === '\\') {
          j += 2
          continue
        }
        if (line[j] === ch) {
          j++
          break
        }
        j++
      }
      out += `<span class="tok-str">${escapeHtml(line.slice(i, j))}</span>`
      i = j
      continue
    }

    // identifier / keyword / builtin (allow dotted names like system.info)
    if (/[A-Za-z_]/.test(ch)) {
      let j = i
      while (j < line.length && /[A-Za-z0-9_.]/.test(line[j])) j++
      const word = line.slice(i, j)
      if (KEYWORDS.has(word)) out += `<span class="tok-kw">${word}</span>`
      else if (LITERALS.has(word)) out += `<span class="tok-bool">${word}</span>`
      else if (BUILTINS.has(word)) out += `<span class="tok-fn">${word}</span>`
      else out += `<span class="tok-fn">${word}</span>`
      i = j
      continue
    }

    // number
    if (/[0-9]/.test(ch)) {
      let j = i
      while (j < line.length && /[0-9]/.test(line[j])) j++
      out += `<span class="tok-num">${line.slice(i, j)}</span>`
      i = j
      continue
    }

    // punctuation
    if (/[{}()[\],;:=+\-*/%<>!&|]/.test(ch)) {
      out += `<span class="tok-punct">${escapeHtml(ch)}</span>`
      i++
      continue
    }

    out += escapeHtml(ch)
    i++
  }
  return out
}

export function highlightJockey(source: string): string {
  return source.split('\n').map(highlightLine).join('\n')
}

interface JockeyEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  minHeight?: number
}

export function JockeyEditor({
  value,
  onChange,
  readOnly = false,
  minHeight = 420,
}: JockeyEditorProps) {
  const preRef = useRef<HTMLPreElement>(null)
  const gutterRef = useRef<HTMLPreElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const lines = useMemo(() => value.split('\n'), [value])
  const html = useMemo(() => highlightJockey(value) + '\n', [value])

  const handleScroll = useCallback(() => {
    const ta = textareaRef.current
    const pre = preRef.current
    const gutter = gutterRef.current
    if (ta && pre) {
      pre.scrollTop = ta.scrollTop
      pre.scrollLeft = ta.scrollLeft
    }
    if (ta && gutter) {
      gutter.scrollTop = ta.scrollTop
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!onChange) return
      if (e.key === 'Tab') {
        e.preventDefault()
        const ta = e.currentTarget
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const next = `${value.slice(0, start)}  ${value.slice(end)}`
        onChange(next)
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2
        })
        return
      }
      if (e.key === 'Enter') {
        // keep indentation of current line
        const ta = e.currentTarget
        const start = ta.selectionStart
        const lineStart = value.lastIndexOf('\n', start - 1) + 1
        const indentMatch = /^[ \t]*/.exec(value.slice(lineStart))
        const indent = indentMatch ? indentMatch[0] : ''
        if (indent) {
          e.preventDefault()
          const next = `${value.slice(0, start)}\n${indent}${value.slice(ta.selectionEnd)}`
          onChange(next)
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start + 1 + indent.length
          })
        }
      }
    },
    [value, onChange]
  )

  const gutter = useMemo(
    () => lines.map((_, i) => String(i + 1)).join('\n'),
    [lines]
  )

  const shared =
    'm-0 box-border border-0 p-3 pl-12 text-[13px] leading-[20px] font-mono whitespace-pre overflow-auto ' +
    'tab-size-2 selection:bg-teal-500/30'

  return (
    <div
      className="relative overflow-hidden rounded-b-xl bg-white dark:bg-[#0C0E11]"
      style={{ height: minHeight }}
    >
      {/* line-number gutter */}
      <pre
        ref={gutterRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 m-0 overflow-hidden border-r border-[#d0d7de] dark:border-[#24282F] bg-[#f6f8fa] dark:bg-[#14181E] p-3 pr-2 text-right text-[13px] leading-[20px] font-mono text-[#8b949e] select-none w-11"
      >
        {gutter}
      </pre>

      {/* highlighted layer */}
      <pre
        ref={preRef}
        aria-hidden="true"
        className={`${shared} pointer-events-none absolute inset-0 text-[#1f2328] dark:text-[#e6edf3]`}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* input layer */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className={`jockey-editor-ta absolute inset-0 z-20 resize-none bg-transparent text-transparent caret-[#12A594] dark:caret-[#2DD4BF] outline-none ${shared}`}
        style={{ height: minHeight }}
        aria-label="Tartarus script source"
      />
    </div>
  )
}
