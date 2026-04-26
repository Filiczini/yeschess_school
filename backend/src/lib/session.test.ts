import { describe, it, expect, vi } from 'vitest'
import { getSession } from './session.js'

vi.mock('../auth.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(async ({ headers }: { headers: Headers }) => {
        const cookie = headers.get('cookie')
        if (cookie?.includes('session=valid')) {
          return { user: { id: 'user-1', email: 'test@example.com' } }
        }
        return null
      }),
    },
  },
}))

describe('getSession', () => {
  it('returns session when cookie is valid', async () => {
    const result = await getSession({ headers: { cookie: 'session=valid' } })
    expect(result).toEqual({ user: { id: 'user-1', email: 'test@example.com' } })
  })

  it('returns null when no cookie', async () => {
    const result = await getSession({ headers: {} })
    expect(result).toBeNull()
  })

  it('handles array header values', async () => {
    const result = await getSession({ headers: { cookie: ['session=valid', 'other=1'] } })
    expect(result).toEqual({ user: { id: 'user-1', email: 'test@example.com' } })
  })
})
