import { useState, useEffect } from 'react'
import { RoleBadge, Badge } from '../components/Badge'
import { formatDateTime } from '../lib/date'

interface PendingUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
}

const ROLE_ICONS: Record<string, string> = {
  coach: 'solar:cup-star-linear',
  school_owner: 'solar:buildings-2-linear',
}

export default function AdminApprovals() {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [done, setDone] = useState<Record<string, 'approved' | 'rejected'>>({})

  async function loadPending() {
    setLoading(true)
    const res = await fetch('/api/admin/pending', { credentials: 'include' })
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadPending() }, [])

  async function approve(id: string) {
    setProcessing(id)
    const res = await fetch(`/api/admin/users/${id}/approve`, { method: 'PATCH', credentials: 'include' })
    if (res.ok) {
      setDone(d => ({ ...d, [id]: 'approved' }))
      setTimeout(() => setUsers(u => u.filter(x => x.id !== id)), 1200)
    }
    setProcessing(null)
  }

  async function reject(id: string) {
    setProcessing(id)
    const res = await fetch(`/api/admin/users/${id}/reject`, { method: 'PATCH', credentials: 'include' })
    if (res.ok) {
      setDone(d => ({ ...d, [id]: 'rejected' }))
      setTimeout(() => setUsers(u => u.filter(x => x.id !== id)), 1200)
    }
    setProcessing(null)
  }

  return (
    <div className="p-10 max-w-3xl mx-auto">

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-gray-200 border-t-brand-light rounded-full animate-spin" />
        </div>

      ) : users.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mb-5">
            <iconify-icon icon="solar:check-circle-linear" width="30" height="30" className="text-green-500"></iconify-icon>
          </div>
          <p className="font-heading text-lg font-medium text-gray-900 mb-1">Все перевірено</p>
          <p className="text-gray-400 text-sm">Нових заявок немає</p>
          <button
            onClick={loadPending}
            className="mt-6 flex items-center gap-2 text-brand-light text-sm hover:underline"
          >
            <iconify-icon icon="solar:refresh-linear" width="14" height="14"></iconify-icon>
            Оновити
          </button>
        </div>

      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                {users.length}
              </span>
              <span className="text-sm text-gray-500">нових заявок</span>
            </div>
            <button
              onClick={loadPending}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-light transition-colors"
            >
              <iconify-icon icon="solar:refresh-linear" width="14" height="14"></iconify-icon>
              Оновити
            </button>
          </div>

          <div className="space-y-3">
            {users.map(u => {
              const result = done[u.id]
              return (
                <div
                  key={u.id}
                  className={`bg-white border rounded-xl shadow-sm p-5 transition-all ${
                    result === 'approved' ? 'border-green-200 bg-green-50/30' :
                    result === 'rejected' ? 'border-red-200 bg-red-50/30' :
                    'border-gray-200/80'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 bg-[#F0EEFA] border border-brand-light/20 rounded-xl flex items-center justify-center shrink-0">
                      <iconify-icon
                        icon={ROLE_ICONS[u.role] ?? 'solar:user-linear'}
                        width="20"
                        height="20"
                        className="text-brand-light"
                      ></iconify-icon>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{u.name}</p>
                        <RoleBadge role={u.role} />
                        {result && (
                          <Badge className={`rounded-md ${
                            result === 'approved'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {result === 'approved' ? '✓ Підтверджено' : '✗ Відхилено'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">{u.email}</p>
                      <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                        <iconify-icon icon="solar:clock-circle-linear" width="12" height="12"></iconify-icon>
                        Зареєстрований {formatDateTime(u.createdAt, { utc: true })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {!result && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => approve(u.id)}
                        disabled={processing === u.id}
                        className="flex-1 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <iconify-icon icon="solar:check-circle-linear" width="16" height="16"></iconify-icon>
                        Підтвердити
                      </button>
                      <button
                        onClick={() => reject(u.id)}
                        disabled={processing === u.id}
                        className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <iconify-icon icon="solar:close-circle-linear" width="16" height="16"></iconify-icon>
                        Відхилити
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
