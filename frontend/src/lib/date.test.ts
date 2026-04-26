import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime, formatDateFull, todayStr } from '../lib/date'

describe('date utils', () => {
  it('formatDate returns short date', () => {
    expect(formatDate('2024-06-15T00:00:00Z')).toContain('2024')
  })

  it('formatDate handles utc option', () => {
    expect(formatDate('2024-06-15T00:00:00Z', { utc: true })).toContain('2024')
  })

  it('formatDateTime returns date and time', () => {
    const result = formatDateTime('2024-06-15T14:30:00Z')
    expect(result).toContain('2024')
    expect(result).toContain('30')
  })

  it('formatDateTime with longMonth', () => {
    const result = formatDateTime('2024-06-15T14:30:00Z', { longMonth: true })
    expect(result).toContain('2024')
  })

  it('formatDateFull returns full month', () => {
    const result = formatDateFull('2024-06-15T00:00:00Z')
    expect(result).toContain('2024')
  })

  it('todayStr returns YYYY-MM-DD', () => {
    const today = todayStr()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
