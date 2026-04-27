import { Link } from 'react-router'
import { useSession } from '../../lib/auth-client'

interface HeroSectionProps {
  onOpenLead: () => void
}

export default function HeroSection({ onOpenLead }: HeroSectionProps) {
  const { data: session } = useSession()

  return (
    <section className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6 py-24">
      <div className="flex items-center justify-center gap-3 mb-10">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand">
          <iconify-icon icon="solar:crown-linear" width="28" height="28"></iconify-icon>
        </div>
        <span className="text-white font-bold tracking-tight text-2xl uppercase font-heading">YesChess</span>
      </div>

      <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-[1.1] font-heading max-w-2xl">
        Шахова школа для{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">дітей і дорослих</span>
      </h1>

      <p className="text-base md:text-lg text-blue-100 mb-10 font-medium leading-relaxed max-w-lg mx-auto">
        Онлайн та офлайн заняття у Києві. Досвідчені тренери, системна підготовка, щонедільні турніри.
      </p>

      <div className="flex items-center justify-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={onOpenLead}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand rounded-2xl font-semibold text-sm hover:bg-blue-50 hover:shadow-lg hover:shadow-white/10 transition-all duration-300"
        >
          <iconify-icon icon="solar:pen-new-square-linear" width="18" height="18"></iconify-icon>
          Залишити заявку
        </button>
        <a
          href="tel:+380980837742"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold text-sm hover:bg-white/20 transition-all duration-300 border border-white/20"
        >
          <iconify-icon icon="solar:phone-linear" width="18" height="18"></iconify-icon>
          +38 (098) 083-77-42
        </a>
        {session ? (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold text-sm hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            <iconify-icon icon="solar:user-circle-linear" width="18" height="18"></iconify-icon>
            Мій профіль
          </Link>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold text-sm hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            Увійти
          </Link>
        )}
      </div>
    </section>
  )
}
