import { useEffect, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'

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
  const [enrollmentTotal, setEnrollmentTotal] = useState(0)
  const [students, setStudents] = useState<UserOption[]>([])
  const [coaches, setCoaches] = useState<CoachOption[]>([])

  const [studentId, setStudentId] = useState('')
  const [coachId, setCoachId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const [enrRes, studRes, coachRes] = await Promise.all([
      fetch('/api/admin/enrollments?limit=1000', { credentials: 'include' }),
      fetch('/api/admin/users?role=student&limit=1000', { credentials: 'include' }),
      fetch('/api/admin/coaches', { credentials: 'include' }),
    ])
    const [enrData, studData, coachData] = await Promise.all([
      enrRes.json(),
      studRes.json(),
      coachRes.json(),
    ])
    const enrList = Array.isArray(enrData) ? enrData : (enrData.data ?? [])
    setEnrollments(enrList)
    setEnrollmentTotal(enrData.meta?.total ?? enrList.length)
    setStudents(Array.isArray(studData) ? studData : (studData.data ?? []))
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

  const inputClass = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-lg text-sm focus:outline-none focus:border-brand-light/50 focus:ring-2 focus:ring-brand-light/10 transition-all [&>option]:text-gray-900'

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <div className="grid md:grid-cols-[380px_1fr] gap-6 items-start">

        {/* Assign form */}
        <form
          onSubmit={handleAssign}
          className="bg-white border border-gray-200/80 rounded-xl shadow-sm p-6 sticky top-24"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 bg-[#F0EEFA] rounded-lg flex items-center justify-center">
              <iconify-icon icon="solar:user-plus-rounded-linear" width="18" height="18" className="text-brand-light"></iconify-icon>
            </div>
            <h2 className="font-heading font-medium text-gray-900">Новий запис</h2>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Учень</label>
              <select
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">— оберіть учня —</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Тренер</label>
              <select
                value={coachId}
                onChange={e => setCoachId(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">— оберіть тренера —</option>
                {coaches.map(c => (
                  <option key={c.coachProfileId} value={c.coachProfileId}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Нотатка
                <span className="ml-1 text-gray-400 font-normal">(необов'язково)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="наприклад: підготовка до турніру"
                className={inputClass}
              />
            </div>

            <ErrorMessage error={error} variant="admin" />

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-brand-light text-white rounded-lg text-sm font-medium hover:bg-brand transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Зберігаємо...
                </>
              ) : (
                <>
                  <iconify-icon icon="solar:check-circle-linear" width="16" height="16"></iconify-icon>
                  Призначити
                </>
              )}
            </button>
          </div>
        </form>

        {/* Enrollments list */}
        <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#F0EEFA] rounded-lg flex items-center justify-center">
              <iconify-icon icon="solar:users-group-rounded-linear" width="16" height="16" className="text-brand-light"></iconify-icon>
            </div>
            <h2 className="font-heading font-medium text-gray-900">Активні записи</h2>
            <span className="ml-auto text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
              {enrollmentTotal}
            </span>
          </div>

          {enrollments.length === 0 ? (
            <div className="px-6 py-14 text-center text-gray-400 text-sm">
              <iconify-icon icon="solar:inbox-linear" width="28" height="28" className="mx-auto mb-3 text-gray-300"></iconify-icon>
              <p>Записів поки немає</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {enrollments.map(e => (
                <li key={e.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <span className="truncate">{e.studentName}</span>
                      <iconify-icon icon="solar:arrow-right-linear" width="14" height="14" className="text-brand-light/50 shrink-0"></iconify-icon>
                      <span className="truncate text-brand-light">{e.coachName}</span>
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5 truncate">
                      {e.studentEmail}
                      {e.notes && <span className="ml-2 text-gray-500">· {e.notes}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(e.id)}
                    className="shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100"
                    title="Видалити запис"
                  >
                    <iconify-icon icon="solar:trash-bin-trash-linear" width="16" height="16"></iconify-icon>
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
