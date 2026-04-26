import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import CoachDashboard from './CoachDashboard'

vi.mock('../lib/auth-client', () => ({
  useSession: () => ({
    data: {
      user: { id: 'u1', name: 'Coach Name', email: 'coach@test.com' },
    },
  }),
}))

describe('CoachDashboard', () => {
  function mockFetchSequence(responses: any[]) {
    let callIndex = 0
    globalThis.fetch = vi.fn(async () => {
      const res = responses[callIndex++] ?? { ok: true, json: async () => ({}) }
      return res
    })
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders coach name and email', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'coach', status: 'active', plan: 'free' }) },
      { ok: true, json: async () => [] },
    ])

    render(
      <MemoryRouter>
        <CoachDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Coach Name')).toBeInTheDocument())
    expect(screen.getByText('coach@test.com')).toBeInTheDocument()
  })

  it('shows pending status badge and notice', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'coach', status: 'pending', plan: 'free' }) },
      { ok: true, json: async () => [] },
    ])

    render(
      <MemoryRouter>
        <CoachDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('На розгляді')).toBeInTheDocument())
    expect(screen.getByText((c: string) => c.includes('очікує підтвердження'))).toBeInTheDocument()
  })

  it('shows active status badge', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'coach', status: 'active', plan: 'free' }) },
      { ok: true, json: async () => [] },
    ])

    render(
      <MemoryRouter>
        <CoachDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Активний')).toBeInTheDocument())
  })

  it('shows pending bookings alert', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'coach', status: 'active', plan: 'free' }) },
      { ok: true, json: async () => [
        { id: 'b1', status: 'pending' },
        { id: 'b2', status: 'pending' },
        { id: 'b3', status: 'confirmed' },
      ] },
    ])

    render(
      <MemoryRouter>
        <CoachDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(document.querySelector('a[href="/coach/bookings"]')).toBeInTheDocument())
  })

  it('renders navigation cards', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'coach', status: 'active', plan: 'free' }) },
      { ok: true, json: async () => [] },
    ])

    render(
      <MemoryRouter>
        <CoachDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Мій профіль')).toBeInTheDocument())
    expect(screen.getByText('Розклад')).toBeInTheDocument()
    expect(screen.getByText('Бронювання')).toBeInTheDocument()
    expect(screen.getByText('Учні')).toBeInTheDocument()
  })

  it('renders quick stats', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'coach', status: 'active', plan: 'free' }) },
      { ok: true, json: async () => [] },
    ])

    render(
      <MemoryRouter>
        <CoachDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Учнів')).toBeInTheDocument())
    expect(screen.getByText('Сесій')).toBeInTheDocument()
    expect(screen.getByText('Рейтинг')).toBeInTheDocument()
  })
})
