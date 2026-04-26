import { Link } from 'react-router'
import { LevelBadge } from '../Badge'

interface ProfileCardProps {
  name: string
  email: string
  level?: string | null
}

export default function ProfileCard({ name, email, level }: ProfileCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-4 text-white">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
            <iconify-icon icon="solar:user-bold-duotone" width="28" height="28"></iconify-icon>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold font-heading truncate">{name}</h1>
            <p className="text-blue-200 text-sm truncate">{email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs px-2.5 py-0.5 bg-white/10 border border-white/20 rounded-full text-blue-100">
                Учень
              </span>
              {level && <LevelBadge level={level} />}
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
  )
}
