import GlassCard from '../GlassCard'
import { Badge } from '../Badge'

interface ChildCoachCardProps {
  coachName: string | null
  coachTitle: string | null
}

export default function ChildCoachCard({ coachName, coachTitle }: ChildCoachCardProps) {
  return (
    <GlassCard className="p-4 mb-4 text-white">
      <h2 className="text-sm font-semibold text-blue-200 mb-3">Тренер дитини</h2>
      {coachName ? (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
            <iconify-icon icon="solar:user-bold-duotone" width="24" height="24"></iconify-icon>
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{coachName}</div>
            {coachTitle && (
              <Badge className="rounded-full bg-amber-400/20 border-amber-400/30 text-amber-300 mt-1 inline-block">{coachTitle}</Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="text-sm text-blue-300 flex items-center gap-2">
          <iconify-icon icon="solar:user-plus-rounded-linear" width="18" height="18"></iconify-icon>
          Тренер ще не призначений
        </div>
      )}
    </GlassCard>
  )
}
