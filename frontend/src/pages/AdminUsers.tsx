import { useState, useEffect } from 'react'
import { Link } from 'react-router'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  plan: string
  createdAt: string
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
  student: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
  parent: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
  coach: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20',
  school_owner: 'text-orange-300 bg-orange-500/10 border-orange-500/20',
  admin: 'text-red-300 bg-red-500/10 border-red-500/20',
  super_admin: 'text-pink-300 bg-pink-500/10 border-pink-500/20',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-300 bg-green-500/10 border-green-500/20',
  pending: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20',
  suspended: 'text-red-300 bg-red-500/10 border-red-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Активний',
  pending: 'На розгляді',
  suspended: 'Заблокований',
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

  async function load(role: string) {
    setLoading(true)
    const url = role ? `/api/admin/users?role=${role}` : '/api/admin/users'
    const res = await fetch(url, { credentials: 'include' })
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load('') }, [])

  function handleFilter(role: string) {
    setActiveRole(role)
    load(role)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      <div className="max-w-3xl mx-auto">

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

        {/* Title */}
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-white font-heading">Користувачі</h1>
          {!loading && (
            <span className="px-2.5 py-0.5 bg-white/10 text-blue-200 text-xs font-semibold rounded-full border border-white/20">
              {users.length}
            </span>
          )}
        </div>
        <p className="text-blue-200/70 text-sm mb-6">Всі зареєстровані користувачі платформи</p>

        {/* Role filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ROLES.map(r => (
            <button
              key={r.value}
              onClick={() => handleFilter(r.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                activeRole === r.value
                  ? 'bg-white text-brand border-white'
                  : 'bg-white/5 text-blue-200 border-white/20 hover:bg-white/10'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>

        ) : users.length === 0 ? (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
            <iconify-icon icon="solar:users-group-rounded-linear" width="36" height="36"></iconify-icon>
            <p className="text-white font-medium mt-3">Користувачів не знайдено</p>
          </div>

        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/10 text-xs text-blue-200/50 uppercase tracking-wider">
              <span>Користувач</span>
              <span>Роль</span>
              <span>Статус</span>
              <span>Дата</span>
            </div>

            {/* Rows */}
            {users.map((u, i) => (
              <div
                key={u.id}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-4 items-center transition-colors hover:bg-white/5 ${
                  i !== users.length - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                {/* Name + email */}
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{u.name}</p>
                  <p className="text-blue-200/50 text-xs truncate">{u.email}</p>
                </div>

                {/* Role */}
                <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${ROLE_COLORS[u.role] ?? 'text-white/60 bg-white/5 border-white/10'}`}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>

                {/* Status */}
                <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_COLORS[u.status] ?? ''}`}>
                  {STATUS_LABELS[u.status] ?? u.status}
                </span>

                {/* Date */}
                <span className="text-blue-200/40 text-xs whitespace-nowrap">{formatDate(u.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
