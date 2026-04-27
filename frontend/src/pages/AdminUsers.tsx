import { useState, useEffect } from 'react'
import { UserTableRow, type User } from '../components/admin/UserTableRow'
import { UsersFilter } from '../components/admin/UsersFilter'
import { UsersPagination } from '../components/admin/UsersPagination'
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal'
import { BulkDeleteModal } from '../components/admin/BulkDeleteModal'

const LIMIT = 50

interface Meta { total: number; page: number; limit: number; pages: number }

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRole] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [myRole, setMyRole] = useState<string | null>(null)
  const [confirmUser, setConfirmUser] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmPermanent, setConfirmPermanent] = useState(false)
  const [permanentDeleting, setPermanentDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' }).then(r => r.json()).then(d => setMyRole(d.role)).catch(() => {})
  }, [])

  async function load(role: string, deleted: boolean, p: number) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
    if (deleted) params.set('deleted', 'true')
    else if (role) params.set('role', role)
    const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include' })
    if (res.ok) {
      const json = await res.json()
      setUsers(json.data ?? [])
      setMeta(json.meta ?? null)
    }
    setLoading(false)
  }

  useEffect(() => { load('', false, 1) }, [])

  function handleFilter(role: string) {
    setActiveRole(role)
    setSelectedIds(new Set())
    load(role, false, 1)
  }

  function handleToggleDeleted() {
    const next = !showDeleted
    setShowDeleted(next)
    setActiveRole('')
    setSelectedIds(new Set())
    load('', next, 1)
  }

  function handlePageChange(newPage: number) {
    setSelectedIds(new Set())
    load(activeRole, showDeleted, newPage)
  }

  async function handleConfirmDelete() {
    if (!confirmUser) return
    setDeleting(true)
    const res = await fetch(`/api/admin/users/${confirmUser.id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) { setUsers(prev => prev.filter(u => u.id !== confirmUser.id)); setConfirmUser(null) }
    setDeleting(false)
  }

  async function handleRestore(u: User) {
    const res = await fetch(`/api/admin/users/${u.id}/restore`, { method: 'PATCH', credentials: 'include' })
    if (res.ok) {
      setUsers(prev => prev.filter(p => p.id !== u.id))
      setMeta(prev => prev ? { ...prev, total: prev.total - 1, pages: Math.ceil((prev.total - 1) / LIMIT) } : prev)
      setSelectedIds(prev => { const next = new Set(prev); next.delete(u.id); return next })
    }
  }

  async function handlePermanentDelete() {
    if (!selectedIds.size) return
    setPermanentDeleting(true)
    const res = await fetch('/api/admin/users/permanent', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ids: [...selectedIds] }) })
    if (res.ok) {
      setUsers(prev => prev.filter(u => !selectedIds.has(u.id)))
      setMeta(prev => prev ? { ...prev, total: prev.total - selectedIds.size, pages: Math.ceil((prev.total - selectedIds.size) / LIMIT) } : prev)
      setSelectedIds(new Set())
      setConfirmPermanent(false)
    }
    setPermanentDeleting(false)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  function toggleSelectAll() {
    setSelectedIds(selectedIds.size === users.length ? new Set() : new Set(users.map(u => u.id)))
  }

  const isSuperAdmin = myRole === 'super_admin'
  const allSelected = users.length > 0 && selectedIds.size === users.length
  const someSelected = selectedIds.size > 0 && !allSelected

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <UsersFilter
        activeRole={activeRole}
        showDeleted={showDeleted}
        onRoleChange={handleFilter}
        onToggleDeleted={handleToggleDeleted}
        isSuperAdmin={isSuperAdmin}
        extraActions={
          <>
            {showDeleted && selectedIds.size > 0 && (
              <button onClick={() => setConfirmPermanent(true)} className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer">
                <iconify-icon icon="solar:trash-bin-trash-bold" width="16" height="16" />
                Видалити остаточно ({selectedIds.size})
              </button>
            )}
            {!loading && meta && <span className="text-xs text-gray-400">{meta.total} {meta.total === 1 ? 'запис' : 'записів'}</span>}
          </>
        }
      />

      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-brand-light rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-[#F0EEFA] rounded-xl flex items-center justify-center mb-4">
              <iconify-icon icon="solar:users-group-rounded-linear" width="26" height="26" className="text-brand-light" />
            </div>
            <p className="text-gray-700 font-medium">Користувачів не знайдено</p>
            <p className="text-gray-400 text-sm mt-1">Спробуйте змінити фільтр</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                  {showDeleted && (
                    <th className="pl-6 py-3 w-10">
                      <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected }} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-red-500 cursor-pointer accent-red-500" />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left font-medium">Користувач</th>
                  <th className="px-6 py-3 text-left font-medium">Роль</th>
                  <th className="px-6 py-3 text-left font-medium">Статус</th>
                  <th className="px-6 py-3 text-left font-medium">{showDeleted ? 'Видалено' : 'Дата реєстрації'}</th>
                  {isSuperAdmin && <th className="px-6 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <UserTableRow
                    key={u.id}
                    user={u}
                    showDeleted={showDeleted}
                    isChecked={selectedIds.has(u.id)}
                    onToggle={() => toggleSelect(u.id)}
                    onDelete={isSuperAdmin && u.role !== 'super_admin' && !showDeleted ? () => setConfirmUser(u) : undefined}
                    onRestore={showDeleted && isSuperAdmin ? () => handleRestore(u) : undefined}
                    showActions={isSuperAdmin}
                  />
                ))}
              </tbody>
            </table>

            {meta && (
              <UsersPagination
                page={meta.page}
                pages={meta.pages}
                total={meta.total}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>

      <DeleteConfirmModal
        open={!!confirmUser}
        user={confirmUser}
        onClose={() => !deleting && setConfirmUser(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />

      <BulkDeleteModal
        open={confirmPermanent}
        selectedIds={selectedIds}
        users={users}
        onClose={() => !permanentDeleting && setConfirmPermanent(false)}
        onConfirm={handlePermanentDelete}
        loading={permanentDeleting}
      />
    </div>
  )
}
