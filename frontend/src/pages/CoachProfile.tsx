import { useEffect, useState } from 'react'
import { Link } from 'react-router'

interface CoachProfileData {
  id: string
  bio: string | null
  title: string | null
  fideRating: number | null
  hourlyRate: string
  languages: string[]
  specializations: string[]
}

export default function CoachProfile() {
  const [profile, setProfile] = useState<CoachProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/coach/profile', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setProfile(data ?? null)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center">
        <div className="text-white/60 text-sm">Завантаження...</div>
      </div>
    )
  }

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
          <Link
            to="/coach"
            className="text-blue-200 hover:text-white text-sm transition-colors flex items-center gap-1.5"
          >
            <iconify-icon icon="solar:arrow-left-linear" width="16" height="16"></iconify-icon>
            Назад
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-2xl font-bold font-heading">Мій профіль</h1>
          <Link
            to="/coach/profile/edit"
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white text-sm rounded-xl transition-colors"
          >
            <iconify-icon icon="solar:pen-linear" width="16" height="16"></iconify-icon>
            Редагувати
          </Link>
        </div>

        {!profile ? (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center text-blue-200">
            <iconify-icon icon="solar:user-id-linear" width="40" height="40" class="mb-3 block mx-auto opacity-50"></iconify-icon>
            <p className="text-sm">Профіль ще не заповнено.</p>
            <Link
              to="/coach/profile/edit"
              className="inline-block mt-4 px-5 py-2 bg-white text-brand rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              Заповнити профіль
            </Link>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Bio */}
            {profile.bio && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <h2 className="text-white font-semibold font-heading mb-3 flex items-center gap-2 text-sm uppercase tracking-wide opacity-70">
                  <iconify-icon icon="solar:document-text-linear" width="16" height="16"></iconify-icon>
                  Про себе
                </h2>
                <p className="text-blue-100 text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Chess info */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h2 className="text-white font-semibold font-heading mb-4 flex items-center gap-2 text-sm uppercase tracking-wide opacity-70">
                <iconify-icon icon="solar:chess-knight-linear" width="16" height="16"></iconify-icon>
                Шахові дані
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-blue-300 text-xs mb-1">Звання FIDE</p>
                  <p className="text-white font-semibold">{profile.title ?? '—'}</p>
                </div>
                <div>
                  <p className="text-blue-300 text-xs mb-1">Рейтинг FIDE</p>
                  <p className="text-white font-semibold">{profile.fideRating ?? '—'}</p>
                </div>
              </div>
            </div>

            {/* Rate */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h2 className="text-white font-semibold font-heading mb-4 flex items-center gap-2 text-sm uppercase tracking-wide opacity-70">
                <iconify-icon icon="solar:wallet-linear" width="16" height="16"></iconify-icon>
                Ставка
              </h2>
              <p className="text-white text-2xl font-bold font-heading">
                {profile.hourlyRate} <span className="text-blue-200 text-base font-normal">₴ / год</span>
              </p>
            </div>

            {/* Languages */}
            {profile.languages.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <h2 className="text-white font-semibold font-heading mb-4 flex items-center gap-2 text-sm uppercase tracking-wide opacity-70">
                  <iconify-icon icon="solar:global-linear" width="16" height="16"></iconify-icon>
                  Мови навчання
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map(lang => (
                    <span
                      key={lang}
                      className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-blue-100 text-sm"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Specializations */}
            {profile.specializations.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <h2 className="text-white font-semibold font-heading mb-4 flex items-center gap-2 text-sm uppercase tracking-wide opacity-70">
                  <iconify-icon icon="solar:target-linear" width="16" height="16"></iconify-icon>
                  Спеціалізація
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.specializations.map(spec => (
                    <span
                      key={spec}
                      className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-blue-100 text-sm"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
