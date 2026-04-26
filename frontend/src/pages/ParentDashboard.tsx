import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useSession } from '../lib/auth-client'
import SignOutButton from '../components/SignOutButton'
import { LevelBadge, Badge } from '../components/Badge'
import MobileHeader from '../components/MobileHeader'

interface ParentProfile {
  phone: string | null
  contactMethod: string | null
  instagram: string | null
}

interface Child {
  id: string
  name: string
  email: string
  level: string | null
  fideRating: number | null
  clubRating: number | null
  coachName: string | null
  coachTitle: string | null
  upcomingBookings: number
}

export default function ParentDashboard() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ParentProfile | null>(null)

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setProfile({ phone: d.phone, contactMethod: d.contactMethod, instagram: d.instagram }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/parent/children', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setChildren(list)
        if (list.length > 0) setSelectedChildId(list[0].id)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const selectedChild = children.find(c => c.id === selectedChildId) ?? null

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <MobileHeader />
          <SignOutButton variant="dark" />
        </div>

        {/* Welcome card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-4 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                <iconify-icon icon="solar:users-group-rounded-bold-duotone" width="28" height="28"></iconify-icon>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold font-heading truncate">{session?.user.name}</h1>
                <p className="text-blue-200 text-sm truncate">{session?.user.email}</p>
                <div className="mt-1.5">
                  <span className="text-xs px-2.5 py-0.5 bg-white/10 border border-white/20 rounded-full text-blue-100">
                    Батько/Мати
                  </span>
                </div>
              </div>
            </div>
            <Link
              to="/parent/add-child"
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-xs font-medium transition-colors"
            >
              <iconify-icon icon="solar:user-plus-rounded-linear" width="16" height="16"></iconify-icon>
              Додати дитину
            </Link>
          </div>
        </div>

        {/* Parent contact info */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-blue-200">Контактна інформація</h2>
            <Link
              to="/parent/profile/edit"
              className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
              title="Редагувати"
            >
              <iconify-icon icon="solar:pen-linear" width="14" height="14"></iconify-icon>
            </Link>
          </div>
          {profile?.phone || profile?.contactMethod || profile?.instagram ? (
            <div className="space-y-2">
              {profile.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <iconify-icon icon="solar:phone-linear" width="16" height="16" className="text-blue-300 shrink-0"></iconify-icon>
                  <span>{profile.phone}</span>
                  {profile.contactMethod && (
                    <span className="ml-auto text-xs text-blue-300 capitalize">{profile.contactMethod}</span>
                  )}
                </div>
              )}
              {profile.instagram && (
                <div className="flex items-center gap-3 text-sm">
                  <iconify-icon icon="solar:instagram-linear" width="16" height="16" className="text-blue-300 shrink-0"></iconify-icon>
                  <span>@{profile.instagram}</span>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/parent/profile/edit"
              className="text-sm text-blue-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <iconify-icon icon="solar:add-circle-linear" width="16" height="16"></iconify-icon>
              Додати контактну інформацію
            </Link>
          )}
        </div>

        {/* Onboarding — no children yet */}
        {!loading && children.length === 0 && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 mb-4 text-white">
            <div className="flex items-center gap-2 mb-4">
              <iconify-icon icon="solar:rocket-bold-duotone" width="20" height="20" className="text-amber-300"></iconify-icon>
              <span className="font-semibold text-sm">Як почати навчання</span>
            </div>
            <div className="space-y-3">
              {[
                {
                  num: '1',
                  title: 'Додайте дитину',
                  desc: 'Створіть акаунт для вашої дитини',
                  action: { label: 'Додати зараз', to: '/parent/add-child' },
                  color: 'bg-violet-400/20 border-violet-400/30 text-violet-300',
                },
                {
                  num: '2',
                  title: 'Дочекайтесь призначення тренера',
                  desc: 'Адміністратор призначить тренера найближчим часом',
                  action: null,
                  color: 'bg-blue-400/20 border-blue-400/30 text-blue-300',
                },
                {
                  num: '3',
                  title: 'Запишіть дитину на заняття',
                  desc: 'Оберіть зручний час у розкладі тренера',
                  action: null,
                  color: 'bg-emerald-400/20 border-emerald-400/30 text-emerald-300',
                },
              ].map(step => (
                <div key={step.num} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${step.color}`}>
                    {step.num}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-blue-200 mt-0.5">{step.desc}</div>
                    {step.action && (
                      <Link
                        to={step.action.to}
                        className="inline-block mt-1.5 text-xs text-white underline underline-offset-2"
                      >
                        {step.action.label} →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Children section */}
        {!loading && children.length > 0 && (
          <>
            {/* Tabs — only if more than one child */}
            {children.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                      selectedChildId === child.id
                        ? 'bg-white text-brand border-white'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            )}

            {selectedChild && (
              <>
                {/* Child info */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-4 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                      <iconify-icon icon="solar:user-bold-duotone" width="28" height="28"></iconify-icon>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-lg font-heading truncate">{selectedChild.name}</div>
                      <div className="text-sm text-blue-200 truncate">{selectedChild.email}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs px-2.5 py-0.5 bg-white/10 border border-white/20 rounded-full text-blue-100">
                          Учень
                        </span>
                        {selectedChild.level && (
                          <LevelBadge level={selectedChild.level} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ratings */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center text-white">
                    <iconify-icon icon="solar:ranking-bold-duotone" width="22" height="22" className="mb-1 text-blue-200"></iconify-icon>
                    <div className="text-xl font-bold font-heading">{selectedChild.fideRating ?? '—'}</div>
                    <div className="text-xs text-blue-200">FIDE рейтинг</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center text-white">
                    <iconify-icon icon="solar:star-bold-duotone" width="22" height="22" className="mb-1 text-blue-200"></iconify-icon>
                    <div className="text-xl font-bold font-heading">{selectedChild.clubRating ?? '—'}</div>
                    <div className="text-xs text-blue-200">Клубний рейтинг</div>
                  </div>
                </div>

                {/* Quick actions — only if coach is assigned */}
                {selectedChild.coachName && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => navigate(`/parent/booking?childId=${selectedChild.id}`)}
                      className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white hover:border-white/40 transition-colors text-left"
                    >
                      <iconify-icon icon="solar:calendar-add-bold-duotone" width="26" height="26" className="mb-2 block"></iconify-icon>
                      <div className="font-semibold text-sm font-heading">Записати</div>
                      <div className="text-xs text-blue-200 mt-0.5">Обрати слот</div>
                    </button>
                    <button
                      onClick={() => navigate(`/parent/bookings?childId=${selectedChild.id}`)}
                      className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white hover:border-white/40 transition-colors text-left"
                    >
                      <iconify-icon icon="solar:calendar-check-bold-duotone" width="26" height="26" className="mb-2 block"></iconify-icon>
                      <div className="font-semibold text-sm font-heading">Заняття</div>
                      <div className="text-xs text-blue-200 mt-0.5">
                        {selectedChild.upcomingBookings > 0
                          ? `${selectedChild.upcomingBookings} заплановано`
                          : 'Розклад та статус'}
                      </div>
                    </button>
                  </div>
                )}

                {/* Coach */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-4 text-white">
                  <h2 className="text-sm font-semibold text-blue-200 mb-3">Тренер дитини</h2>
                  {selectedChild.coachName ? (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                        <iconify-icon icon="solar:user-bold-duotone" width="24" height="24"></iconify-icon>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{selectedChild.coachName}</div>
                        {selectedChild.coachTitle && (
                          <Badge className="rounded-full bg-amber-400/20 border-amber-400/30 text-amber-300 mt-1 inline-block">{selectedChild.coachTitle}</Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-blue-300 flex items-center gap-2">
                      <iconify-icon icon="solar:user-plus-rounded-linear" width="18" height="18"></iconify-icon>
                      Тренер ще не призначений
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  )
}
