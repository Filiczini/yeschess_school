import GlassCard from '../GlassCard'

interface ChildRatingsProps {
  fideRating: number | null
  clubRating: number | null
}

export default function ChildRatings({ fideRating, clubRating }: ChildRatingsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <GlassCard className="rounded-xl p-4 text-center text-white">
        <iconify-icon icon="solar:ranking-bold-duotone" width="22" height="22" className="mb-1 text-blue-200"></iconify-icon>
        <div className="text-xl font-bold font-heading">{fideRating ?? '—'}</div>
        <div className="text-xs text-blue-200">FIDE рейтинг</div>
      </GlassCard>
      <GlassCard className="rounded-xl p-4 text-center text-white">
        <iconify-icon icon="solar:star-bold-duotone" width="22" height="22" className="mb-1 text-blue-200"></iconify-icon>
        <div className="text-xl font-bold font-heading">{clubRating ?? '—'}</div>
        <div className="text-xs text-blue-200">Клубний рейтинг</div>
      </GlassCard>
    </div>
  )
}
