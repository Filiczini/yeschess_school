import { Link } from 'react-router'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center px-4">
      <div className="text-center text-white max-w-sm w-full">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand">
            <iconify-icon icon="solar:crown-linear" width="22" height="22"></iconify-icon>
          </div>
          <span className="font-bold tracking-tight text-xl uppercase font-heading">YesChess</span>
        </div>

        <div className="text-8xl font-bold font-heading mb-4 opacity-30">404</div>
        <h1 className="text-2xl font-bold font-heading mb-2">Сторінку не знайдено</h1>
        <p className="text-blue-200 text-sm mb-8">
          Схоже, ця сторінка не існує або була переміщена.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand font-semibold rounded-xl text-sm hover:bg-blue-50 transition-colors"
        >
          <iconify-icon icon="solar:arrow-left-linear" width="18" height="18"></iconify-icon>
          На головну
        </Link>
      </div>
    </div>
  )
}
