import type { ReactNode } from 'react'

type GlassCardProps = {
  children: ReactNode
  className?: string
}

export default function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white ${className ?? ''}`}>
      {children}
    </div>
  )
}
