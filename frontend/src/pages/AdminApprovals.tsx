import { useState, useEffect } from 'react'
import { Link } from 'react-router'

interface PendingUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  coach: 'Тренер',
  school_owner: 'Власник школи',
}

const ROLE_ICONS: Record<string, string> = {
  coach: 'solar:cup-star-linear',
  school_owner: 'solar:buildings-2-linear',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uk-UA', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
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
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand shrink-0">
            <iconify-icon icon="solar:crown-linear" width="22" height="22"></iconify-icon>
          </div>
          <span className="text-white font-bold tracking-tight text-xl uppercase font-heading">YesChess</span>
          <Link to="/dashboard" className="ml-auto text-blue-200/60 text-sm hover:text-white transition-colors flex items-center gap-1">
            <iconify-icon icon="solar:arrow-left-linear" width="14" height="14"></iconify-icon>
            Дашборд
          </Link>
        </div>

        {/* Title + badge */}
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-white font-heading">Заявки на розгляді</h1>
          {!loading && users.length > 0 && (
            <span className="px-2.5 py-0.5 bg-yellow-400/20 text-yellow-300 text-xs font-semibold rounded-full border border-yellow-400/30">
              {users.length}
            </span>
          )}
        </div>
        <p className="text-blue-200/70 text-sm mb-8">Підтвердіть або відхиліть заявки тренерів</p>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>

        ) : users.length === 0 ? (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <iconify-icon icon="solar:check-circle-linear" width="28" height="28"></iconify-icon>
            </div>
            <p className="text-white font-medium mb-1">Все перевірено</p>
            <p className="text-blue-200/60 text-sm">Нових заявок немає</p>
          </div>

        ) : (
          <div className="space-y-3">
            {users.map(u => {
              const result = done[u.id]
              return (
                <div
                  key={u.id}
                  className={`bg-white/10 backdrop-blur-sm border rounded-2xl p-5 transition-all ${
                    result === 'approved' ? 'border-green-500/50 bg-green-500/10' :
                    result === 'rejected' ? 'border-red-500/50 bg-red-500/10' :
                    'border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shrink-0">
                      <iconify-icon icon={ROLE_ICONS[u.role] ?? 'solar:user-linear'} width="20" height="20"></iconify-icon>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold">{u.name}</p>
                        <span className="text-xs px-2 py-0.5 bg-yellow-400/20 text-yellow-300 rounded-full border border-yellow-400/20">
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                        {result && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            result === 'approved'
                              ? 'bg-green-500/20 text-green-300 border-green-500/30'
                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                          }`}>
                            {result === 'approved' ? '✓ Підтверджено' : '✗ Відхилено'}
                          </span>
                        )}
                      </div>
                      <p className="text-blue-200/70 text-xs mt-0.5">{u.email}</p>
                      <p className="text-blue-200/40 text-xs mt-1">
                        Зареєстрований {formatDate(u.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {!result && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => approve(u.id)}
                        disabled={processing === u.id}
                        className="flex-1 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <iconify-icon icon="solar:check-circle-linear" width="16" height="16"></iconify-icon>
                        Підтвердити
                      </button>
                      <button
                        onClick={() => reject(u.id)}
                        disabled={processing === u.id}
                        className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
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
        )}

        {/* Refresh */}
        {!loading && (
          <button
            onClick={loadPending}
            className="mt-6 w-full py-3 text-blue-200/50 hover:text-blue-200 text-sm transition-colors flex items-center justify-center gap-2"
          >
            <iconify-icon icon="solar:refresh-linear" width="14" height="14"></iconify-icon>
            Оновити список
          </button>
        )}
      </div>
    </div>
  )
}
