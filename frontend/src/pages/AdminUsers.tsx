import { useState, useEffect } from 'react'

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
    <div className="p-10 max-w-6xl mx-auto">

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ROLES.map(r => (
          <button
            key={r.value}
            onClick={() => handleFilter(r.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              activeRole === r.value
                ? 'bg-brand-light text-white border-brand-light shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-light/40 hover:text-brand-light'
            }`}
          >
            {r.label}
          </button>
        ))}

        {!loading && (
          <span className="ml-auto self-center text-xs text-gray-400">
            {users.length} {users.length === 1 ? 'запис' : 'записів'}
          </span>
        )}
      </div>

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
                <th className="px-6 py-3 text-left font-medium">Користувач</th>
                <th className="px-6 py-3 text-left font-medium">Роль</th>
                <th className="px-6 py-3 text-left font-medium">Статус</th>
                <th className="px-6 py-3 text-left font-medium">Дата реєстрації</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
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
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
