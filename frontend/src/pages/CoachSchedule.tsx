import { useEffect, useState } from 'react'
import { Link } from 'react-router'

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

interface DaySlot {
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDuration: number
  isActive: boolean
}

const DEFAULT_SLOT = (dayOfWeek: number): DaySlot => ({
  dayOfWeek,
  startTime: '09:00',
  endTime: '18:00',
  slotDuration: 60,
  isActive: false,
})

export default function CoachSchedule() {
  const [slots, setSlots] = useState<DaySlot[]>(
    Array.from({ length: 7 }, (_, i) => DEFAULT_SLOT(i))
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/coach/schedule', { credentials: 'include' })
      .then(r => r.json())
      .then((rows: DaySlot[]) => {
        if (Array.isArray(rows) && rows.length > 0) {
          setSlots(prev =>
            prev.map(s => {
              const found = rows.find(r => r.dayOfWeek === s.dayOfWeek)
              return found ? { ...s, ...found } : s
            })
          )
        }
        setLoading(false)
      })
  }, [])

  function update(dayOfWeek: number, field: keyof DaySlot, value: unknown) {
    setSlots(prev =>
      prev.map(s => s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s)
    )
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/coach/schedule', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slots),
    })
    setSaving(false)
    if (res.ok) setSaved(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 text-white mb-8">
          <Link
            to="/coach"
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors"
          >
            <iconify-icon icon="solar:arrow-left-linear" width="18" height="18"></iconify-icon>
          </Link>
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-brand">
            <iconify-icon icon="solar:crown-linear" width="20" height="20"></iconify-icon>
          </div>
          <span className="font-bold tracking-tight text-lg uppercase font-heading">YesChess</span>
        </div>

        <h1 className="text-xl font-bold font-heading text-white mb-4">Мій розклад</h1>
        <p className="text-sm text-blue-200 mb-6">
          Вкажи дні та години коли ти доступний. Учні зможуть бронювати заняття в цих слотах.
        </p>

        {loading ? (
          <div className="text-sm text-blue-200">Завантаження...</div>
        ) : (
          <div className="space-y-3 mb-6">
            {slots.map(slot => (
              <div
                key={slot.dayOfWeek}
                className={`bg-white/10 backdrop-blur-sm border rounded-2xl p-4 transition-colors ${
                  slot.isActive ? 'border-white/30' : 'border-white/10 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {/* Toggle */}
                  <button
                    onClick={() => update(slot.dayOfWeek, 'isActive', !slot.isActive)}
                    className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                      slot.isActive ? 'bg-emerald-400' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${
                        slot.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-white font-semibold text-sm w-6">{DAYS[slot.dayOfWeek]}</span>
                  {!slot.isActive && (
                    <span className="text-blue-300 text-xs">Вихідний</span>
                  )}
                </div>

                {slot.isActive && (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div>
                      <label className="block text-xs text-blue-200 mb-1">Початок</label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={e => update(slot.dayOfWeek, 'startTime', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/50 [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-blue-200 mb-1">Кінець</label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={e => update(slot.dayOfWeek, 'endTime', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/50 [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-blue-200 mb-1">Тривалість</label>
                      <select
                        value={slot.slotDuration}
                        onChange={e => update(slot.dayOfWeek, 'slotDuration', parseInt(e.target.value))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/50 [&>option]:text-black"
                      >
                        <option value={30}>30 хв</option>
                        <option value={45}>45 хв</option>
                        <option value={60}>60 хв</option>
                        <option value={90}>90 хв</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="w-full py-3 bg-white text-brand font-semibold rounded-xl text-sm hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            'Збереження...'
          ) : saved ? (
            <>
              <iconify-icon icon="solar:check-circle-bold" width="18" height="18" className="text-emerald-500"></iconify-icon>
              Збережено
            </>
          ) : (
            'Зберегти розклад'
          )}
        </button>
      </div>
    </div>
  )
}
