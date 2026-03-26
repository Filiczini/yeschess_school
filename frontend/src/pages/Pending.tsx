import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { signOut } from '../lib/auth-client'

export default function Pending() {
  const navigate = useNavigate()

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' })
        const data = await res.json()
        if (data?.status === 'active') {
          clearInterval(interval)
          navigate('/dashboard', { replace: true })
        }
      } catch {
        // ignore network errors, keep polling
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [navigate])

  async function handleSignOut() {
    await signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand">
            <iconify-icon icon="solar:crown-linear" width="22" height="22"></iconify-icon>
          </div>
          <span className="text-white font-bold tracking-tight text-xl uppercase font-heading">YesChess</span>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
          <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <iconify-icon icon="solar:hourglass-line-duotone" width="32" height="32"></iconify-icon>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 font-heading">На розгляді</h1>
          <p className="text-blue-200 text-sm leading-relaxed mb-6">
            Ваша заявка як тренера прийнята і зараз розглядається адміністратором.
            Ми повідомимо вас після підтвердження.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex items-center gap-2 text-blue-200 text-sm">
              <iconify-icon icon="solar:check-circle-linear" width="16" height="16"></iconify-icon>
              Акаунт створено
            </div>
            <div className="flex items-center gap-2 text-blue-200 text-sm">
              <iconify-icon icon="solar:clock-circle-linear" width="16" height="16"></iconify-icon>
              Перевірка адміністратором
            </div>
            <div className="flex items-center gap-2 text-blue-200/40 text-sm">
              <iconify-icon icon="solar:lock-keyhole-linear" width="16" height="16"></iconify-icon>
              Доступ до платформи
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Вийти
          </button>
        </div>
      </div>
    </div>
  )
}
