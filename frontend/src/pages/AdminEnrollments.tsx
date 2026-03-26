import { useEffect, useState } from 'react'
import { Link } from 'react-router'

interface UserOption {
  id: string
  name: string
  email: string
}

interface CoachOption {
  coachProfileId: string
  name: string
  email: string
}

interface EnrollmentRow {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  coachId: string
  coachName: string
  notes: string | null
  createdAt: string
}

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([])
  const [students, setStudents] = useState<UserOption[]>([])
  const [coaches, setCoaches] = useState<CoachOption[]>([])

  const [studentId, setStudentId] = useState('')
  const [coachId, setCoachId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const [enrRes, studRes, coachRes] = await Promise.all([
      fetch('/api/admin/enrollments', { credentials: 'include' }),
      fetch('/api/admin/users?role=student', { credentials: 'include' }),
      fetch('/api/admin/coaches', { credentials: 'include' }),
    ])
    const [enrData, studData, coachData] = await Promise.all([
      enrRes.json(),
      studRes.json(),
      coachRes.json(),
    ])
    setEnrollments(Array.isArray(enrData) ? enrData : [])
    setStudents(Array.isArray(studData) ? studData : [])
    setCoaches(Array.isArray(coachData) ? coachData : [])
  }

  useEffect(() => { load() }, [])

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!studentId || !coachId) return

    setSaving(true)
    const res = await fetch('/api/admin/enrollments', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, coachId, notes: notes || undefined }),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error === 'Enrollment already exists'
        ? 'Цей учень вже записаний до цього тренера'
        : data.error ?? 'Помилка')
      return
    }

    setStudentId('')
    setCoachId('')
    setNotes('')
    load()
  }

  async function handleRemove(id: string) {
    await fetch(`/api/admin/enrollments/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    load()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-white">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-brand">
              <iconify-icon icon="solar:crown-linear" width="20" height="20"></iconify-icon>
            </div>
            <span className="font-bold tracking-tight text-lg uppercase font-heading">YesChess</span>
          </div>
          <Link
            to="/dashboard"
            className="text-blue-200 hover:text-white text-sm transition-colors flex items-center gap-1.5"
          >
            <iconify-icon icon="solar:arrow-left-linear" width="16" height="16"></iconify-icon>
            Назад
          </Link>
        </div>

        <h1 className="text-white text-2xl font-bold font-heading mb-6">
          Призначення учнів
        </h1>

        {/* Assign form */}
        <form
          onSubmit={handleAssign}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6"
        >
          <h2 className="text-white font-semibold font-heading mb-4 flex items-center gap-2">
            <iconify-icon icon="solar:user-plus-rounded-linear" width="20" height="20"></iconify-icon>
            Новий запис
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-blue-200 text-xs mb-1 block">Учень</label>
              <select
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                required
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/50 [&>option]:text-black"
              >
                <option value="">— оберіть учня —</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-blue-200 text-xs mb-1 block">Тренер</label>
              <select
                value={coachId}
                onChange={e => setCoachId(e.target.value)}
                required
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/50 [&>option]:text-black"
              >
                <option value="">— оберіть тренера —</option>
                {coaches.map(c => (
                  <option key={c.coachProfileId} value={c.coachProfileId}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-blue-200 text-xs mb-1 block">Нотатка (необов'язково)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="наприклад: підготовка до турніру"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/50"
              />
            </div>

            {error && (
              <p className="text-red-300 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-white text-brand rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {saving ? 'Зберігаємо...' : 'Призначити'}
            </button>
          </div>
        </form>

        {/* Enrollments list */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-white font-semibold font-heading flex items-center gap-2">
              <iconify-icon icon="solar:users-group-rounded-linear" width="20" height="20"></iconify-icon>
              Активні записи
              <span className="ml-auto text-xs text-blue-200 font-normal">{enrollments.length}</span>
            </h2>
          </div>

          {enrollments.length === 0 ? (
            <div className="px-6 py-10 text-center text-blue-200 text-sm">
              Записів поки немає
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {enrollments.map(e => (
                <li key={e.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-white text-sm font-medium">
                      <span className="truncate">{e.studentName}</span>
                      <iconify-icon icon="solar:arrow-right-linear" width="14" height="14" class="text-blue-300 flex-shrink-0"></iconify-icon>
                      <span className="truncate">{e.coachName}</span>
                    </div>
                    <div className="text-blue-200/60 text-xs mt-0.5 truncate">
                      {e.studentEmail}
                      {e.notes && <span className="ml-2 text-blue-200">· {e.notes}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(e.id)}
                    className="flex-shrink-0 text-red-300 hover:text-red-200 transition-colors p-1"
                    title="Видалити запис"
                  >
                    <iconify-icon icon="solar:trash-bin-trash-linear" width="18" height="18"></iconify-icon>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}
