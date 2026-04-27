import { Link } from 'react-router'
import GlassCard from '../GlassCard'

interface WelcomeCardProps {
  name?: string
  email?: string
}

export default function WelcomeCard({ name, email }: WelcomeCardProps) {
  return (
    <GlassCard className="p-6 mb-4 text-white">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
            <iconify-icon icon="solar:users-group-rounded-bold-duotone" width="28" height="28"></iconify-icon>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold font-heading truncate">{name}</h1>
            <p className="text-blue-200 text-sm truncate">{email}</p>
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
    </GlassCard>
  )
}
