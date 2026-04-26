import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import StudentBooking from './StudentBooking'

describe('StudentBooking', () => {
  const mockCoach = {
    coachProfileId: 'coach-1',
    coachName: 'Coach Ivan',
    coachEmail: 'ivan@test.com',
    title: 'GM',
    fideRating: 2500,
  }

  const mockSlots = [
    { time: '10:00', available: true },
    { time: '11:00', available: false },
    { time: '12:00', available: true },
  ]

  const mockBookings = [
    { id: 'b1', status: 'confirmed', scheduledAt: '2024-06-15T10:00:00Z', durationMin: 60, coachName: 'Coach Ivan', coachTitle: 'GM', cancelReason: null },
    { id: 'b2', status: 'pending', scheduledAt: '2024-06-16T14:00:00Z', durationMin: 60, coachName: 'Coach Ivan', coachTitle: 'GM', cancelReason: null },
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

  it('shows loading state initially', () => {
    mockFetchSequence([
      new Promise(() => {}) as any,
      new Promise(() => {}) as any,
    ])

    render(
      <MemoryRouter>
        <StudentBooking />
      </MemoryRouter>,
    )

    expect(screen.getByText('Завантаження...')).toBeInTheDocument()
  })

  it('shows message when no coach assigned', async () => {
    mockFetchSequence([
      { ok: true, json: async () => null },
      { ok: true, json: async () => [] },
    ])

    render(
      <MemoryRouter>
        <StudentBooking />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText((c: string) => c.includes('Тренер ще не призначений'))).toBeInTheDocument())
  })

  it('renders coach info and booking tab', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockCoach },
      { ok: true, json: async () => [] },
      { ok: true, json: async () => mockSlots },
    ])

    render(
      <MemoryRouter>
        <StudentBooking />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Coach Ivan')).toBeInTheDocument())
    expect(screen.getByText('GM')).toBeInTheDocument()
    expect(screen.getByText('FIDE 2500')).toBeInTheDocument()
    expect(screen.getByText('Записатись')).toBeInTheDocument()
    expect(screen.getByText('Мої заняття')).toBeInTheDocument()
  })

  it('shows available slots', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockCoach },
      { ok: true, json: async () => [] },
      { ok: true, json: async () => mockSlots },
    ])

    render(
      <MemoryRouter>
        <StudentBooking />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('10:00')).toBeInTheDocument())
    expect(screen.getByText('11:00')).toBeInTheDocument()
    expect(screen.getByText('12:00')).toBeInTheDocument()
  })

  it('switches to history tab and shows bookings', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockCoach },
      { ok: true, json: async () => mockBookings },
      { ok: true, json: async () => mockSlots },
    ])

    render(
      <MemoryRouter>
        <StudentBooking />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Coach Ivan')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Мої заняття'))

    await waitFor(() => expect(screen.getByText('Підтверджено')).toBeInTheDocument())
    expect(screen.getByText('Очікує підтвердження')).toBeInTheDocument()
    expect(screen.getAllByText('60 хв').length).toBe(2)
  })

  it('books a slot successfully', async () => {
    const newBooking = { id: 'b3', status: 'pending', scheduledAt: '2024-06-20T10:00:00Z', durationMin: 60 }

    mockFetchSequence([
      { ok: true, json: async () => mockCoach },
      { ok: true, json: async () => [] },
      { ok: true, json: async () => mockSlots },
      { ok: true, json: async () => newBooking },
      { ok: true, json: async () => mockSlots },
    ])

    render(
      <MemoryRouter>
        <StudentBooking />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('10:00')).toBeInTheDocument())

    fireEvent.click(screen.getByText('10:00'))

    await waitFor(() => expect(screen.getByText('Мої заняття')).toHaveClass('bg-white'))
  })

  it('shows empty slots message', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockCoach },
      { ok: true, json: async () => [] },
      { ok: true, json: async () => [] },
    ])

    render(
      <MemoryRouter>
        <StudentBooking />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Тренер не доступний в цей день')).toBeInTheDocument())
  })

  it('cancels a booking', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockCoach },
      { ok: true, json: async () => mockBookings },
      { ok: true, json: async () => mockSlots },
      { ok: true, json: async () => ({ ok: true }) },
    ])

    render(
      <MemoryRouter>
        <StudentBooking />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Coach Ivan')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Мої заняття'))

    await waitFor(() => expect(screen.getAllByText('Скасувати').length).toBeGreaterThanOrEqual(1))

    const cancelButtons = screen.getAllByText('Скасувати')
    fireEvent.click(cancelButtons[0])

    await waitFor(() => expect(screen.getByText('Скасовано')).toBeInTheDocument())
  })

  it('changes date and fetches new slots', async () => {
    mockFetchSequence([
      { ok: true, json: async () => mockCoach },
      { ok: true, json: async () => [] },
      { ok: true, json: async () => mockSlots },
      { ok: true, json: async () => [{ time: '15:00', available: true }] },
    ])

    render(
      <MemoryRouter>
        <StudentBooking />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('10:00')).toBeInTheDocument())

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2024-12-25' } })

    await waitFor(() => expect(screen.getByText('15:00')).toBeInTheDocument())
  })
})
