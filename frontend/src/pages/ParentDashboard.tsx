import { useEffect, useState } from 'react'
import { useSession } from '../lib/auth-client'
import SignOutButton from '../components/SignOutButton'
import MobileHeader from '../components/MobileHeader'
import WelcomeCard from '../components/parent/WelcomeCard'
import ContactInfoCard from '../components/parent/ContactInfoCard'
import OnboardingSteps from '../components/parent/OnboardingSteps'
import ChildSelector from '../components/parent/ChildSelector'
import ChildInfoCard from '../components/parent/ChildInfoCard'
import ChildRatings from '../components/parent/ChildRatings'
import ChildQuickActions from '../components/parent/ChildQuickActions'
import ChildCoachCard from '../components/parent/ChildCoachCard'

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

        <WelcomeCard name={session?.user.name} email={session?.user.email} />

        <ContactInfoCard profile={profile} />

        {!loading && children.length === 0 && <OnboardingSteps />}

        {!loading && children.length > 0 && (
          <>
            <ChildSelector
              children={children}
              selectedChildId={selectedChildId}
              onSelect={setSelectedChildId}
            />

            {selectedChild && (
              <>
                <ChildInfoCard child={selectedChild} />
                <ChildRatings
                  fideRating={selectedChild.fideRating}
                  clubRating={selectedChild.clubRating}
                />
                {selectedChild.coachName && (
                  <ChildQuickActions
                    childId={selectedChild.id}
                    upcomingBookings={selectedChild.upcomingBookings}
                  />
                )}
                <ChildCoachCard
                  coachName={selectedChild.coachName}
                  coachTitle={selectedChild.coachTitle}
                />
              </>
            )}
          </>
        )}

      </div>
    </div>
  )
}
