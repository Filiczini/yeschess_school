import { Link } from 'react-router'
import { useSession } from '../lib/auth-client'
import { useApi } from '../hooks/useApi'
import SignOutButton from '../components/SignOutButton'
import MobileHeader from '../components/MobileHeader'
import GlassCard from '../components/GlassCard'

interface UserProfile {
  role: string
  status: string
  plan: string
}

const SECTIONS = [
  {
    icon: 'solar:user-id-bold-duotone',
    label: 'Мій профіль',
    desc: 'Біо, звання, ставка',
    to: '/coach/profile',
    color: 'from-violet-500/20 to-purple-500/20',
  },
  {
    icon: 'solar:calendar-bold-duotone',
    label: 'Розклад',
    desc: 'Мої доступні слоти',
    to: '/coach/schedule',
    color: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    icon: 'solar:notebook-bold-duotone',
    label: 'Бронювання',
    desc: 'Підтвердити заняття',
    to: '/coach/bookings',
    color: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    icon: 'solar:users-group-rounded-bold-duotone',
    label: 'Учні',
    desc: 'Мій список учнів',
    to: '/coach/students',
    color: 'from-orange-500/20 to-amber-500/20',
  },
]

export default function CoachDashboard() {
  const { data: session } = useSession()
  const { data: profile } = useApi<UserProfile>('/api/users/me')
  const { data: bookingsData } = useApi<{ status: string }[]>('/api/coach/bookings', { normalizeArray: true })

  const pendingCount = Array.isArray(bookingsData)
    ? bookingsData.filter(b => b.status === 'pending').length
    : 0

  const isPending = profile?.status === 'pending'

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      {/* Header */}
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <MobileHeader />
          <SignOutButton variant="dark" />
        </div>

        {/* Welcome card */}
        <GlassCard className="p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <iconify-icon icon="solar:user-bold-duotone" width="28" height="28"></iconify-icon>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold font-heading truncate">
                {session?.user.name}
              </h1>
              <p className="text-blue-200 text-sm truncate">{session?.user.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs px-2.5 py-0.5 bg-white/10 border border-white/20 rounded-full text-blue-100">
                  Тренер
                </span>
                {isPending && (
                  <span className="text-xs px-2.5 py-0.5 bg-yellow-400/20 border border-yellow-400/30 rounded-full text-yellow-300">
                    На розгляді
                  </span>
                )}
                {profile?.status === 'active' && (
                  <span className="text-xs px-2.5 py-0.5 bg-emerald-400/20 border border-emerald-400/30 rounded-full text-emerald-300">
                    Активний
                  </span>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Pending notice */}
        {isPending && (
          <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-2xl p-4 mb-4 text-sm text-yellow-200 flex gap-3">
            <iconify-icon icon="solar:hourglass-line-duotone" width="20" height="20" className="flex-shrink-0 mt-0.5"></iconify-icon>
            <span>
              Ваш акаунт очікує підтвердження адміністратором. Ви отримаєте доступ до всіх функцій після верифікації.
            </span>
          </div>
        )}

        {/* Pending bookings alert */}
        {pendingCount > 0 && (
          <Link
            to="/coach/bookings"
            className="flex items-center gap-3 bg-amber-400/10 border border-amber-400/20 rounded-2xl p-4 mb-4 text-sm text-amber-200 hover:bg-amber-400/15 transition-colors"
          >
            <iconify-icon icon="solar:bell-bing-bold-duotone" width="20" height="20" className="flex-shrink-0"></iconify-icon>
            <span className="flex-1">
              У вас <strong>{pendingCount}</strong> {pendingCount === 1 ? 'нове бронювання' : 'нових бронювань'} — потрібне підтвердження
            </span>
            <iconify-icon icon="solar:arrow-right-linear" width="16" height="16"></iconify-icon>
          </Link>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Учнів', value: '—', icon: 'solar:users-group-rounded-linear' },
            { label: 'Сесій', value: '—', icon: 'solar:calendar-check-linear' },
            { label: 'Рейтинг', value: '—', icon: 'solar:star-linear' },
          ].map(s => (
            <GlassCard
              key={s.label}
              className="rounded-xl p-4 text-center"
            >
              <iconify-icon icon={s.icon} width="20" height="20" className="mb-1 text-blue-200"></iconify-icon>
              <div className="text-xl font-bold font-heading">{s.value}</div>
              <div className="text-xs text-blue-200">{s.label}</div>
            </GlassCard>
          ))}
        </div>

        {/* Navigation cards */}
        <div className="grid grid-cols-2 gap-3">
          {SECTIONS.map(s => (
            <Link
              key={s.to}
              to={s.to}
              className={`bg-gradient-to-br ${s.color} backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-white hover:border-white/40 transition-colors`}
            >
              <iconify-icon icon={s.icon} width="28" height="28" className="mb-3 block"></iconify-icon>
              <div className="font-semibold text-sm font-heading">{s.label}</div>
              <div className="text-xs text-blue-200 mt-0.5">{s.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
