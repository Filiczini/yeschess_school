import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  plan: string
  createdAt: string
  deletedAt: string | null
}

const ROLES = [
  { value: '', label: 'Всі' },
  { value: 'student', label: 'Учні' },
  { value: 'parent', label: 'Батьки' },
  { value: 'coach', label: 'Тренери' },
  { value: 'school_owner', label: 'Власники' },
  { value: 'admin', label: 'Адміни' },
  { value: 'super_admin', label: 'Супер адміни' },
]

const ROLE_LABELS: Record<string, string> = {
  student: 'Учень',
  parent: 'Батько/Мати',
  coach: 'Тренер',
  school_owner: 'Власник',
  admin: 'Адмін',
  super_admin: 'Супер адмін',
}

const ROLE_COLORS: Record<string, string> = {
  student: 'text-blue-700 bg-blue-50 border-blue-200',
  parent: 'text-purple-700 bg-purple-50 border-purple-200',
  coach: 'text-amber-700 bg-amber-50 border-amber-200',
  school_owner: 'text-orange-700 bg-orange-50 border-orange-200',
  admin: 'text-red-700 bg-red-50 border-red-200',
  super_admin: 'text-pink-700 bg-pink-50 border-pink-200',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Активний',
  pending: 'На розгляді',
  suspended: 'Заблокований',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-700 bg-green-50 border-green-200',
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
  suspended: 'text-red-700 bg-red-50 border-red-200',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uk-UA', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRole] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [myRole, setMyRole] = useState<string | null>(null)
  const [confirmUser, setConfirmUser] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Permanent delete
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmPermanent, setConfirmPermanent] = useState(false)
  const [permanentDeleting, setPermanentDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setMyRole(d.role))
      .catch(() => {})
  }, [])

  async function load(role: string, deleted: boolean) {
    setLoading(true)
    const params = deleted ? 'deleted=true' : role ? `role=${role}` : ''
    const url = params ? `/api/admin/users?${params}` : '/api/admin/users'
    const res = await fetch(url, { credentials: 'include' })
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load('', false) }, [])

  function handleFilter(role: string) {
    setActiveRole(role)
    load(role, false)
  }

  function handleTabChange(deleted: boolean) {
    setShowDeleted(deleted)
    setActiveRole('')
    setSelectedIds(new Set())
    load('', deleted)
  }

  async function handleConfirmDelete() {
    if (!confirmUser) return
    setDeleting(true)
    const res = await fetch(`/api/admin/users/${confirmUser.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== confirmUser.id))
      setConfirmUser(null)
    }
    setDeleting(false)
  }

  async function handleRestore(u: User) {
    const res = await fetch(`/api/admin/users/${u.id}/restore`, {
      method: 'PATCH',
      credentials: 'include',
    })
    if (res.ok) {
      setUsers(prev => prev.filter(p => p.id !== u.id))
      setSelectedIds(prev => { const next = new Set(prev); next.delete(u.id); return next })
    }
  }

  async function handlePermanentDelete() {
    if (!selectedIds.size) return
    setPermanentDeleting(true)
    const res = await fetch('/api/admin/users/permanent', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: [...selectedIds] }),
    })
    if (res.ok) {
      setUsers(prev => prev.filter(u => !selectedIds.has(u.id)))
      setSelectedIds(new Set())
      setConfirmPermanent(false)
    }
    setPermanentDeleting(false)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(users.map(u => u.id)))
    }
  }

  const isSuperAdmin = myRole === 'super_admin'
  const allSelected = users.length > 0 && selectedIds.size === users.length
  const someSelected = selectedIds.size > 0 && !allSelected

  return (
    <div className="p-10 max-w-6xl mx-auto">

      {/* Main tabs */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => handleTabChange(false)}
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
              onClick={() => handleTabChange(true)}
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

        <div className="flex items-center gap-3">
          {showDeleted && selectedIds.size > 0 && (
            <button
              onClick={() => setConfirmPermanent(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              <iconify-icon icon="solar:trash-bin-trash-bold" width="16" height="16"></iconify-icon>
              Видалити остаточно ({selectedIds.size})
            </button>
          )}
          {!loading && (
            <span className="text-xs text-gray-400">
              {users.length} {users.length === 1 ? 'запис' : 'записів'}
            </span>
          )}
        </div>
      </div>

      {/* Role filters — only on active users tab */}
      {!showDeleted && (
        <div className="flex flex-wrap gap-2 mb-6">
          {ROLES.map(r => (
            <button
              key={r.value}
              onClick={() => handleFilter(r.value)}
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

      {/* Table card */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-brand-light rounded-full animate-spin" />
          </div>

        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-[#F0EEFA] rounded-xl flex items-center justify-center mb-4">
              <iconify-icon icon="solar:users-group-rounded-linear" width="26" height="26" className="text-brand-light"></iconify-icon>
            </div>
            <p className="text-gray-700 font-medium">Користувачів не знайдено</p>
            <p className="text-gray-400 text-sm mt-1">Спробуйте змінити фільтр</p>
          </div>

        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                {showDeleted && (
                  <th className="pl-6 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-red-500 cursor-pointer accent-red-500"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left font-medium">Користувач</th>
                <th className="px-6 py-3 text-left font-medium">Роль</th>
                <th className="px-6 py-3 text-left font-medium">Статус</th>
                <th className="px-6 py-3 text-left font-medium">
                  {showDeleted ? 'Видалено' : 'Дата реєстрації'}
                </th>
                {isSuperAdmin && <th className="px-6 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => {
                const canDelete = isSuperAdmin && u.role !== 'super_admin'
                const isChecked = selectedIds.has(u.id)
                return (
                  <tr
                    key={u.id}
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
                          onChange={() => toggleSelect(u.id)}
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-red-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F0EEFA] flex items-center justify-center text-brand-light text-xs font-semibold shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{u.name}</p>
                          <p className="text-gray-400 text-xs truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-md border font-medium ${ROLE_COLORS[u.role] ?? 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-md border font-medium ${STATUS_COLORS[u.status] ?? ''}`}>
                        {STATUS_LABELS[u.status] ?? u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(showDeleted && u.deletedAt ? u.deletedAt : u.createdAt)}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 text-right">
                        {showDeleted ? (
                          <button
                            onClick={() => handleRestore(u)}
                            className="p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                            title="Відновити користувача"
                          >
                            <iconify-icon icon="solar:restart-bold" width="16" height="16"></iconify-icon>
                          </button>
                        ) : canDelete ? (
                          <button
                            onClick={() => setConfirmUser(u)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Видалити користувача"
                          >
                            <iconify-icon icon="solar:trash-bin-trash-linear" width="16" height="16"></iconify-icon>
                          </button>
                        ) : null}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Soft-delete confirmation dialog */}
      {confirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setConfirmUser(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <iconify-icon icon="solar:trash-bin-trash-bold-duotone" width="24" height="24" className="text-red-500"></iconify-icon>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Видалити користувача?</h2>
            <p className="text-sm text-gray-500 mb-1">
              Ви збираєтесь видалити акаунт:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5">
              <p className="font-medium text-gray-900 text-sm">{confirmUser.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{confirmUser.email}</p>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Акаунт буде деактивовано. Ви зможете відновити його у вкладці «Видалені».
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmUser(null)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Скасувати
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {deleting
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <iconify-icon icon="solar:trash-bin-trash-linear" width="16" height="16"></iconify-icon>
                }
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent delete confirmation dialog */}
      {confirmPermanent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !permanentDeleting && setConfirmPermanent(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <iconify-icon icon="solar:danger-bold-duotone" width="24" height="24" className="text-red-600"></iconify-icon>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Видалити назавжди?</h2>
            <p className="text-sm text-gray-500 mb-4">
              Буде остаточно видалено {selectedIds.size} {selectedIds.size === 1 ? 'акаунт' : 'акаунти'}. Це незворотна дія — відновити буде неможливо.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 max-h-36 overflow-y-auto space-y-1.5">
              {users.filter(u => selectedIds.has(u.id)).map(u => (
                <div key={u.id}>
                  <p className="font-medium text-gray-800 text-sm">{u.name}</p>
                  <p className="text-xs text-red-400">{u.email}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmPermanent(false)}
                disabled={permanentDeleting}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Скасувати
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={permanentDeleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {permanentDeleting
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <iconify-icon icon="solar:trash-bin-minimalistic-bold" width="16" height="16"></iconify-icon>
                }
                Видалити назавжди
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
