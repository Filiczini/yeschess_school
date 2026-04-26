type ErrorMessageProps = {
  error: string | null | undefined
  variant?: 'dark' | 'light' | 'admin' | 'auth'
  className?: string
}

export default function ErrorMessage({ error, variant = 'dark', className }: ErrorMessageProps) {
  if (!error) return null

  const styles: Record<string, string> = {
    dark: 'bg-red-500/10 border-red-500/20 rounded-xl p-3 mb-4 text-sm text-red-300',
    light: 'bg-red-50 border-red-200 rounded-lg p-3 mb-4 text-sm text-red-600',
    admin: 'text-red-600 text-xs flex items-center gap-1.5',
    auth: 'text-red-300 text-sm',
  }

  return (
    <div className={`${styles[variant] ?? styles.dark} ${className ?? ''}`}>
      {variant === 'admin' && (
        <iconify-icon icon="solar:danger-triangle-linear" width="14" height="14" />
      )}
      {error}
    </div>
  )
}
