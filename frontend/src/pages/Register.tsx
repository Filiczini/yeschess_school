import { useState } from 'react'
import { Link } from 'react-router'
import { signUp } from '../lib/auth-client'

type Role = 'student' | 'parent' | 'coach'

const ROLES: { value: Role; label: string; icon: string; desc: string }[] = [
  { value: 'student', label: 'Я учень', icon: 'solar:graduation-cap-linear', desc: 'Вивчаю шахи' },
  { value: 'parent', label: 'Я батько/мати', icon: 'solar:users-group-rounded-linear', desc: 'Реєструю дитину' },
  { value: 'coach', label: 'Я тренер', icon: 'solar:cup-star-linear', desc: 'Навчаю шахів' },
]

export default function Register() {
  const [role, setRole] = useState<Role | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    setError('')
    setLoading(true)

    const { error: signUpError } = await signUp.email({ name, email, password })

    if (signUpError) {
      setError(signUpError.message ?? 'Помилка реєстрації')
      setLoading(false)
      return
    }

    // Set the selected role
    const res = await fetch('/api/users/me/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role }),
    })

    if (!res.ok) {
      setError('Не вдалось встановити роль')
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand">
            <iconify-icon icon="solar:crown-linear" width="22" height="22"></iconify-icon>
          </div>
          <span className="text-white font-bold tracking-tight text-xl uppercase font-heading">YesChess</span>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1 font-heading">Реєстрація</h1>
          <p className="text-blue-200 text-sm mb-6">Хто ви?</p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${
                  role === r.value
                    ? 'bg-white text-brand border-white'
                    : 'bg-white/5 border-white/20 text-blue-100 hover:bg-white/10'
                }`}
              >
                <iconify-icon icon={r.icon} width="22" height="22"></iconify-icon>
                <span className="text-xs font-semibold leading-tight">{r.label}</span>
              </button>
            ))}
          </div>

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
                placeholder="мін. 8 символів"
              />
            </div>

            {error && <p className="text-red-300 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || !role}
              className="w-full py-3 bg-white text-brand rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors disabled:opacity-40"
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
