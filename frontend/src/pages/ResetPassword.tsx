import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { authClient } from '../lib/auth-client'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Пароль має містити щонайменше 8 символів')
      return
    }
    if (password !== confirm) {
      setError('Паролі не збігаються')
      return
    }

    setLoading(true)

    const { error } = await authClient.resetPassword({ newPassword: password, token })

    if (error) {
      setError(error.message ?? 'Помилка скидання паролю. Посилання могло застаріти.')
    } else {
      setDone(true)
    }

    setLoading(false)
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center">
            <iconify-icon icon="solar:danger-triangle-outline" width="40" height="40"></iconify-icon>
            <h1 className="text-xl font-bold text-white mb-2 font-heading">Недійсне посилання</h1>
            <p className="text-blue-200 text-sm mb-6">Посилання для скидання паролю відсутнє або пошкоджене.</p>
            <Link to="/forgot-password" className="inline-block w-full py-3 bg-white text-brand rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors text-center">
              Запросити нове посилання
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand">
            <iconify-icon icon="solar:crown-linear" width="22" height="22"></iconify-icon>
          </div>
          <span className="text-white font-bold tracking-tight text-xl uppercase font-heading">YesChess</span>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
          {done ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <iconify-icon icon="solar:check-circle-outline" width="32" height="32"></iconify-icon>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2 font-heading text-center">Пароль змінено!</h1>
              <p className="text-blue-200 text-sm text-center mb-6">Тепер можете увійти з новим паролем.</p>
              <Link
                to="/login"
                className="block w-full py-3 bg-white text-brand rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors text-center"
              >
                Увійти
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-1 font-heading">Новий пароль</h1>
              <p className="text-blue-200 text-sm mb-6">Введіть новий пароль для вашого акаунту</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-1.5">Новий пароль</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/50 transition-colors text-sm"
                    placeholder="Мінімум 8 символів"
                  />
                </div>

                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-1.5">Підтвердіть пароль</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/50 transition-colors text-sm"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-red-300 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-brand rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Зберігаємо...' : 'Зберегти пароль'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
