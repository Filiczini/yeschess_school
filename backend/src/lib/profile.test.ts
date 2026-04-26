import { describe, it, expect, vi } from 'vitest'
import { getCoachProfile } from './profile.js'
import { db } from '../db/index.js'

vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
  },
}))

describe('getCoachProfile', () => {
  it('returns profile when found', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ id: 'profile-1' }])),
      })),
    } as any)

    const result = await getCoachProfile('user-1')
    expect(result).toEqual({ id: 'profile-1' })
  })

  it('returns null when not found', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    } as any)

    const result = await getCoachProfile('user-2')
    expect(result).toBeNull()
  })
})
