import { RoleBadge, StatusBadge } from '../Badge'
import { formatDate } from '../../lib/date'

export interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  plan: string
  createdAt: string
  deletedAt: string | null
}

interface UserTableRowProps {
  user: User
  showDeleted: boolean
  isChecked: boolean
  onToggle: () => void
  onDelete?: () => void
  onRestore?: () => void
  showActions?: boolean
}

export function UserTableRow({
  user,
  showDeleted,
  isChecked,
  onToggle,
  onDelete,
  onRestore,
  showActions = false,
}: UserTableRowProps) {
  return (
    <tr
      className={`transition-colors ${
        showDeleted
          ? isChecked
            ? 'bg-red-50/60'
            : 'opacity-60 hover:opacity-80'
          : 'hover:bg-gray-50/50'
      }`}
    >
      {showDeleted && (
        <td className="pl-6 py-4 w-10">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={onToggle}
            className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-red-500"
          />
        </td>
      )}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F0EEFA] flex items-center justify-center text-brand-light text-xs font-semibold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-gray-400 text-xs truncate">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={user.status} />
      </td>
      <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
        {formatDate(showDeleted && user.deletedAt ? user.deletedAt : user.createdAt)}
      </td>
      {showActions && (
        <td className="px-6 py-4 text-right">
          {onRestore && (
            <button
              onClick={onRestore}
              className="p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
              title="Відновити користувача"
            >
              <iconify-icon icon="solar:restart-bold" width="16" height="16"></iconify-icon>
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
              title="Видалити користувача"
            >
              <iconify-icon icon="solar:trash-bin-trash-linear" width="16" height="16"></iconify-icon>
            </button>
          )}
        </td>
      )}
    </tr>
  )
}
