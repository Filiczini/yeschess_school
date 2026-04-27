import { useState } from 'react'
import { Link } from 'react-router'
import { authClient } from '../lib/auth-client'
import { useAsyncSubmit } from '../hooks/useAsyncSubmit'
import ErrorMessage from '../components/ErrorMessage'
import GlassCard from '../components/GlassCard'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const { run: submitForm, loading, error, reset } = useAsyncSubmit(async () => {
    const { error: authError } = await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    })

    if (authError) {
      throw new Error(authError.message ?? 'Помилка. Спробуйте ще раз.')
    }

    setSent(true)
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    reset()
    submitForm()
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

        <GlassCard className="p-8">
          {sent ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <iconify-icon icon="solar:letter-outline" width="28" height="28"></iconify-icon>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2 font-heading text-center">Лист надіслано</h1>
              <p className="text-blue-200 text-sm text-center leading-relaxed">
                Якщо акаунт з адресою <strong className="text-white">{email}</strong> існує — ви отримаєте лист із посиланням для скидання паролю.
              </p>
              <p className="text-blue-200/60 text-xs text-center mt-3">
                Перевірте папку «Спам», якщо листа немає.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-1 font-heading">Забули пароль?</h1>
              <p className="text-blue-200 text-sm mb-6">Введіть email — надішлемо посилання для скидання</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/50 transition-colors text-sm"
                    placeholder="you@example.com"
                  />
                </div>

                <ErrorMessage error={error} variant="auth" />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-brand rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Надсилаємо...' : 'Надіслати посилання'}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-blue-200 text-sm">
            <Link to="/login" className="text-white font-medium hover:underline">
              ← Повернутись до входу
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  )
}
