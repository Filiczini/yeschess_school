import { Badge } from '../Badge'

interface CoachCardProps {
  coach?: {
    coachName: string
    coachEmail: string
    title?: string | null
    fideRating?: number | null
    avgRating?: string | null
    totalReviews: number
    specializations: string[]
    bio?: string | null
  } | null
  loading?: boolean
}

export default function CoachCard({ coach, loading }: CoachCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-4 text-white">
      <h2 className="text-sm font-semibold text-blue-200 mb-3">Мій тренер</h2>
      {loading ? (
        <div className="text-sm text-blue-200">Завантаження...</div>
      ) : coach ? (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
            <iconify-icon icon="solar:user-bold-duotone" width="24" height="24"></iconify-icon>
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{coach.coachName}</div>
            <div className="text-sm text-blue-200 truncate">{coach.coachEmail}</div>
            <div className="flex items-center gap-2 mt-1">
              {coach.title && (
                <Badge className="rounded-full bg-amber-400/20 border-amber-400/30 text-amber-300">{coach.title}</Badge>
              )}
              {coach.fideRating && (
                <span className="text-xs text-blue-300">FIDE {coach.fideRating}</span>
              )}
              {coach.avgRating && (
                <span className="text-xs text-blue-300 flex items-center gap-0.5">
                  <iconify-icon icon="solar:star-bold" width="12" height="12" className="text-amber-400"></iconify-icon>
                  {parseFloat(coach.avgRating).toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-blue-300 flex items-center gap-2">
          <iconify-icon icon="solar:user-plus-rounded-linear" width="18" height="18"></iconify-icon>
          Тренер ще не призначений
        </div>
      )}
    </div>
  )
}
