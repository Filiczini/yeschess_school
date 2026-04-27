import { coachSchedule, booking } from '../db/schema.js'
import { eq, and, gte, lt, ne } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '../db/schema.js'

type Db = NodePgDatabase<typeof schema>

export interface Slot {
  time: string
  available: boolean
}

export async function getAvailableSlots(
  db: Db,
  {
    coachId,
    date,
  }: {
    coachId: string
    date: string
  }
): Promise<Slot[]> {
  const parsed = new Date(date)
  const jsDow = parsed.getDay()
  const dayOfWeek = jsDow === 0 ? 6 : jsDow - 1

  const [schedule] = await db
    .select()
    .from(coachSchedule)
    .where(
      and(
        eq(coachSchedule.coachId, coachId),
        eq(coachSchedule.dayOfWeek, dayOfWeek),
        eq(coachSchedule.isActive, true)
      )
    )

  if (!schedule) return []

  const [startH, startM] = schedule.startTime.split(':').map(Number)
  const [endH, endM] = schedule.endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  const allSlots: string[] = []
  for (let m = startMinutes; m + schedule.slotDuration <= endMinutes; m += schedule.slotDuration) {
    const h = String(Math.floor(m / 60)).padStart(2, '0')
    const min = String(m % 60).padStart(2, '0')
    allSlots.push(`${h}:${min}`)
  }

  const dayStart = new Date(`${date}T00:00:00.000Z`)
  const dayEnd = new Date(`${date}T23:59:59.999Z`)

  const booked = await db
    .select({ scheduledAt: booking.scheduledAt })
    .from(booking)
    .where(
      and(
        eq(booking.coachId, coachId),
        gte(booking.scheduledAt, dayStart),
        lt(booking.scheduledAt, dayEnd),
        ne(booking.status, 'cancelled'),
        ne(booking.status, 'refunded')
      )
    )

  const bookedTimes = new Set(
    booked.map(b => {
      const d = new Date(b.scheduledAt)
      return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
    })
  )

  return allSlots.map(time => ({ time, available: !bookedTimes.has(time) }))
}
