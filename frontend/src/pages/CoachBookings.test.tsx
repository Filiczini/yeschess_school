import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import CoachBookings from './CoachBookings'

describe('CoachBookings', () => {
  const mockBookings = [
    {
      id: 'b1',
      status: 'pending',
      scheduledAt: '2024-06-20T10:00:00Z',
      durationMin: 60,
      notes: null,
      cancelReason: null,
      studentName: 'Alice',
      studentEmail: 'alice@test.com',
    },
    {
      id: 'b2',
      status: 'confirmed',
      scheduledAt: '2024-06-21T14:00:00Z',
      durationMin: 60,
      notes: 'Bring board',
      cancelReason: null,
      studentName: 'Bob',
      studentEmail: 'bob@test.com',
    },
    {
      id: 'b3',
      status: 'completed',
      scheduledAt: '2024-06-10T09:00:00Z',
      durationMin: 45,
      notes: null,
      cancelReason: null,
      studentName: 'Charlie',
      studentEmail: 'charlie@test.com',
    },
    {
      id: 'b4',
      status: 'cancelled',
      scheduledAt: '2024-06-11T11:00:00Z',
      durationMin: 60,
      notes: null,
      cancelReason: 'Тренер захворів',
      studentName: 'Dave',
      studentEmail: 'dave@test.com',
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading state initially', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <CoachBookings />
      </MemoryRouter>,
    )

    expect(screen.getByText('Завантаження...')).toBeInTheDocument()
  })

  it('shows empty state when no bookings', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    } as Response))

    render(
      <MemoryRouter>
        <CoachBookings />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText((c: string) => c.includes('Бронювань ще немає'))).toBeInTheDocument())
    expect(screen.getByText('Налаштувати розклад')).toBeInTheDocument()
  })

  it('renders upcoming and past bookings', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockBookings,
    } as Response))

    render(
      <MemoryRouter>
        <CoachBookings />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
    expect(screen.getByText('Dave')).toBeInTheDocument()
    expect(screen.getByText('Майбутні')).toBeInTheDocument()
    expect(screen.getByText('Минулі')).toBeInTheDocument()
  })

  it('shows confirm button for pending bookings', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [mockBookings[0]],
    } as Response))

    render(
      <MemoryRouter>
        <CoachBookings />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Підтвердити')).toBeInTheDocument())
    expect(screen.getByText('Скасувати')).toBeInTheDocument()
  })

  it('shows complete button for confirmed bookings', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [mockBookings[1]],
    } as Response))

    render(
      <MemoryRouter>
        <CoachBookings />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Завершити')).toBeInTheDocument())
    expect(screen.getByText('Скасувати')).toBeInTheDocument()
  })

  it('shows cancel reason for cancelled bookings', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [mockBookings[3]],
    } as Response))

    render(
      <MemoryRouter>
        <CoachBookings />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Тренер захворів')).toBeInTheDocument())
  })

  it('opens cancel dialog and cancels booking', async () => {
    const fetchMock = vi.fn(async (_url: string, options?: any) => {
      if (options?.method === 'PATCH') {
        return { ok: true, json: async () => ({}) }
      }
      return { ok: true, json: async () => [mockBookings[0]] }
    })
    globalThis.fetch = fetchMock

    render(
      <MemoryRouter>
        <CoachBookings />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Скасувати')).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByText('Скасувати'))
    })

    await waitFor(() => expect(screen.getByText('Скасувати заняття?')).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByText('Скасувати заняття'))
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
  })

  it('cancels booking with custom reason', async () => {
    const fetchMock = vi.fn(async (_url: string, options?: any) => {
      if (options?.method === 'PATCH') {
        return { ok: true, json: async () => ({}) }
      }
      return { ok: true, json: async () => [mockBookings[0]] }
    })
    globalThis.fetch = fetchMock

    render(
      <MemoryRouter>
        <CoachBookings />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Скасувати')).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByText('Скасувати'))
    })

    await waitFor(() => expect(screen.getByText('Скасувати заняття?')).toBeInTheDocument())

    const textarea = screen.getByPlaceholderText('Наприклад: захворів, зміна планів...')
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Зміна планів' } })
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Скасувати заняття'))
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
    const patchCall = fetchMock.mock.calls.find((c: any) => c[1]?.method === 'PATCH')
    expect(patchCall).toBeDefined()
    const body = JSON.parse(patchCall![1].body)
    expect(body.cancelReason).toBe('Зміна планів')
  })

  it('completes a confirmed booking', async () => {
    const fetchMock = vi.fn(async (_url: string, options?: any) => {
      if (options?.method === 'PATCH') {
        return { ok: true, json: async () => ({}) }
      }
      return { ok: true, json: async () => [mockBookings[1]] }
    })
    globalThis.fetch = fetchMock

    render(
      <MemoryRouter>
        <CoachBookings />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Завершити')).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByText('Завершити'))
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
    const patchCall = fetchMock.mock.calls.find((c: any) => c[1]?.method === 'PATCH')
    expect(patchCall).toBeDefined()
    const body = JSON.parse(patchCall![1].body)
    expect(body.status).toBe('completed')
  })
})
