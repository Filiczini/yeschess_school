import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description: ReactNode
  children?: ReactNode
  confirmLabel: string
  onConfirm: () => void
  loading?: boolean
  danger?: boolean
  icon?: string
  confirmIcon?: string
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  onConfirm,
  loading = false,
  danger = false,
  icon = 'solar:trash-bin-trash-bold-duotone',
  confirmIcon = 'solar:trash-bin-trash-linear',
}: ConfirmDialogProps) {
  if (!open) return null

  const iconBg = danger ? 'bg-red-100' : 'bg-red-50'
  const iconColor = danger ? 'text-red-600' : 'text-red-500'
  const btnBg = danger ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
          <iconify-icon icon={icon} width="24" height="24" className={iconColor}></iconify-icon>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
        {description}
        {children}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 ${btnBg} rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <iconify-icon icon={confirmIcon} width="16" height="16"></iconify-icon>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
