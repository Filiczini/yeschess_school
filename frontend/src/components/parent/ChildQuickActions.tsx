import { useNavigate } from 'react-router'

interface ChildQuickActionsProps {
  childId: string
  upcomingBookings: number
}

export default function ChildQuickActions({ childId, upcomingBookings }: ChildQuickActionsProps) {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <button
        onClick={() => navigate(`/parent/booking?childId=${childId}`)}
        className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white hover:border-white/40 transition-colors text-left"
      >
        <iconify-icon icon="solar:calendar-add-bold-duotone" width="26" height="26" className="mb-2 block"></iconify-icon>
        <div className="font-semibold text-sm font-heading">Записати</div>
        <div className="text-xs text-blue-200 mt-0.5">Обрати слот</div>
      </button>
      <button
        onClick={() => navigate(`/parent/bookings?childId=${childId}`)}
        className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white hover:border-white/40 transition-colors text-left"
      >
        <iconify-icon icon="solar:calendar-check-bold-duotone" width="26" height="26" className="mb-2 block"></iconify-icon>
        <div className="font-semibold text-sm font-heading">Заняття</div>
        <div className="text-xs text-blue-200 mt-0.5">
          {upcomingBookings > 0
            ? `${upcomingBookings} заплановано`
            : 'Розклад та статус'}
        </div>
      </button>
    </div>
  )
}
