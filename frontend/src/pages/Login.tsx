import { useState } from 'react'
import { Link } from 'react-router'
import { signIn } from '../lib/auth-client'
import { useAsyncSubmit } from '../hooks/useAsyncSubmit'
import ErrorMessage from '../components/ErrorMessage'
import GlassCard from '../components/GlassCard'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { run: submitForm, loading, error, reset } = useAsyncSubmit(async () => {
    const { error: authError } = await signIn.email({ email, password })

    if (authError) {
      throw new Error(authError.message ?? 'Помилка входу')
    }

    window.location.href = '/dashboard'
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
          <h1 className="text-2xl font-bold text-white mb-1 font-heading">Вхід</h1>
          <p className="text-blue-200 text-sm mb-6">Введіть ваші дані</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/50 transition-colors text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-blue-100 text-sm font-medium">Пароль</label>
                <Link to="/forgot-password" className="text-blue-200/70 text-xs hover:text-blue-200 transition-colors">
                  Забули пароль?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/50 transition-colors text-sm"
                placeholder="••••••••"
              />
            </div>

            <ErrorMessage error={error} variant="auth" />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-brand rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors disabled:opacity-60"
            >
              {loading ? 'Вхід...' : 'Увійти'}
            </button>
          </form>

          <p className="mt-6 text-center text-blue-200 text-sm">
            Немає акаунту?{' '}
            <Link to="/register" className="text-white font-medium hover:underline">
              Реєстрація
            </Link>
          </p>
        </GlassCard>

        <p className="mt-6 text-center">
          <Link to="/" className="text-blue-200/60 text-sm hover:text-blue-200 transition-colors">
            ← На головну
          </Link>
        </p>
      </div>
    </div>
  )
}
