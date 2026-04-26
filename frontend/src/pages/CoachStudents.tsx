import { useEffect, useState } from 'react'

import MobileHeader from '../components/MobileHeader'

interface Student {
  enrollmentId: string
  studentId: string
  studentName: string
  studentEmail: string
  enrolledAt: string
  notes: string | null
  level: string | null
  fideRating: number | null
  clubRating: number | null
  chesscomUsername: string | null
  lichessUsername: string | null
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Початківець',
  intermediate: 'Середній',
  advanced: 'Просунутий',
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-400/20 border-emerald-400/30 text-emerald-300',
  intermediate: 'bg-blue-400/20 border-blue-400/30 text-blue-300',
  advanced: 'bg-purple-400/20 border-purple-400/30 text-purple-300',
}

export default function CoachStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/coach/students', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setStudents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark px-4 py-10">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <MobileHeader backTo="/coach" />

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold font-heading text-white">Мої учні</h1>
          {!loading && (
            <span className="text-sm text-blue-200">{students.length} учнів</span>
          )}
        </div>

        {loading ? (
          <div className="text-sm text-blue-200">Завантаження...</div>
        ) : students.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center text-white">
            <iconify-icon icon="solar:users-group-rounded-bold-duotone" width="40" height="40" className="text-blue-200 mb-3"></iconify-icon>
            <p className="text-blue-200 text-sm">Учнів ще немає. Адміністратор призначить їх до вас.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map(s => (
              <div
                key={s.enrollmentId}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                    <iconify-icon icon="solar:user-bold-duotone" width="24" height="24"></iconify-icon>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{s.studentName}</span>
                      {s.level && (
                        <span className={`text-xs px-2 py-0.5 border rounded-full ${LEVEL_COLORS[s.level] ?? 'bg-white/10 border-white/20 text-blue-100'}`}>
                          {LEVEL_LABELS[s.level] ?? s.level}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-blue-200 truncate">{s.studentEmail}</div>

                    {/* Ratings row */}
                    {(s.fideRating || s.clubRating) && (
                      <div className="flex items-center gap-3 mt-2">
                        {s.fideRating && (
                          <span className="text-xs text-blue-300 flex items-center gap-1">
                            <iconify-icon icon="solar:ranking-linear" width="13" height="13"></iconify-icon>
                            FIDE {s.fideRating}
                          </span>
                        )}
                        {s.clubRating && (
                          <span className="text-xs text-blue-300 flex items-center gap-1">
                            <iconify-icon icon="solar:star-linear" width="13" height="13"></iconify-icon>
                            Клуб {s.clubRating}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Platforms */}
                    {(s.chesscomUsername || s.lichessUsername) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        {s.chesscomUsername && (
                          <span className="text-xs text-emerald-300 truncate">chess.com: {s.chesscomUsername}</span>
                        )}
                        {s.lichessUsername && (
                          <span className="text-xs text-blue-300 truncate">lichess: {s.lichessUsername}</span>
                        )}
                      </div>
                    )}

                    {s.notes && (
                      <div className="mt-2 text-xs text-blue-200 bg-white/5 rounded-lg px-3 py-2">
                        {s.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
