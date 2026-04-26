import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Pending from './Pending'

const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../components/SignOutButton', () => ({
  default: () => <button>Sign Out</button>,
}))

describe('Pending', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockNavigate.mockClear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders pending page', () => {
    render(
      <MemoryRouter>
        <Pending />
      </MemoryRouter>,
    )

    expect(screen.getByText('На розгляді')).toBeInTheDocument()
    expect(screen.getByText('Акаунт створено')).toBeInTheDocument()
    expect(screen.getByText('Перевірка адміністратором')).toBeInTheDocument()
  })

  it('polls /api/users/me and redirects when status becomes active', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'pending' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'active' }) } as Response)

    render(
      <MemoryRouter>
        <Pending />
      </MemoryRouter>,
    )

    // Initial poll after 3s
    vi.advanceTimersByTime(3000)
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1))

    // Next poll after 4.5s (3s * 1.5)
    vi.advanceTimersByTime(4500)
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }))
  })

  it('continues polling on network error', async () => {
    globalThis.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'pending' }) } as Response)

    render(
      <MemoryRouter>
        <Pending />
      </MemoryRouter>,
    )

    vi.advanceTimersByTime(3000)
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1))

    vi.advanceTimersByTime(4500)
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2))
  })

  it('increases poll delay exponentially up to 30s', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: 'pending' }),
    } as Response))

    render(
      <MemoryRouter>
        <Pending />
      </MemoryRouter>,
    )

    vi.advanceTimersByTime(3000)
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1))

    vi.advanceTimersByTime(4500)
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2))

    vi.advanceTimersByTime(6750)
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3))

    // After several iterations should cap at 30s
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(30000)
      await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(4 + i))
    }
  })
})
