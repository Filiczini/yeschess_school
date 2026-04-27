import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useSession } from '../lib/auth-client'
import { useAsyncSubmit } from '../hooks/useAsyncSubmit'
import ErrorMessage from '../components/ErrorMessage'
import MobileHeader from '../components/MobileHeader'
import GlassCard from '../components/GlassCard'

export default function ParentProfileEdit() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    contactMethod: '',
    instagram: '',
  })

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then(r => r.json())
      .then((data: { name: string; phone: string | null; contactMethod: string | null; instagram: string | null }) => {
        setForm({
          name: data.name ?? '',
          phone: data.phone ?? '',
          contactMethod: data.contactMethod ?? '',
          instagram: data.instagram ?? '',
        })
      })
      .catch(() => {})
  }, [])

  const { run: submitForm, loading, error, reset } = useAsyncSubmit(async () => {
    const res = await fetch('/api/parent/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Помилка')
    }
    navigate('/parent')
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    reset()
    submitForm()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      <div className="max-w-sm mx-auto">

        {/* Header */}
        <MobileHeader backTo="/parent" />

        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <iconify-icon icon="solar:user-bold-duotone" width="24" height="24"></iconify-icon>
            </div>
            <div className="min-w-0">
              <div className="font-bold font-heading truncate">{session?.user.name}</div>
              <div className="text-sm text-blue-200 truncate">{session?.user.email}</div>
            </div>
          </div>

          <ErrorMessage error={error} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Ім'я</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-blue-300/50 focus:outline-none focus:border-white/40 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Номер телефону</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+380 00 000 0000"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-blue-300/50 focus:outline-none focus:border-white/40 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Спосіб зв'язку</label>
              <select
                value={form.contactMethod}
                onChange={e => setForm(f => ({ ...f, contactMethod: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/40 text-sm"
              >
                <option value="" className="text-gray-900">Не вказано</option>
                <option value="telegram" className="text-gray-900">Telegram</option>
                <option value="viber" className="text-gray-900">Viber</option>
                <option value="whatsapp" className="text-gray-900">WhatsApp</option>
                <option value="phone" className="text-gray-900">Дзвінок</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-blue-200 mb-1.5">
                Instagram{' '}
                <span className="text-blue-300/60">(без @)</span>
              </label>
              <input
                type="text"
                value={form.instagram}
                onChange={e => setForm(f => ({ ...f, instagram: e.target.value.replace('@', '') }))}
                placeholder="username"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-blue-300/50 focus:outline-none focus:border-white/40 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-brand font-semibold rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
            >
              {loading ? 'Збереження...' : 'Зберегти'}
            </button>
          </form>
        </GlassCard>

      </div>
    </div>
  )
}
