import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useSession, signOut } from '../lib/auth-client'

interface StudentProfile {
  level: string | null
  fideRating: number | null
  clubRating: number | null
  chesscomUsername: string | null
  lichessUsername: string | null
  bio: string | null
}

interface CoachInfo {
  enrollmentId: string
  coachProfileId: string
  coachName: string
  coachEmail: string
  bio: string | null
  title: string | null
  fideRating: number | null
  avgRating: string | null
  totalReviews: number
  specializations: string[]
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Початківець',
  intermediate: 'Середній',
  advanced: 'Просунутий',
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [coach, setCoach] = useState<CoachInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/student/profile', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/student/coach', { credentials: 'include' }).then(r => r.json()),
    ]).then(([p, c]) => {
      setProfile(p)
      setCoach(c)
      setLoading(false)
    })
  }, [])

  async function handleSignOut() {
    await signOut()
    window.location.href = '/'
  }

  const hasProfile = profile && (
    profile.fideRating || profile.clubRating || profile.level || profile.bio
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-white">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-brand">
              <iconify-icon icon="solar:crown-linear" width="20" height="20"></iconify-icon>
            </div>
            <span className="font-bold tracking-tight text-lg uppercase font-heading">YesChess</span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-blue-200 hover:text-white text-sm transition-colors flex items-center gap-1.5"
          >
            <iconify-icon icon="solar:logout-2-linear" width="16" height="16"></iconify-icon>
            Вийти
          </button>
        </div>

        {/* Welcome card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-4 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                <iconify-icon icon="solar:user-bold-duotone" width="28" height="28"></iconify-icon>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold font-heading truncate">{session?.user.name}</h1>
                <p className="text-blue-200 text-sm truncate">{session?.user.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs px-2.5 py-0.5 bg-white/10 border border-white/20 rounded-full text-blue-100">
                    Учень
                  </span>
                  {profile?.level && (
                    <span className="text-xs px-2.5 py-0.5 bg-emerald-400/20 border border-emerald-400/30 rounded-full text-emerald-300">
                      {LEVEL_LABELS[profile.level] ?? profile.level}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              to="/student/profile/edit"
              className="flex-shrink-0 p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-colors"
              title="Редагувати профіль"
            >
              <iconify-icon icon="solar:pen-linear" width="18" height="18"></iconify-icon>
            </Link>
          </div>
        </div>

        {/* No profile hint */}
        {!loading && !hasProfile && (
          <div className="bg-blue-400/10 border border-blue-400/20 rounded-2xl p-4 mb-4 text-sm text-blue-200 flex gap-3">
            <iconify-icon icon="solar:info-circle-linear" width="20" height="20" className="flex-shrink-0 mt-0.5"></iconify-icon>
            <span>
              Заповни свій профіль — вкажи рейтинг, рівень і нікнейми на chess.com / lichess.
              {' '}<Link to="/student/profile/edit" className="underline underline-offset-2 text-white">Заповнити зараз</Link>
            </span>
          </div>
        )}

        {/* Ratings */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center text-white">
              <iconify-icon icon="solar:ranking-bold-duotone" width="22" height="22" className="mb-1 text-blue-200"></iconify-icon>
              <div className="text-xl font-bold font-heading">
                {profile?.fideRating ?? '—'}
              </div>
              <div className="text-xs text-blue-200">FIDE рейтинг</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center text-white">
              <iconify-icon icon="solar:star-bold-duotone" width="22" height="22" className="mb-1 text-blue-200"></iconify-icon>
              <div className="text-xl font-bold font-heading">
                {profile?.clubRating ?? '—'}
              </div>
              <div className="text-xs text-blue-200">Клубний рейтинг</div>
            </div>
          </div>
        )}

        {/* Platform usernames */}
        {!loading && (profile?.chesscomUsername || profile?.lichessUsername) && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-4 text-white">
            <h2 className="text-sm font-semibold text-blue-200 mb-3">Платформи</h2>
            <div className="space-y-2">
              {profile?.chesscomUsername && (
                <div className="flex items-center gap-3 text-sm">
                  <iconify-icon icon="simple-icons:chessdotcom" width="18" height="18" className="text-emerald-400"></iconify-icon>
                  <span className="text-blue-100">chess.com</span>
                  <span className="ml-auto font-medium">{profile.chesscomUsername}</span>
                </div>
              )}
              {profile?.lichessUsername && (
                <div className="flex items-center gap-3 text-sm">
                  <iconify-icon icon="simple-icons:lichess" width="18" height="18" className="text-blue-300"></iconify-icon>
                  <span className="text-blue-100">lichess.org</span>
                  <span className="ml-auto font-medium">{profile.lichessUsername}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => navigate('/student/booking')}
            className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white hover:border-white/40 transition-colors text-left"
          >
            <iconify-icon icon="solar:calendar-add-bold-duotone" width="26" height="26" className="mb-2 block"></iconify-icon>
            <div className="font-semibold text-sm font-heading">Записатись</div>
            <div className="text-xs text-blue-200 mt-0.5">Обрати слот</div>
          </button>
          <Link
            to="/student/booking"
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white hover:border-white/40 transition-colors"
          >
            <iconify-icon icon="solar:calendar-check-bold-duotone" width="26" height="26" className="mb-2 block"></iconify-icon>
            <div className="font-semibold text-sm font-heading">Мої заняття</div>
            <div className="text-xs text-blue-200 mt-0.5">Розклад та статус</div>
          </Link>
        </div>

        {/* Assigned coach */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-4 text-white">
          <h2 className="text-sm font-semibold text-blue-200 mb-3">Мій тренер</h2>
          {loading ? (
            <div className="text-sm text-blue-200">Завантаження...</div>
          ) : coach ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                <iconify-icon icon="solar:user-bold-duotone" width="24" height="24"></iconify-icon>
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">{coach.coachName}</div>
                <div className="text-sm text-blue-200 truncate">{coach.coachEmail}</div>
                <div className="flex items-center gap-2 mt-1">
                  {coach.title && (
                    <span className="text-xs px-2 py-0.5 bg-amber-400/20 border border-amber-400/30 rounded-full text-amber-300">
                      {coach.title}
                    </span>
                  )}
                  {coach.fideRating && (
                    <span className="text-xs text-blue-300">FIDE {coach.fideRating}</span>
                  )}
                  {coach.avgRating && (
                    <span className="text-xs text-blue-300 flex items-center gap-0.5">
                      <iconify-icon icon="solar:star-bold" width="12" height="12" className="text-amber-400"></iconify-icon>
                      {parseFloat(coach.avgRating).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-blue-300 flex items-center gap-2">
              <iconify-icon icon="solar:user-plus-rounded-linear" width="18" height="18"></iconify-icon>
              Тренер ще не призначений
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
