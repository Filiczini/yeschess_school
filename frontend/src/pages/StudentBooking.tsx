import { useEffect, useState } from 'react'
import MobileHeader from '../components/MobileHeader'
import GlassCard from '../components/GlassCard'
import { formatDateTime, todayStr } from '../lib/date'

interface CoachInfo {
  coachProfileId: string
  coachName: string
  coachEmail: string
  title: string | null
  fideRating: number | null
}

interface TimeSlot {
  time: string
  available: boolean
}

interface Booking {
  id: string
  status: string
  scheduledAt: string
  durationMin: number
  coachName: string
  coachTitle: string | null
  cancelReason: string | null
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Очікує підтвердження',
  confirmed: 'Підтверджено',
  completed: 'Завершено',
  cancelled: 'Скасовано',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-400/20 border-yellow-400/30 text-yellow-300',
  confirmed: 'bg-emerald-400/20 border-emerald-400/30 text-emerald-300',
  completed: 'bg-blue-400/20 border-blue-400/30 text-blue-300',
  cancelled: 'bg-red-400/20 border-red-400/30 text-red-300',
}

export default function StudentBooking() {
const [coach, setCoach] = useState<CoachInfo | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [tab, setTab] = useState<'book' | 'history'>('book')

  useEffect(() => {
    Promise.all([
      fetch('/api/student/coach', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/student/bookings', { credentials: 'include' }).then(r => r.json()),
    ]).then(([c, b]) => {
      setCoach(c)
      setBookings(Array.isArray(b) ? b : [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!coach) return
    setSlotsLoading(true)
    fetch(`/api/coaches/${coach.coachProfileId}/slots?date=${selectedDate}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setSlots(Array.isArray(data) ? data : [])
        setSlotsLoading(false)
      })
  }, [coach, selectedDate])

  async function handleBook(time: string) {
    if (!coach) return
    setBooking(true)
    const res = await fetch('/api/bookings', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coachId: coach.coachProfileId, date: selectedDate, time }),
    })
    if (res.ok) {
      const created = await res.json()
      setBookings(prev => [{ ...created, coachName: coach.coachName, coachTitle: coach.title, cancelReason: null, durationMin: 60 }, ...prev])
      // Refresh slots
      const slotsRes = await fetch(`/api/coaches/${coach.coachProfileId}/slots?date=${selectedDate}`, { credentials: 'include' })
      setSlots(await slotsRes.json())
      setTab('history')
    }
    setBooking(false)
  }

  async function handleCancel(id: string) {
    const res = await fetch(`/api/student/bookings/${id}/cancel`, {
      method: 'PATCH',
      credentials: 'include',
    })
    if (res.ok) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
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
        <MobileHeader backTo="/student" />

        <h1 className="text-xl font-bold font-heading text-white mb-4">Записатись на заняття</h1>

        {/* No coach */}
        {!coach ? (
          <GlassCard className="p-8 text-center">
            <iconify-icon icon="solar:user-plus-rounded-bold-duotone" width="40" height="40" className="text-blue-200 mb-3"></iconify-icon>
            <p className="text-blue-200 text-sm">Тренер ще не призначений. Зверніться до адміністратора.</p>
          </GlassCard>
        ) : (
          <>
            {/* Coach info */}
            <GlassCard className="p-4 mb-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                <iconify-icon icon="solar:user-bold-duotone" width="24" height="24"></iconify-icon>
              </div>
              <div className="min-w-0">
                <div className="font-semibold">{coach.coachName}</div>
                <div className="flex items-center gap-2 mt-1">
                  {coach.title && (
                    <span className="text-xs px-2 py-0.5 bg-amber-400/20 border border-amber-400/30 rounded-full text-amber-300">{coach.title}</span>
                  )}
                  {coach.fideRating && (
                    <span className="text-xs text-blue-300">FIDE {coach.fideRating}</span>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {(['book', 'history'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    tab === t
                      ? 'bg-white text-brand'
                      : 'bg-white/10 text-blue-200 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {t === 'book' ? 'Записатись' : 'Мої заняття'}
                </button>
              ))}
            </div>

            {tab === 'book' && (
              <>
                {/* Date picker */}
                <div className="mb-4">
                  <label className="block text-sm text-blue-200 mb-1.5">Оберіть дату</label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={todayStr()}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/50 [color-scheme:dark]"
                  />
                </div>

                {/* Slots grid */}
                <GlassCard className="p-4">
                  <h2 className="text-sm font-semibold text-blue-200 mb-3">Доступні слоти</h2>
                  {slotsLoading ? (
                    <div className="text-sm text-blue-200">Завантаження...</div>
                  ) : slots.length === 0 ? (
                    <div className="text-sm text-blue-300 flex items-center gap-2">
                      <iconify-icon icon="solar:calendar-remove-linear" width="18" height="18"></iconify-icon>
                      Тренер не доступний в цей день
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      {slots.map(slot => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && !booking && handleBook(slot.time)}
                          disabled={!slot.available || booking}
                          className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            slot.available
                              ? 'bg-white/10 hover:bg-white/25 border border-white/20 text-white'
                              : 'bg-white/5 border border-white/10 text-blue-300/40 cursor-not-allowed line-through'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </>
            )}

            {tab === 'history' && (
              <div className="space-y-3">
                {bookings.length === 0 ? (
                  <GlassCard className="p-8 text-center">
                    <p className="text-blue-200 text-sm">Занять ще немає. Запишись до тренера!</p>
                  </GlassCard>
                ) : (
                  bookings.map(b => (
                    <GlassCard key={b.id} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="text-sm font-medium">{formatDateTime(b.scheduledAt, { utc: true, longMonth: true })}</div>
                        <span className={`flex-shrink-0 text-xs px-2.5 py-1 border rounded-full ${STATUS_COLOR[b.status] ?? 'bg-white/10 border-white/20 text-blue-100'}`}>
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                      </div>
                      <div className="text-xs text-blue-200 flex items-center gap-1">
                        <iconify-icon icon="solar:clock-circle-linear" width="13" height="13"></iconify-icon>
                        {b.durationMin} хв
                      </div>
                      {b.cancelReason && (
                        <div className="text-xs text-red-300 mt-2">{b.cancelReason}</div>
                      )}
                      {['pending', 'confirmed'].includes(b.status) && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="mt-3 w-full py-2 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 text-red-300 rounded-xl text-xs font-medium transition-colors"
                        >
                          Скасувати
                        </button>
                      )}
                    </GlassCard>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
