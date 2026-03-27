import { useEffect, useState } from 'react'

interface Stats {
  totalUsers: number
  pendingCount: number
  enrollmentsCount: number
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setStats(d))
      .catch(() => {})
  }, [])

  return (
    <div className="p-10 max-w-6xl mx-auto">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

        {/* Total users */}
        <div className="bg-white border border-gray-200/80 p-6 rounded-xl shadow-sm hover:border-brand-light/30 transition-colors flex flex-col gap-4 group">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-lg bg-[#F0EEFA] text-brand-light flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <iconify-icon icon="solar:users-group-two-rounded-linear" width="24" height="24"></iconify-icon>
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md flex items-center gap-1 border border-green-200/50">
              <iconify-icon icon="solar:chart-line-up-linear" width="12" height="12"></iconify-icon>
              Активні
            </span>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Загалом користувачів</div>
            <div className="font-heading text-3xl font-medium tracking-tight text-gray-900">
              {stats ? stats.totalUsers.toLocaleString('uk-UA') : '—'}
            </div>
          </div>
        </div>

        {/* Enrollments */}
        <div className="bg-white border border-gray-200/80 p-6 rounded-xl shadow-sm hover:border-brand-light/30 transition-colors flex flex-col gap-4 group">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-lg bg-[#F0EEFA] text-brand-light flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <iconify-icon icon="solar:diploma-linear" width="24" height="24"></iconify-icon>
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md flex items-center gap-1 border border-green-200/50">
              <iconify-icon icon="solar:chart-line-up-linear" width="12" height="12"></iconify-icon>
              Активні
            </span>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Записи учнів до тренерів</div>
            <div className="font-heading text-3xl font-medium tracking-tight text-gray-900">
              {stats ? stats.enrollmentsCount.toLocaleString('uk-UA') : '—'}
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white border border-gray-200/80 p-6 rounded-xl shadow-sm hover:border-amber-400 transition-colors flex flex-col gap-4 group relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50/50 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <iconify-icon icon="solar:inbox-linear" width="24" height="24"></iconify-icon>
            </div>
            {stats && stats.pendingCount > 0 && (
              <span className="text-xs font-medium text-amber-700 bg-amber-100/50 px-2 py-1 rounded-md border border-amber-200/50">
                Потребує уваги
              </span>
            )}
          </div>
          <div className="relative z-10">
            <div className="text-sm text-gray-500 mb-1">Заявки на розгляді</div>
            <div className="font-heading text-3xl font-medium tracking-tight text-gray-900">
              {stats ? stats.pendingCount.toLocaleString('uk-UA') : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm min-h-[400px] flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
        <div className="w-16 h-16 bg-[#F0EEFA]/50 border border-brand-light/10 rounded-xl flex items-center justify-center mb-6">
          <iconify-icon icon="solar:cursor-linear" width="32" height="32" className="text-brand-light/60"></iconify-icon>
        </div>
        <h3 className="font-heading text-xl font-medium tracking-tight text-gray-900 mb-2">Оберіть розділ меню</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Використовуйте бокову панель ліворуч для навігації по системі. Ви можете керувати користувачами, призначати учнів до тренерів або переглядати нові заявки.
        </p>
      </div>

    </div>
  )
}
