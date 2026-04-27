import { useState } from 'react'
import { Link } from 'react-router'
import { signUp } from '../lib/auth-client'
import { useAsyncSubmit } from '../hooks/useAsyncSubmit'
import ErrorMessage from '../components/ErrorMessage'
import GlassCard from '../components/GlassCard'

type Role = 'student' | 'parent' | 'coach'
type ContactMethod = 'telegram' | 'whatsapp' | 'viber'

const ROLES: { value: Role; label: string; icon: string; desc: string }[] = [
  { value: 'student', label: 'Я учень', icon: 'solar:graduation-cap-linear', desc: 'Вивчаю шахи' },
  { value: 'parent', label: 'Я батько/мати', icon: 'solar:users-group-rounded-linear', desc: 'Реєструю дитину' },
  { value: 'coach', label: 'Я тренер', icon: 'solar:cup-star-linear', desc: 'Навчаю шахів' },
]

const CONTACT_METHODS: { value: ContactMethod; label: string; icon: string; color: string }[] = [
  { value: 'telegram', label: 'Telegram', icon: 'ic:baseline-telegram', color: '#0088CC' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'ic:baseline-whatsapp', color: '#25D366' },
  { value: 'viber', label: 'Viber', icon: 'simple-icons:viber', color: '#7360F2' },
]

export default function Register() {
  const [role, setRole] = useState<Role | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [contactMethod, setContactMethod] = useState<ContactMethod | null>(null)
  const [instagram, setInstagram] = useState('')

  const { run: submitForm, loading, error, reset } = useAsyncSubmit(async () => {
    const { error: signUpError } = await signUp.email({ name, email, password })

    if (signUpError) {
      throw new Error(signUpError.message ?? 'Помилка реєстрації')
    }

    const res = await fetch('/api/users/me/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        role,
        phone: phone || undefined,
        contactMethod: contactMethod || undefined,
        instagram: instagram || undefined,
      }),
    })

    if (!res.ok) {
      throw new Error('Не вдалось встановити роль')
    }

    const data = await res.json() as { status: string }
    window.location.href = data.status === 'pending' ? '/pending' : '/dashboard'
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    reset()
    submitForm()
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

        <GlassCard className="p-8">
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
            {/* 1. Ім'я та прізвище */}
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-1.5">Ім'я та прізвище</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/50 transition-colors text-sm"
                placeholder="Іван Петренко"
              />
            </div>

            {/* 2. Пароль */}
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

            {/* 3. Номер телефону */}
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-1.5">Номер телефону</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/50 transition-colors text-sm"
                placeholder="+38 (098) 000-00-00"
              />
            </div>

            {/* 4. Email */}
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

            {/* 5. Зручний спосіб зв'язку */}
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-2">Зручний спосіб зв'язку</label>
              <div className="grid grid-cols-3 gap-2">
                {CONTACT_METHODS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setContactMethod(m.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all text-center ${
                      contactMethod === m.value
                        ? 'bg-white border-white'
                        : 'bg-white/5 border-white/20 text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    <iconify-icon
                      icon={m.icon}
                      width="22"
                      height="22"
                      style={{ color: contactMethod === m.value ? m.color : 'currentColor' }}
                    ></iconify-icon>
                    <span className={`text-xs font-semibold leading-tight ${contactMethod === m.value ? 'text-gray-700' : ''}`}>
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Instagram */}
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-1.5">
                Instagram
                <span className="ml-1.5 text-blue-200/60 font-normal text-xs">(нік або посилання)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-200/50">
                  <iconify-icon icon="mdi:instagram" width="18" height="18"></iconify-icon>
                </span>
                <input
                  type="text"
                  value={instagram}
                  onChange={e => setInstagram(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/50 transition-colors text-sm"
                  placeholder="@yeschess.school"
                />
              </div>
              <p className="mt-1 text-blue-200/50 text-xs">Ми активно ведемо Instagram і можемо там комунікувати</p>
            </div>

            <ErrorMessage error={error} variant="auth" />

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
