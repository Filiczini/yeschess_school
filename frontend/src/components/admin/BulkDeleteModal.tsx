import { ConfirmDialog } from '../ConfirmDialog'
import type { User } from './UserTableRow'

interface BulkDeleteModalProps {
  open: boolean
  selectedIds: Set<string>
  users: User[]
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

export function BulkDeleteModal({
  open,
  selectedIds,
  users,
  onClose,
  onConfirm,
  loading,
}: BulkDeleteModalProps) {
  const count = selectedIds.size
  const selectedUsers = users.filter(u => selectedIds.has(u.id))

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="Видалити назавжди?"
      description={
        <p className="text-sm text-gray-500 mb-4">
          Буде остаточно видалено {count}{' '}
          {count === 1 ? 'акаунт' : 'акаунти'}. Це незворотна дія — відновити буде неможливо.
        </p>
      }
      onConfirm={onConfirm}
      confirmLabel="Видалити назавжди"
      loading={loading}
      danger
      icon="solar:danger-bold-duotone"
      confirmIcon="solar:trash-bin-minimalistic-bold"
    >
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 max-h-36 overflow-y-auto space-y-1.5">
        {selectedUsers.map(u => (
          <div key={u.id}>
            <p className="font-medium text-gray-800 text-sm">{u.name}</p>
            <p className="text-xs text-red-400">{u.email}</p>
          </div>
        ))}
      </div>
    </ConfirmDialog>
  )
}
