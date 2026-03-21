import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useSession, signOut } from '../lib/auth-client'

interface UserProfile {
  role: string
  status: string
  plan: string
}

const ROLE_LABELS: Record<string, string> = {
  student: 'Учень',
  parent: 'Батько/Мати',
  coach: 'Тренер',
  school_owner: 'Власник школи',
  admin: 'Адміністратор',
  super_admin: 'Супер Адмін',
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then(r => r.json())
      .then(setProfile)
  }, [])

  async function handleSignOut() {
    await signOut()
    window.location.href = '/'
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isPending = profile?.status === 'pending'

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center px-4">
      <div className="text-center text-white max-w-sm w-full">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand">
            <iconify-icon icon="solar:crown-linear" width="22" height="22"></iconify-icon>
          </div>
          <span className="font-bold tracking-tight text-xl uppercase font-heading">YesChess</span>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-4">
          <h1 className="text-2xl font-bold mb-1 font-heading">Дашборд</h1>
          <p className="text-blue-200 text-sm mb-1">
            Вітаємо, <strong className="text-white">{session?.user.name}</strong>
          </p>
          <p className="text-blue-200/60 text-xs mb-4">{session?.user.email}</p>

          {profile && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-xs px-3 py-1 bg-white/10 border border-white/20 rounded-full text-blue-100">
                {ROLE_LABELS[profile.role] ?? profile.role}
              </span>
              {isPending && (
                <span className="text-xs px-3 py-1 bg-yellow-400/20 border border-yellow-400/30 rounded-full text-yellow-300">
                  На розгляді
                </span>
              )}
            </div>
          )}

          {isPending && (
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 mb-4 text-sm text-yellow-200">
              Ваша заявка як тренера розглядається. Очікуйте підтвердження.
            </div>
          )}

          {isAdmin && (
            <Link
              to="/admin/approvals"
              className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm font-medium transition-colors mb-3"
            >
              <iconify-icon icon="solar:users-group-rounded-linear" width="18" height="18"></iconify-icon>
              Заявки на розгляді
            </Link>
          )}

          <button
            onClick={handleSignOut}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-blue-200 rounded-xl text-sm transition-colors"
          >
            Вийти
          </button>
        </div>
      </div>
    </div>
  )
}
