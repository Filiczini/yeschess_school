import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import CoachSchedule from './CoachSchedule'

describe('CoachSchedule', () => {
  const mockSlots = [
    { dayOfWeek: 0, startTime: '10:00', endTime: '14:00', slotDuration: 60, isActive: true },
    { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', slotDuration: 45, isActive: true },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading state initially', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <CoachSchedule />
      </MemoryRouter>,
    )

    expect(screen.getByText('Завантаження...')).toBeInTheDocument()
  })

  it('renders all 7 days', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    } as Response))

    render(
      <MemoryRouter>
        <CoachSchedule />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.queryByText('Завантаження...')).not.toBeInTheDocument())

    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
    days.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument()
    })
  })

  it('displays fetched schedule with active days', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockSlots,
    } as Response))

    render(
      <MemoryRouter>
        <CoachSchedule />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.queryByText('Завантаження...')).not.toBeInTheDocument())

    // Пн should be active, should show time inputs
    expect(screen.getAllByText('Початок').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Кінець').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Тривалість').length).toBeGreaterThanOrEqual(1)
  })

  it('toggles a day off and hides inputs', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockSlots,
    } as Response))

    render(
      <MemoryRouter>
        <CoachSchedule />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.queryByText('Завантаження...')).not.toBeInTheDocument())

    // Click toggle for Пн (first toggle button)
    const toggles = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('rounded-full') && btn.className.includes('w-10'),
    )
    fireEvent.click(toggles[0])

    // After toggling off, "Вихідний" count should increase by 1 (from 5 to 6)
    await waitFor(() => expect(screen.getAllByText('Вихідний').length).toBe(6))
  })

  it('changes start time and saves schedule', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockSlots,
    } as Response))

    render(
      <MemoryRouter>
        <CoachSchedule />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.queryByText('Завантаження...')).not.toBeInTheDocument())

    const timeInputs = document.querySelectorAll('input[type="time"]')
    expect(timeInputs.length).toBeGreaterThan(0)

    fireEvent.change(timeInputs[0], { target: { value: '08:00' } })

    fireEvent.click(screen.getByText('Зберегти розклад'))

    await waitFor(() => expect(screen.getByText('Збережено')).toBeInTheDocument())
  })

  it('sends PUT request on save with updated slots', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => mockSlots,
    } as Response))
    globalThis.fetch = fetchMock

    render(
      <MemoryRouter>
        <CoachSchedule />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.queryByText('Завантаження...')).not.toBeInTheDocument())

    fireEvent.click(screen.getByText('Зберегти розклад'))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    const putCall = fetchMock.mock.calls.find(c => c[1]?.method === 'PUT')
    expect(putCall).toBeDefined()
    expect(putCall![0]).toBe('/api/coach/schedule')
    expect(putCall![1].headers['Content-Type']).toBe('application/json')
  })

  it('shows saving state while submitting', async () => {
    let resolveSave: (value: Response) => void
    const savePromise = new Promise<Response>(resolve => { resolveSave = resolve })

    globalThis.fetch = vi.fn(async () => {
      // First call is GET, second is PUT
      const calls = (globalThis.fetch as any).mock.calls.length
      if (calls === 1) {
        return { ok: true, json: async () => [] }
      }
      return savePromise
    })

    render(
      <MemoryRouter>
        <CoachSchedule />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.queryByText('Завантаження...')).not.toBeInTheDocument())

    fireEvent.click(screen.getByText('Зберегти розклад'))

    await waitFor(() => expect(screen.getByText('Збереження...')).toBeInTheDocument())

    resolveSave!({ ok: true } as Response)
  })
})
