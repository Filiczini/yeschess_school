import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAsyncSubmit } from '../hooks/useAsyncSubmit'
import ErrorMessage from '../components/ErrorMessage'
import MobileHeader from '../components/MobileHeader'
import GlassCard from '../components/GlassCard'

const CHESS_TITLES = ['CM', 'NM', 'FM', 'IM', 'GM', 'WFM', 'WIM', 'WGM']

const LANGUAGES = ['Українська', 'Англійська', 'Польська', 'Німецька', 'Французька', 'Іспанська']

const SPECIALIZATIONS = [
  'Дебют', 'Миттєва гра', 'Блискавка', 'Ендшпіль', 'Стратегія',
  'Тактика', 'Шахові завдання', 'Підготовка до турніру',
]


export default function CoachProfileEdit() {
  const navigate = useNavigate()

  // form state
  const [bio, setBio] = useState('')
  const [title, setTitle] = useState('')
  const [fideRating, setFideRating] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [specializations, setSpecializations] = useState<string[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/coach/profile', { credentials: 'include' })
      .then(r => r.json())
      .then((data: { bio: string | null; title: string | null; fideRating: number | null; hourlyRate: string; languages: string[]; specializations: string[] }) => {
        setBio(data.bio ?? '')
        setTitle(data.title ?? '')
        setFideRating(data.fideRating?.toString() ?? '')
        setHourlyRate(data.hourlyRate ?? '')
        setLanguages(data.languages ?? [])
        setSpecializations(data.specializations ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const { run: saveProfile, loading: saving, error, reset } = useAsyncSubmit(async () => {
    if (!hourlyRate) throw new Error('Вкажіть ставку за годину')

    const res = await fetch('/api/coach/profile', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bio: bio || undefined,
        title: title || undefined,
        fideRating: fideRating ? Number(fideRating) : undefined,
        hourlyRate,
        languages,
        specializations,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Помилка збереження')
    }

    navigate('/coach/profile')
  })

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    reset()
    saveProfile()
  }

  function toggleItem(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center">
        <div className="text-white/60 text-sm">Завантаження...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <MobileHeader backTo="/coach/profile" />

        <h1 className="text-white text-2xl font-bold font-heading mb-6">Мій профіль</h1>

        <form onSubmit={handleSave} className="space-y-4">

          {/* Bio */}
          <GlassCard className="p-6">
            <h2 className="text-white font-semibold font-heading mb-4 flex items-center gap-2">
              <iconify-icon icon="solar:document-text-linear" width="18" height="18"></iconify-icon>
              Про себе
            </h2>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={4}
              placeholder="Розкажіть про свій досвід, підхід до навчання..."
              className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/50 resize-none"
            />
          </GlassCard>

          {/* Chess info */}
          <GlassCard className="p-6">
            <h2 className="text-white font-semibold font-heading mb-4 flex items-center gap-2">
              <iconify-icon icon="solar:chess-knight-linear" width="18" height="18"></iconify-icon>
              Шахові дані
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-blue-200 text-xs mb-1.5 block">Звання FIDE</label>
                <select
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/50 [&>option]:text-black"
                >
                  <option value="">— немає —</option>
                  {CHESS_TITLES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-blue-200 text-xs mb-1.5 block">Рейтинг FIDE</label>
                <input
                  type="number"
                  value={fideRating}
                  onChange={e => setFideRating(e.target.value)}
                  placeholder="наприклад 1850"
                  min={100}
                  max={3000}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/50"
                />
              </div>
            </div>
          </GlassCard>

          {/* Rate */}
          <GlassCard className="p-6">
            <h2 className="text-white font-semibold font-heading mb-4 flex items-center gap-2">
              <iconify-icon icon="solar:wallet-linear" width="18" height="18"></iconify-icon>
              Ставка
            </h2>
            <div>
              <label className="text-blue-200 text-xs mb-1.5 block">Ціна за годину (₴)</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={e => setHourlyRate(e.target.value)}
                placeholder="500"
                min={0}
                required
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/50"
              />
            </div>
          </GlassCard>

          {/* Languages */}
          <GlassCard className="p-6">
            <h2 className="text-white font-semibold font-heading mb-4 flex items-center gap-2">
              <iconify-icon icon="solar:global-linear" width="18" height="18"></iconify-icon>
              Мови навчання
            </h2>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleItem(languages, setLanguages, lang)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    languages.includes(lang)
                      ? 'bg-white text-brand border-white font-medium'
                      : 'bg-white/10 text-blue-100 border-white/20 hover:border-white/40'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Specializations */}
          <GlassCard className="p-6">
            <h2 className="text-white font-semibold font-heading mb-4 flex items-center gap-2">
              <iconify-icon icon="solar:target-linear" width="18" height="18"></iconify-icon>
              Спеціалізація
            </h2>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map(spec => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleItem(specializations, setSpecializations, spec)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    specializations.includes(spec)
                      ? 'bg-white text-brand border-white font-medium'
                      : 'bg-white/10 text-blue-100 border-white/20 hover:border-white/40'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </GlassCard>

          <ErrorMessage error={error} variant="dark" />

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-white text-brand rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? 'Зберігаємо...' : 'Зберегти профіль'}
          </button>

        </form>
      </div>
    </div>
  )
}
