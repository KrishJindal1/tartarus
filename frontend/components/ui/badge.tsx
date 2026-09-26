import React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'subtle' | 'success' | 'warning'
}

export function Badge({
  className = '',
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-[#eaeef2] dark:bg-[#21262d] text-[#1f2328] dark:text-[#e6edf3] border-transparent',
    outline: 'border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] text-[#656d76] dark:text-[#8b949e]',
    subtle: 'bg-[#ddf4ff] dark:bg-[#388bfd]/15 text-[#0969da] dark:text-[#58a6ff] border border-[#54aeff]/40 dark:border-[#388bfd]/30',
    success: 'bg-[#dafbe1] dark:bg-[#238636]/20 text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b]/40 dark:border-[#238636]/40',
    warning: 'bg-[#fff8c5] dark:bg-[#d29922]/15 text-[#9a6700] dark:text-[#d29922] border border-[#d4a72c]/40 dark:border-[#d29922]/30',
  }[variant]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
