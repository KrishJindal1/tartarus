import React from 'react'
import { Filter, ChevronDown } from 'lucide-react'
import { Card, SearchInput, StatusDot, Badge } from '@/components/ui'
import { Endpoint } from '@/types'

interface EndpointHealthTableProps {
  endpoints: Endpoint[]
  totalCount: number
  searchQuery: string
  onSearchChange: (val: string) => void
  selectedEndpoint: string | null
  onSelectEndpoint: (name: string) => void
  onViewAll: () => void
}

export function EndpointHealthTable({
  endpoints,
  totalCount,
  searchQuery,
  onSearchChange,
  selectedEndpoint,
  onSelectEndpoint,
  onViewAll,
}: EndpointHealthTableProps) {
  return (
    <Card aria-labelledby="endpoints-title" className="border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[#d0d7de] dark:border-[#30363d] p-4 sm:flex-row sm:items-center sm:justify-between bg-[#f6f8fa] dark:bg-[#161b22]">
        <div>
          <h3 id="endpoints-title" className="text-sm font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
            Endpoint health
          </h3>
          <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">
            Live response telemetry from your production surface.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchQuery}
            onChangeValue={onSearchChange}
            placeholder="Filter endpoints"
            className="w-36 sm:w-44"
          />
          <button
            className="flex size-8 items-center justify-center rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] cursor-pointer"
            aria-label="Filter"
          >
            <Filter className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-[#d0d7de]/50 dark:divide-[#30363d]">
        {endpoints.map((endpoint) => {
          const isSelected = selectedEndpoint === endpoint.name
          return (
            <button
              type="button"
              key={endpoint.name}
              onClick={() => onSelectEndpoint(endpoint.name)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f6f8fa] dark:hover:bg-[#1f242c] cursor-pointer ${
                isSelected ? 'bg-[#eaeef2] dark:bg-[#21262d]' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                    {endpoint.name}
                  </span>
                  <span className="rounded bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-1.5 py-0.5 font-mono text-[9px] font-medium text-[#1f2328] dark:text-[#8b949e]">
                    {endpoint.method}
                  </span>
                </div>
                <div className="mt-1 truncate font-mono text-[10px] text-[#656d76] dark:text-[#8b949e]">
                  {endpoint.url}
                </div>
                <div className="mt-2 inline-flex">
                  <Badge variant="outline">{endpoint.platform}</Badge>
                </div>
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-[11px] font-mono font-medium text-[#1f2328] dark:text-[#e6edf3]">{endpoint.latency}</div>
                <div className="mt-1 text-[10px] text-[#656d76] dark:text-[#8b949e]">{endpoint.lastRun}</div>
              </div>
              <span
                className={`hidden w-20 text-right text-xs font-semibold sm:block ${
                  endpoint.status === 'Healthy'
                    ? 'text-[#1a7f37] dark:text-[#3fb950]'
                    : endpoint.status === 'Degraded'
                    ? 'text-[#9a6700] dark:text-[#d29922]'
                    : 'text-[#656d76] dark:text-[#8b949e]'
                }`}
              >
                {endpoint.status}
              </span>
              <ChevronDown
                className={`size-3.5 text-[#656d76] dark:text-[#8b949e] transition-transform ${
                  isSelected ? 'rotate-180' : ''
                }`}
              />
            </button>
          )
        })}

        {endpoints.length === 0 && (
          <div className="p-8 text-center text-xs text-[#656d76] dark:text-[#8b949e]">
            No endpoints match your filter query.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[#d0d7de] dark:border-[#30363d] px-4 py-3 bg-[#f6f8fa] dark:bg-[#161b22]">
        <span className="text-[11px] text-[#656d76] dark:text-[#8b949e]">
          Showing {endpoints.length} of {totalCount} endpoints
        </span>
        <button
          type="button"
          onClick={onViewAll}
          className="text-[11px] font-semibold text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition-colors cursor-pointer"
        >
          View all endpoints →
        </button>
      </div>
    </Card>
  )
}
