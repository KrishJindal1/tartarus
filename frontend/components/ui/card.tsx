import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-2xs text-[#1f2328] dark:text-[#e6edf3] transition-colors duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`flex items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardBody({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`p-4 sm:p-5 ${className}`} {...props}>
      {children}
    </div>
  )
}
