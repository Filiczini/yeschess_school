import { useEffect, useState } from 'react'
import { Link } from 'react-router'

interface Booking {
  id: string
  status: string
  scheduledAt: string
  durationMin: number
  notes: string | null
  cancelReason: string | null
  studentName: string
  studentEmail: string
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Очікує',
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

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('uk-UA', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'UTC',
  })
}

export default function CoachBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [cancelDialog, setCancelDialog] = useState<{ id: string } | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    fetch('/api/coach/bookings', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setBookings(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }, [])

  async function updateStatus(id: string, status: 'confirmed' | 'completed' | 'cancelled', reason?: string) {
    setUpdating(id)
    const res = await fetch(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, cancelReason: reason }),
    })
    if (res.ok) {
      setBookings(prev => prev.map(b =>
        b.id === id ? { ...b, status, cancelReason: reason ?? null } : b
      ))
    }
    setUpdating(null)
  }

  function openCancelDialog(id: string) {
    setCancelReason('')
    setCancelDialog({ id })
  }

  async function confirmCancel() {
    if (!cancelDialog) return
    await updateStatus(cancelDialog.id, 'cancelled', cancelReason.trim() || 'Скасовано тренером')
    setCancelDialog(null)
  }

  const upcoming = bookings.filter(b => ['pending', 'confirmed'].includes(b.status))
  const past = bookings.filter(b => ['completed', 'cancelled'].includes(b.status))

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      {/* Cancel dialog */}
      {cancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a3a5c] border border-white/20 rounded-2xl p-6 w-full max-w-sm text-white">
            <h2 className="font-bold text-lg font-heading mb-1">Скасувати заняття?</h2>
            <p className="text-sm text-blue-200 mb-4">Учень отримає повідомлення на email.</p>
            <label className="block text-sm text-blue-100 mb-1.5">Причина (необов'язково)</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Наприклад: захворів, зміна планів..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/40 text-sm resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setCancelDialog(null)}
                className="flex-1 py-2.5 border border-white/20 rounded-xl text-sm text-blue-200 hover:bg-white/10 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={confirmCancel}
                disabled={!!updating}
                className="flex-1 py-2.5 bg-red-500/80 hover:bg-red-500 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Скасувати заняття
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-xl mx-auto">
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

        <h1 className="text-xl font-bold font-heading text-white mb-6">Бронювання</h1>

        {loading ? (
          <div className="text-sm text-blue-200">Завантаження...</div>
        ) : bookings.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center text-white">
            <iconify-icon icon="solar:calendar-bold-duotone" width="40" height="40" className="text-blue-200 mb-3"></iconify-icon>
            <p className="text-blue-200 text-sm">Бронювань ще немає. Налаштуй розклад щоб учні могли записуватись.</p>
            <Link to="/coach/schedule" className="inline-block mt-4 text-sm text-white underline underline-offset-2">
              Налаштувати розклад
            </Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-blue-200 mb-3">Майбутні</h2>
                <div className="space-y-3">
                  {upcoming.map(b => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      updating={updating === b.id}
                      onConfirm={() => updateStatus(b.id, 'confirmed')}
                      onComplete={() => updateStatus(b.id, 'completed')}
                      onCancel={() => openCancelDialog(b.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-blue-200 mb-3">Минулі</h2>
                <div className="space-y-3">
                  {past.map(b => (
                    <BookingCard key={b.id} booking={b} updating={false} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function BookingCard({
  booking: b,
  updating,
  onConfirm,
  onComplete,
  onCancel,
}: {
  booking: Booking
  updating: boolean
  onConfirm?: () => void
  onComplete?: () => void
  onCancel?: () => void
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="font-semibold truncate">{b.studentName}</div>
          <div className="text-sm text-blue-200 truncate">{b.studentEmail}</div>
        </div>
        <span className={`flex-shrink-0 text-xs px-2 py-1 border rounded-full whitespace-nowrap ${STATUS_COLOR[b.status] ?? 'bg-white/10 border-white/20 text-blue-100'}`}>
          {STATUS_LABEL[b.status] ?? b.status}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-blue-200 mb-3">
        <iconify-icon icon="solar:calendar-linear" width="16" height="16"></iconify-icon>
        {formatDate(b.scheduledAt)}
        <span className="text-blue-300">·</span>
        <iconify-icon icon="solar:clock-circle-linear" width="16" height="16"></iconify-icon>
        {b.durationMin} хв
      </div>

      {b.cancelReason && (
        <div className="text-xs text-red-300 bg-red-400/10 rounded-lg px-3 py-2 mb-3">
          {b.cancelReason}
        </div>
      )}

      {(onConfirm || onComplete || onCancel) && (
        <div className="flex gap-2">
          {b.status === 'pending' && onConfirm && (
            <button
              onClick={onConfirm}
              disabled={updating}
              className="flex-1 py-2 bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400/30 text-emerald-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            >
              Підтвердити
            </button>
          )}
          {b.status === 'confirmed' && onComplete && (
            <button
              onClick={onComplete}
              disabled={updating}
              className="flex-1 py-2 bg-blue-400/20 hover:bg-blue-400/30 border border-blue-400/30 text-blue-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            >
              Завершити
            </button>
          )}
          {['pending', 'confirmed'].includes(b.status) && onCancel && (
            <button
              onClick={onCancel}
              disabled={updating}
              className="flex-1 py-2 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 text-red-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            >
              Скасувати
            </button>
          )}
        </div>
      )}
    </div>
  )
}
