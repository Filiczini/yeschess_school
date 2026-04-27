import type { ReactNode } from 'react'

interface MobilePageLayoutProps {
  children: ReactNode
  header?: ReactNode
  actions?: ReactNode
}

export default function MobilePageLayout({ children, header, actions }: MobilePageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      <div className="max-w-xl mx-auto">
        {(header || actions) && (
          <div className="flex items-center justify-between mb-8">
            {header}
            {actions}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
