import React from 'react'
import { Search } from 'lucide-react'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  onChangeValue: (value: string) => void
  placeholder?: string
}

export function SearchInput({
  value,
  onChangeValue,
  placeholder = 'Search...',
  className = '',
  ...props
}: SearchInputProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-2.5 py-1.5 focus-within:border-[#0969da] dark:focus-within:border-[#58a6ff] focus-within:ring-1 focus-within:ring-[#0969da] dark:focus-within:ring-[#58a6ff] transition-colors ${className}`}
    >
      <Search className="size-3.5 text-[#656d76] dark:text-[#8b949e] shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-xs text-[#1f2328] dark:text-[#e6edf3] outline-none placeholder:text-[#656d76] dark:placeholder:text-[#8b949e]"
        {...props}
      />
    </div>
  )
}
