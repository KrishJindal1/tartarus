'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TablePaginationProps {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPage: (page: number) => void
  note?: string
}

export function TablePagination({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
  note,
}: TablePaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const btn =
    'inline-flex size-7 items-center justify-center rounded-md border border-[#d0d7de] dark:border-[#24282F] bg-white dark:bg-[#14181E] text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#1B1F26] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#d0d7de] dark:border-[#24282F] px-4 py-2.5 text-[11px] text-[#656d76] dark:text-[#8b949e]">
      <div className="flex items-center gap-2">
        <span className="tabular-nums">
          Showing {from}–{to} of {total}
        </span>
        {note && (
          <>
            <span className="opacity-40">·</span>
            <span className="hidden sm:inline">{note}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={btn}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
          title="Previous page"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <span className="px-1 tabular-nums">
          Page <b className="text-[#1f2328] dark:text-[#f0f6fc]">{page}</b> / {pageCount}
        </span>
        <button
          type="button"
          className={btn}
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
          title="Next page"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
