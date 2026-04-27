import { ConfirmDialog } from '../ConfirmDialog'
import type { User } from './UserTableRow'

interface DeleteConfirmModalProps {
  open: boolean
  user: User | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

export function DeleteConfirmModal({
  open,
  user,
  onClose,
  onConfirm,
  loading,
}: DeleteConfirmModalProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="Видалити користувача?"
      description={<p className="text-sm text-gray-500 mb-1">Ви збираєтесь видалити акаунт:</p>}
      onConfirm={onConfirm}
      confirmLabel="Видалити"
      loading={loading}
    >
      {user && (
        <>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5">
            <p className="font-medium text-gray-900 text-sm">{user.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Акаунт буде деактивовано. Ви зможете відновити його у вкладці «Видалені».
          </p>
        </>
      )}
    </ConfirmDialog>
  )
}
