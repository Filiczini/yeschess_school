import { Link } from 'react-router'

interface QuickActionsProps {
  onBook: () => void
}

export default function QuickActions({ onBook }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <button
        onClick={onBook}
        className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white hover:border-white/40 transition-colors text-left"
      >
        <iconify-icon icon="solar:calendar-add-bold-duotone" width="26" height="26" className="mb-2 block"></iconify-icon>
        <div className="font-semibold text-sm font-heading">Записатись</div>
        <div className="text-xs text-blue-200 mt-0.5">Обрати слот</div>
      </button>
      <Link
        to="/student/booking"
        className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white hover:border-white/40 transition-colors"
      >
        <iconify-icon icon="solar:calendar-check-bold-duotone" width="26" height="26" className="mb-2 block"></iconify-icon>
        <div className="font-semibold text-sm font-heading">Мої заняття</div>
        <div className="text-xs text-blue-200 mt-0.5">Розклад та статус</div>
      </Link>
    </div>
  )
}
