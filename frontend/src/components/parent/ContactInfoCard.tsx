import { Link } from 'react-router'
import GlassCard from '../GlassCard'

interface ParentProfile {
  phone: string | null
  contactMethod: string | null
  instagram: string | null
}

interface ContactInfoCardProps {
  profile: ParentProfile | null
}

export default function ContactInfoCard({ profile }: ContactInfoCardProps) {
  const hasInfo = profile?.phone || profile?.contactMethod || profile?.instagram

  return (
    <GlassCard className="p-4 mb-4 text-white">
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
      {hasInfo ? (
        <div className="space-y-2">
          {profile?.phone && (
            <div className="flex items-center gap-3 text-sm">
              <iconify-icon icon="solar:phone-linear" width="16" height="16" className="text-blue-300 shrink-0"></iconify-icon>
              <span>{profile.phone}</span>
              {profile.contactMethod && (
                <span className="ml-auto text-xs text-blue-300 capitalize">{profile.contactMethod}</span>
              )}
            </div>
          )}
          {profile?.instagram && (
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
    </GlassCard>
  )
}
