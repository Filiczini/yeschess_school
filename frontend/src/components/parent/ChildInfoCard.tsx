import { LevelBadge } from '../Badge'
import GlassCard from '../GlassCard'

interface Child {
  name: string
  email: string
  level: string | null
}

interface ChildInfoCardProps {
  child: Child
}

export default function ChildInfoCard({ child }: ChildInfoCardProps) {
  return (
    <GlassCard className="p-6 mb-4 text-white">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
          <iconify-icon icon="solar:user-bold-duotone" width="28" height="28"></iconify-icon>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-lg font-heading truncate">{child.name}</div>
          <div className="text-sm text-blue-200 truncate">{child.email}</div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs px-2.5 py-0.5 bg-white/10 border border-white/20 rounded-full text-blue-100">
              Учень
            </span>
            {child.level && (
              <LevelBadge level={child.level} />
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
