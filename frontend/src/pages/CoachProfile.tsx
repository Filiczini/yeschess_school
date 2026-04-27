import { Link } from 'react-router'
import { useApi } from '../hooks/useApi'
import MobileHeader from '../components/MobileHeader'
import GlassCard from '../components/GlassCard'

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
  const { data: profile, loading } = useApi<CoachProfileData>('/api/coach/profile')

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
        <MobileHeader backTo="/coach" />

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
          <GlassCard className="p-8 text-center text-blue-200">
            <iconify-icon icon="solar:user-id-linear" width="40" height="40" className="mb-3 block mx-auto opacity-50"></iconify-icon>
            <p className="text-sm">Профіль ще не заповнено.</p>
            <Link
              to="/coach/profile/edit"
              className="inline-block mt-4 px-5 py-2 bg-white text-brand rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              Заповнити профіль
            </Link>
          </GlassCard>
        ) : (
          <div className="space-y-4">

            {/* Bio */}
            {profile.bio && (
              <GlassCard className="p-6">
                <h2 className="text-white font-semibold font-heading mb-3 flex items-center gap-2 text-sm uppercase tracking-wide opacity-70">
                  <iconify-icon icon="solar:document-text-linear" width="16" height="16"></iconify-icon>
                  Про себе
                </h2>
                <p className="text-blue-100 text-sm leading-relaxed">{profile.bio}</p>
              </GlassCard>
            )}

            {/* Chess info */}
            <GlassCard className="p-6">
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
            </GlassCard>

            {/* Rate */}
            <GlassCard className="p-6">
              <h2 className="text-white font-semibold font-heading mb-4 flex items-center gap-2 text-sm uppercase tracking-wide opacity-70">
                <iconify-icon icon="solar:wallet-linear" width="16" height="16"></iconify-icon>
                Ставка
              </h2>
              <p className="text-white text-2xl font-bold font-heading">
                {profile.hourlyRate} <span className="text-blue-200 text-base font-normal">₴ / год</span>
              </p>
            </GlassCard>

            {/* Languages */}
            {profile.languages.length > 0 && (
              <GlassCard className="p-6">
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
              </GlassCard>
            )}

            {/* Specializations */}
            {profile.specializations.length > 0 && (
              <GlassCard className="p-6">
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
              </GlassCard>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
