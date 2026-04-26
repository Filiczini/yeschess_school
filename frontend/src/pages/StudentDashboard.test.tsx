import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import StudentDashboard from './StudentDashboard'

vi.mock('../lib/auth-client', () => ({
  useSession: () => ({
    data: {
      user: { id: 'u1', name: 'Student Name', email: 'student@test.com' },
    },
  }),
}))

describe('StudentDashboard', () => {
  const mockProfile = {
    level: 'intermediate',
    fideRating: 1200,
    clubRating: 1100,
    chesscomUsername: 'chessuser',
    lichessUsername: 'lichessuser',
    bio: 'Love chess',
    birthdate: '2010-05-15',
  }

  const mockCoach = {
    enrollmentId: 'e1',
    coachProfileId: 'c1',
    coachName: 'Coach Ivan',
    coachEmail: 'ivan@test.com',
    bio: 'GM coach',
    title: 'GM',
    fideRating: 2500,
    avgRating: '4.8',
    totalReviews: 12,
    specializations: ['openings', 'endgames'],
  }

  const mockParent = {
    id: 'p1',
    name: 'Parent Name',
    email: 'parent@test.com',
    phone: '+380991234567',
    contactMethod: 'telegram',
  }

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

  it('shows loading state initially', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>,
    )

    expect(screen.getByText('Завантаження...')).toBeInTheDocument()
  })

  it('renders profile and coach info', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: true, json: async () => mockCoach },
      { ok: true, json: async () => mockParent },
    ])

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Student Name')).toBeInTheDocument())
    expect(screen.getByText('Coach Ivan')).toBeInTheDocument()
    expect(screen.getByText('ivan@test.com')).toBeInTheDocument()
  })

  it('shows "no coach assigned" when coach is null', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: true, json: async () => null },
      { ok: true, json: async () => null },
    ])

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Тренер ще не призначений')).toBeInTheDocument())
  })

  it('shows quick actions when coach exists', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: true, json: async () => mockCoach },
      { ok: true, json: async () => mockParent },
    ])

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Записатись')).toBeInTheDocument())
    expect(screen.getByText('Мої заняття')).toBeInTheDocument()
  })

  it('shows platforms when chess usernames present', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: true, json: async () => mockCoach },
      { ok: true, json: async () => mockParent },
    ])

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Платформи')).toBeInTheDocument())
    expect(screen.getByText('chess.com')).toBeInTheDocument()
    expect(screen.getByText('lichess.org')).toBeInTheDocument()
  })

  it('shows parent section when parent exists', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: true, json: async () => mockCoach },
      { ok: true, json: async () => mockParent },
    ])

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Parent Name')).toBeInTheDocument())
    expect(screen.getByText('parent@test.com')).toBeInTheDocument()
  })

  it('generates link code', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockProfile },
      { ok: true, json: async () => mockCoach },
      { ok: true, json: async () => mockParent },
      { ok: true, json: async () => ({ code: 'ABC12345', expiresAt: '2024-12-31T23:59:59Z' }) },
    ])

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Student Name')).toBeInTheDocument())

    fireEvent.click(screen.getByText("Отримати код прив'язки"))

    await waitFor(() => expect(screen.getByText('ABC12345')).toBeInTheDocument())
  })

  it('shows fill profile prompt when profile incomplete but coach assigned', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ level: null, fideRating: null, clubRating: null, chesscomUsername: null, lichessUsername: null, bio: null, birthdate: null }) },
      { ok: true, json: async () => mockCoach },
      { ok: true, json: async () => null },
    ])

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText((c: string) => c.includes('Заповни профіль'))).toBeInTheDocument())
    expect(screen.getByText('Заповнити зараз')).toBeInTheDocument()
  })
})
