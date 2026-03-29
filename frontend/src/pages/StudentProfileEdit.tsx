import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

interface FormState {
  level: string
  fideRating: string
  clubRating: string
  chesscomUsername: string
  lichessUsername: string
  bio: string
  birthdate: string
}

const EMPTY: FormState = {
  level: '',
  fideRating: '',
  clubRating: '',
  chesscomUsername: '',
  lichessUsername: '',
  bio: '',
  birthdate: '',
}

export default function StudentProfileEdit() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/student/profile', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data) {
          setForm({
            level: data.level ?? '',
            fideRating: data.fideRating?.toString() ?? '',
            clubRating: data.clubRating?.toString() ?? '',
            chesscomUsername: data.chesscomUsername ?? '',
            lichessUsername: data.lichessUsername ?? '',
            bio: data.bio ?? '',
            birthdate: data.birthdate ? data.birthdate.slice(0, 10) : '',
          })
        }
        setLoading(false)
      })
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body: Record<string, unknown> = {
      level: form.level || undefined,
      fideRating: form.fideRating ? parseInt(form.fideRating) : undefined,
      clubRating: form.clubRating ? parseInt(form.clubRating) : undefined,
      chesscomUsername: form.chesscomUsername || undefined,
      lichessUsername: form.lichessUsername || undefined,
      bio: form.bio || undefined,
      birthdate: form.birthdate || undefined,
    }

    const res = await fetch('/api/student/profile', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      navigate('/student')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Помилка збереження')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center">
        <div className="text-white text-sm">Завантаження...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 text-white mb-8">
          <button
            onClick={() => navigate('/student')}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors"
          >
            <iconify-icon icon="solar:arrow-left-linear" width="18" height="18"></iconify-icon>
          </button>
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-brand">
            <iconify-icon icon="solar:crown-linear" width="20" height="20"></iconify-icon>
          </div>
          <span className="font-bold tracking-tight text-lg uppercase font-heading">YesChess</span>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white">
          <h1 className="text-xl font-bold font-heading mb-6">Мій профіль</h1>

          {error && (
            <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-3 mb-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Level */}
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Рівень</label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/50 [&>option]:text-black"
              >
                <option value="">Не вказано</option>
                <option value="beginner">Початківець</option>
                <option value="intermediate">Середній</option>
                <option value="advanced">Просунутий</option>
              </select>
            </div>

            {/* Ratings */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-blue-200 mb-1.5">FIDE рейтинг</label>
                <input
                  type="number"
                  name="fideRating"
                  value={form.fideRating}
                  onChange={handleChange}
                  placeholder="напр. 1500"
                  min={0}
                  max={3000}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-blue-300/50 focus:outline-none focus:border-white/50"
                />
              </div>
              <div>
                <label className="block text-sm text-blue-200 mb-1.5">Клубний рейтинг</label>
                <input
                  type="number"
                  name="clubRating"
                  value={form.clubRating}
                  onChange={handleChange}
                  placeholder="напр. 1200"
                  min={0}
                  max={3000}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-blue-300/50 focus:outline-none focus:border-white/50"
                />
              </div>
            </div>

            {/* Platform usernames */}
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Chess.com нікнейм</label>
              <input
                type="text"
                name="chesscomUsername"
                value={form.chesscomUsername}
                onChange={handleChange}
                placeholder="ваш нікнейм"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-blue-300/50 focus:outline-none focus:border-white/50"
              />
            </div>
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Lichess нікнейм</label>
              <input
                type="text"
                name="lichessUsername"
                value={form.lichessUsername}
                onChange={handleChange}
                placeholder="ваш нікнейм"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-blue-300/50 focus:outline-none focus:border-white/50"
              />
            </div>

            {/* Birthdate */}
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Дата народження</label>
              <input
                type="date"
                name="birthdate"
                value={form.birthdate}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/50 [color-scheme:dark]"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Про себе</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Розкажи про себе..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-blue-300/50 focus:outline-none focus:border-white/50 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-white text-brand font-semibold rounded-xl text-sm hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {saving ? 'Збереження...' : 'Зберегти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
