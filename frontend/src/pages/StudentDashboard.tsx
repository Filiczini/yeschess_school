import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useSession } from '../lib/auth-client'
import SignOutButton from '../components/SignOutButton'
import MobileHeader from '../components/MobileHeader'
import ProfileCard from '../components/student/ProfileCard'
import OnboardingSteps from '../components/student/OnboardingSteps'
import RatingsCard from '../components/student/RatingsCard'
import QuickActions from '../components/student/QuickActions'
import LinkCodeSection from '../components/student/LinkCodeSection'
import ParentSection from '../components/student/ParentSection'
import CoachCard from '../components/student/CoachCard'
import GlassCard from '../components/GlassCard'

interface StudentProfile {
  level: string | null
  fideRating: number | null
  clubRating: number | null
  chesscomUsername: string | null
  lichessUsername: string | null
  bio: string | null
  birthdate: string | null
}

interface ParentInfo {
  id: string
  name: string
  email: string
  phone: string | null
  contactMethod: string | null
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

interface LinkCodeState {
  code: string
  expiresAt: string
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [coach, setCoach] = useState<CoachInfo | null>(null)
  const [parent, setParent] = useState<ParentInfo | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [linkCode, setLinkCode] = useState<LinkCodeState | null>(null)
  const [linkCodeLoading, setLinkCodeLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/student/profile', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/student/coach', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/student/parent', { credentials: 'include' }).then(r => r.json()),
    ]).then(([p, c, par]) => {
      setProfile(p)
      setCoach(c)
      setParent(par)
      setLoading(false)
    })
  }, [])

  async function handleGenerateLinkCode() {
    setLinkCodeLoading(true)
    const res = await fetch('/api/student/link-code', { method: 'POST', credentials: 'include' })
    if (res.ok) setLinkCode(await res.json())
    setLinkCodeLoading(false)
  }

  const hasProfile = profile && (
    profile.fideRating || profile.clubRating || profile.level || profile.bio
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <MobileHeader />
          <SignOutButton variant="dark" />
        </div>

        <ProfileCard name={session?.user.name ?? ''} email={session?.user.email ?? ''} level={profile?.level} />

        {!loading && (
          <>
            <OnboardingSteps hasProfile={!!hasProfile} hasCoach={!!coach} />

            {!hasProfile && coach && (
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-4 mb-4 text-sm text-amber-200 flex gap-3">
                <iconify-icon icon="solar:pen-bold-duotone" width="20" height="20" className="flex-shrink-0 mt-0.5 text-amber-300"></iconify-icon>
                <span>
                  Заповни профіль — тренер зможе краще підготуватись до занять.
                  {' '}<Link to="/student/profile/edit" className="underline underline-offset-2 text-white">Заповнити зараз</Link>
                </span>
              </div>
            )}

            <RatingsCard fideRating={profile?.fideRating} clubRating={profile?.clubRating} />

            {(profile?.chesscomUsername || profile?.lichessUsername) && (
              <GlassCard className="p-4 mb-4">
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
              </GlassCard>
            )}

            {coach && <QuickActions onBook={() => navigate('/student/booking')} />}

            {(profile?.bio || profile?.birthdate) && (
              <GlassCard className="p-4 mb-4">
                {profile?.birthdate && (
                  <div className="flex items-center gap-3 text-sm mb-2">
                    <iconify-icon icon="solar:calendar-linear" width="16" height="16" className="text-blue-300 shrink-0"></iconify-icon>
                    <span className="text-blue-200">
                      {new Date(profile.birthdate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {profile?.bio && <p className="text-sm text-blue-100 leading-relaxed">{profile.bio}</p>}
              </GlassCard>
            )}

            <LinkCodeSection code={linkCode} loading={linkCodeLoading} onGenerate={handleGenerateLinkCode} />

            {parent !== undefined && <ParentSection parent={parent} />}
          </>
        )}

        <CoachCard coach={coach} loading={loading} />
      </div>
    </div>
  )
}
