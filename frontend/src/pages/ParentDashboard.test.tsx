import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import ParentDashboard from './ParentDashboard'

vi.mock('../lib/auth-client', () => ({
  useSession: () => ({
    data: {
      user: { id: 'u1', name: 'Parent Name', email: 'parent@test.com' },
    },
  }),
}))

describe('ParentDashboard', () => {
  const mockProfile = { phone: '+380991234567', contactMethod: 'telegram', instagram: 'parent_ig' }

  const mockChildren = [
    {
      id: 'c1',
      name: 'Child One',
      email: 'child1@test.com',
      level: 'intermediate',
      fideRating: 1200,
      clubRating: 1100,
      coachName: 'Coach Ivan',
      coachTitle: 'GM',
      upcomingBookings: 2,
    },
    {
      id: 'c2',
      name: 'Child Two',
      email: 'child2@test.com',
      level: null,
      fideRating: null,
      clubRating: null,
      coachName: null,
      coachTitle: null,
      upcomingBookings: 0,
    },
  ]

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

  it('renders parent name and add child button', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: true, json: async () => [] },
    ])

    render(
      <MemoryRouter>
        <ParentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Parent Name')).toBeInTheDocument())
    expect(screen.getByText('Додати дитину')).toBeInTheDocument()
  })

  it('shows onboarding when no children', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: true, json: async () => [] },
    ])

    render(
      <MemoryRouter>
        <ParentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Як почати навчання')).toBeInTheDocument())
    expect(screen.getByText('Додайте дитину')).toBeInTheDocument()
    expect(screen.getByText('Додати зараз →')).toBeInTheDocument()
  })

  it('renders children list and selects first child', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: true, json: async () => mockChildren },
    ])

    render(
      <MemoryRouter>
        <ParentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getAllByText('Child One').length).toBeGreaterThanOrEqual(1))
    expect(screen.getByText('child1@test.com')).toBeInTheDocument()
    expect(screen.getByText('Coach Ivan')).toBeInTheDocument()
  })

  it('shows child tabs when multiple children', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: true, json: async () => mockChildren },
    ])

    render(
      <MemoryRouter>
        <ParentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getAllByText('Child One').length).toBeGreaterThanOrEqual(1))
    expect(screen.getAllByText('Child Two').length).toBeGreaterThanOrEqual(1)

    const tabButtons = screen.getAllByRole('button').filter(btn => btn.textContent === 'Child Two')
    fireEvent.click(tabButtons[0])

    await waitFor(() => expect(screen.getByText('child2@test.com')).toBeInTheDocument())
  })

  it('shows ratings for selected child', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: true, json: async () => [mockChildren[0]] },
    ])

    render(
      <MemoryRouter>
        <ParentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('1200')).toBeInTheDocument())
    expect(screen.getByText('1100')).toBeInTheDocument()
    expect(screen.getByText('FIDE рейтинг')).toBeInTheDocument()
  })

  it('shows contact info', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: true, json: async () => [] },
    ])

    render(
      <MemoryRouter>
        <ParentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('+380991234567')).toBeInTheDocument())
    expect(screen.getByText('@parent_ig')).toBeInTheDocument()
  })

  it('shows prompt to add contact info when empty', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ phone: null, contactMethod: null, instagram: null }) },
      { ok: true, json: async () => [] },
    ])

    render(
      <MemoryRouter>
        <ParentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Додати контактну інформацію')).toBeInTheDocument())
  })

  it('shows no coach message when child has no coach', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: true, json: async () => [mockChildren[1]] },
    ])

    render(
      <MemoryRouter>
        <ParentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Child Two')).toBeInTheDocument())
    expect(screen.getByText('Тренер ще не призначений')).toBeInTheDocument()
  })

  it('shows quick actions when child has a coach', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: true, json: async () => [mockChildren[0]] },
    ])

    render(
      <MemoryRouter>
        <ParentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Записати')).toBeInTheDocument())
    expect(screen.getByText('Заняття')).toBeInTheDocument()
    expect(screen.getByText('2 заплановано')).toBeInTheDocument()
  })

  it('handles fetch error gracefully', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: false, status: 500, json: async () => ({ error: 'fail' }) },
    ])

    render(
      <MemoryRouter>
        <ParentDashboard />
      </MemoryRouter>,
    )

    // Should not crash; loading ends via catch
    await waitFor(() => expect(screen.getByText('Parent Name')).toBeInTheDocument())
  })
})
