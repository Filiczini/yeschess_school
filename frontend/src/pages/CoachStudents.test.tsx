import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import CoachStudents from './CoachStudents'

describe('CoachStudents', () => {
  const mockStudents = [
    {
      enrollmentId: 'e1',
      studentId: 's1',
      studentName: 'Alice',
      studentEmail: 'alice@test.com',
      enrolledAt: '2024-06-01',
      notes: 'Great progress',
      level: 'intermediate',
      fideRating: 1200,
      clubRating: 1100,
      chesscomUsername: 'alicechess',
      lichessUsername: 'alicelichess',
    },
    {
      enrollmentId: 'e2',
      studentId: 's2',
      studentName: 'Bob',
      studentEmail: 'bob@test.com',
      enrolledAt: '2024-06-02',
      notes: null,
      level: 'beginner',
      fideRating: null,
      clubRating: null,
      chesscomUsername: null,
      lichessUsername: null,
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading state initially', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <CoachStudents />
      </MemoryRouter>,
    )

    expect(screen.getByText('Завантаження...')).toBeInTheDocument()
  })

  it('shows empty state when no students', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    } as Response))

    render(
      <MemoryRouter>
        <CoachStudents />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText((c: string) => c.includes('Учнів ще немає'))).toBeInTheDocument())
  })

  it('renders student list with details', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockStudents,
    } as Response))

    render(
      <MemoryRouter>
        <CoachStudents />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('alice@test.com')).toBeInTheDocument()
    expect(screen.getByText('bob@test.com')).toBeInTheDocument()
    expect(screen.getByText('2 учнів')).toBeInTheDocument()
  })

  it('shows level badges', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockStudents,
    } as Response))

    render(
      <MemoryRouter>
        <CoachStudents />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Середній')).toBeInTheDocument())
    expect(screen.getByText('Початківець')).toBeInTheDocument()
  })

  it('shows ratings when available', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [mockStudents[0]],
    } as Response))

    render(
      <MemoryRouter>
        <CoachStudents />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('FIDE 1200')).toBeInTheDocument())
    expect(screen.getByText('Клуб 1100')).toBeInTheDocument()
  })

  it('shows platforms when available', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [mockStudents[0]],
    } as Response))

    render(
      <MemoryRouter>
        <CoachStudents />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText((c: string) => c.includes('alicechess'))).toBeInTheDocument())
    expect(screen.getByText((c: string) => c.includes('alicelichess'))).toBeInTheDocument()
  })

  it('shows notes when available', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [mockStudents[0]],
    } as Response))

    render(
      <MemoryRouter>
        <CoachStudents />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Great progress')).toBeInTheDocument())
  })
})
