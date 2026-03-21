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

export default function AdminApprovals() {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  async function loadPending() {
    const res = await fetch('/api/admin/pending', { credentials: 'include' })
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadPending() }, [])

  async function approve(id: string) {
    setProcessing(id)
    await fetch(`/api/admin/users/${id}/approve`, { method: 'PATCH', credentials: 'include' })
    setUsers(u => u.filter(x => x.id !== id))
    setProcessing(null)
  }

  async function reject(id: string) {
    setProcessing(id)
    await fetch(`/api/admin/users/${id}/reject`, { method: 'PATCH', credentials: 'include' })
    setUsers(u => u.filter(x => x.id !== id))
    setProcessing(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand">
            <iconify-icon icon="solar:crown-linear" width="22" height="22"></iconify-icon>
          </div>
          <span className="text-white font-bold tracking-tight text-xl uppercase font-heading">YesChess</span>
          <span className="ml-auto text-blue-200/60 text-sm">
            <Link to="/dashboard" className="hover:text-white transition-colors">← Дашборд</Link>
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1 font-heading">Заявки на розгляді</h1>
        <p className="text-blue-200 text-sm mb-6">Підтвердіть або відхиліть заявки</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-10 text-center">
            <iconify-icon icon="solar:check-circle-bold-duotone" width="40" height="40"></iconify-icon>
            <p className="text-white font-medium">Немає заявок на розгляді</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <iconify-icon icon="solar:user-linear" width="20" height="20"></iconify-icon>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{u.name}</p>
                  <p className="text-blue-200/70 text-xs truncate">{u.email}</p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-yellow-400/20 text-yellow-300 rounded-full">
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approve(u.id)}
                    disabled={processing === u.id}
                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Підтвердити
                  </button>
                  <button
                    onClick={() => reject(u.id)}
                    disabled={processing === u.id}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Відхилити
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
