import type { ReactNode } from 'react'

const ROLES = [
  { value: '', label: 'Всі' },
  { value: 'student', label: 'Учні' },
  { value: 'parent', label: 'Батьки' },
  { value: 'coach', label: 'Тренери' },
  { value: 'school_owner', label: 'Власники' },
  { value: 'admin', label: 'Адміни' },
  { value: 'super_admin', label: 'Супер адміни' },
]

interface UsersFilterProps {
  activeRole: string
  showDeleted: boolean
  onRoleChange: (role: string) => void
  onToggleDeleted: () => void
  isSuperAdmin?: boolean
  extraActions?: ReactNode
}

export function UsersFilter({
  activeRole,
  showDeleted,
  onRoleChange,
  onToggleDeleted,
  isSuperAdmin = false,
  extraActions,
}: UsersFilterProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => showDeleted && onToggleDeleted()}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              !showDeleted
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Всі користувачі
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => !showDeleted && onToggleDeleted()}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                showDeleted
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Видалені
            </button>
          )}
        </div>
        {extraActions && (
          <div className="flex items-center gap-3">
            {extraActions}
          </div>
        )}
      </div>

      {!showDeleted && (
        <div className="flex flex-wrap gap-2 mb-6">
          {ROLES.map(r => (
            <button
              key={r.value}
              onClick={() => onRoleChange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                activeRole === r.value
                  ? 'bg-brand-light text-white border-brand-light shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-light/40 hover:text-brand-light'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
