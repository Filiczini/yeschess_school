import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

export default function ParentAddChild() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'new' | 'code'>('new')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    level: 'beginner',
    birthdate: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [codeInput, setCodeInput] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/parent/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    })
    if (res.ok) {
      navigate('/parent')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Помилка при додаванні дитини')
    }
    setLoading(false)
  }

  async function handleLinkByCode(e: React.FormEvent) {
    e.preventDefault()
    setCodeLoading(true)
    setCodeError(null)
    const res = await fetch('/api/parent/link-child', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code: codeInput }),
    })
    if (res.ok) {
      navigate('/parent')
    } else {
      const data = await res.json()
      setCodeError(data.error ?? 'Помилка')
    }
    setCodeLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      <div className="max-w-sm mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-white">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-brand">
              <iconify-icon icon="solar:crown-linear" width="20" height="20"></iconify-icon>
            </div>
            <span className="font-bold tracking-tight text-lg uppercase font-heading">YesChess</span>
          </div>
          <Link
            to="/parent"
            className="text-blue-200 hover:text-white text-sm transition-colors flex items-center gap-1.5"
          >
            <iconify-icon icon="solar:arrow-left-linear" width="16" height="16"></iconify-icon>
            Назад
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white">
          <h1 className="text-xl font-bold font-heading mb-4">Додати дитину</h1>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-white/10 rounded-xl mb-6">
            <button
              onClick={() => { setTab('new'); setError(null) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                tab === 'new' ? 'bg-white text-brand' : 'text-blue-200 hover:text-white'
              }`}
            >
              Новий акаунт
            </button>
            <button
              onClick={() => { setTab('code'); setCodeError(null) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                tab === 'code' ? 'bg-white text-brand' : 'text-blue-200 hover:text-white'
              }`}
            >
              Є акаунт
            </button>
          </div>

          {/* New account form */}
          {tab === 'new' && (
            <>
              <p className="text-blue-200 text-sm mb-4">Створіть акаунт для вашої дитини</p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-sm text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm text-blue-200 mb-1.5">Ім'я</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Іван Петренко"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-blue-300/50 focus:outline-none focus:border-white/40 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-blue-200 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="ivan@example.com"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-blue-300/50 focus:outline-none focus:border-white/40 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-blue-200 mb-1.5">Пароль</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Мінімум 8 символів"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-blue-300/50 focus:outline-none focus:border-white/40 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-blue-200 mb-1.5">Рівень шахів</label>
                  <select
                    value={form.level}
                    onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/40 text-sm"
                  >
                    <option value="beginner" className="text-gray-900">Початківець</option>
                    <option value="intermediate" className="text-gray-900">Середній</option>
                    <option value="advanced" className="text-gray-900">Просунутий</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-blue-200 mb-1.5">
                    Дата народження{' '}
                    <span className="text-blue-300/60">(необов'язково)</span>
                  </label>
                  <input
                    type="date"
                    value={form.birthdate}
                    onChange={e => setForm(f => ({ ...f, birthdate: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/40 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-brand font-semibold rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
                >
                  {loading ? 'Створення...' : 'Створити акаунт'}
                </button>
              </form>
            </>
          )}

          {/* Link by code */}
          {tab === 'code' && (
            <>
              <p className="text-blue-200 text-sm mb-6">
                Дитина вже зареєстрована? Попросіть її згенерувати код у своєму акаунті та введіть його нижче.
              </p>

              {codeError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-sm text-red-300">
                  {codeError}
                </div>
              )}

              <form onSubmit={handleLinkByCode} className="space-y-4">
                <div>
                  <label className="block text-sm text-blue-200 mb-1.5">Код від учня</label>
                  <input
                    value={codeInput}
                    onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeError(null) }}
                    placeholder="8X4K92JF"
                    maxLength={8}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-blue-300/30 focus:outline-none focus:border-white/40 text-xl tracking-[0.3em] font-mono text-center uppercase"
                  />
                </div>

                <button
                  type="submit"
                  disabled={codeInput.length < 6 || codeLoading}
                  className="w-full py-3 bg-white text-brand font-semibold rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {codeLoading ? 'Перевірка...' : "Прив'язати"}
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
