import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import AdminApprovals from './AdminApprovals'

describe('AdminApprovals', () => {
  const mockUsers = [
    { id: 'u1', name: 'Coach Ivan', email: 'ivan@test.com', role: 'coach', status: 'pending', createdAt: '2024-06-15T10:00:00Z' },
    { id: 'u2', name: 'Owner Anna', email: 'anna@test.com', role: 'school_owner', status: 'pending', createdAt: '2024-06-16T12:00:00Z' },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows loading spinner initially', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <AdminApprovals />
      </MemoryRouter>,
    )

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('shows empty state when no pending users', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    } as Response))

    render(
      <MemoryRouter>
        <AdminApprovals />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Все перевірено')).toBeInTheDocument())
    expect(screen.getByText('Нових заявок немає')).toBeInTheDocument()
  })

  it('renders pending users with approve/reject buttons', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockUsers,
    } as Response))

    render(
      <MemoryRouter>
        <AdminApprovals />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Coach Ivan')).toBeInTheDocument())
    expect(screen.getByText('Owner Anna')).toBeInTheDocument()
    expect(screen.getByText('ivan@test.com')).toBeInTheDocument()
    expect(screen.getByText('anna@test.com')).toBeInTheDocument()

    const approveButtons = screen.getAllByText('Підтвердити')
    const rejectButtons = screen.getAllByText('Відхилити')
    expect(approveButtons.length).toBe(2)
    expect(rejectButtons.length).toBe(2)
  })

  it('approves a user and removes from list after timeout', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockUsers,
    } as Response))

    render(
      <MemoryRouter>
        <AdminApprovals />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Coach Ivan')).toBeInTheDocument())

    const approveButtons = screen.getAllByText('Підтвердити')
    await act(async () => {
      fireEvent.click(approveButtons[0])
    })

    await waitFor(() => expect(screen.getByText('✓ Підтверджено')).toBeInTheDocument())

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    await waitFor(() => expect(screen.queryByText('Coach Ivan')).not.toBeInTheDocument())
  })

  it('rejects a user and removes from list after timeout', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockUsers,
    } as Response))

    render(
      <MemoryRouter>
        <AdminApprovals />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Coach Ivan')).toBeInTheDocument())

    const rejectButtons = screen.getAllByText('Відхилити')
    await act(async () => {
      fireEvent.click(rejectButtons[0])
    })

    await waitFor(() => expect(screen.getByText('✗ Відхилено')).toBeInTheDocument())

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    await waitFor(() => expect(screen.queryByText('Coach Ivan')).not.toBeInTheDocument())
  })

  it('refreshes list on Оновити click', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => mockUsers,
    } as Response))
    globalThis.fetch = fetchMock

    render(
      <MemoryRouter>
        <AdminApprovals />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Coach Ivan')).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getAllByText('Оновити')[0])
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })
})
