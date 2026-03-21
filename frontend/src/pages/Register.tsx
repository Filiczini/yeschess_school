import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { signUp } from '../lib/auth-client'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signUp.email({ name, email, password })

    if (error) {
      setError(error.message ?? 'Помилка реєстрації')
    } else {
      navigate('/dashboard')
    }

    setLoading(false)
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
          <h1 className="text-2xl font-bold text-white mb-1 font-heading">Реєстрація</h1>
          <p className="text-blue-200 text-sm mb-6">Створіть акаунт YesChess</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-1.5">Ім'я</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/50 transition-colors text-sm"
                placeholder="Іван Петренко"
              />
            </div>

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
              <label className="block text-blue-100 text-sm font-medium mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
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
              {loading ? 'Реєстрація...' : 'Зареєструватись'}
            </button>
          </form>

          <p className="mt-6 text-center text-blue-200 text-sm">
            Вже є акаунт?{' '}
            <Link to="/login" className="text-white font-medium hover:underline">
              Увійти
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center">
          <Link to="/" className="text-blue-200/60 text-sm hover:text-blue-200 transition-colors">
            ← На головну
          </Link>
        </p>
      </div>
    </div>
  )
}
