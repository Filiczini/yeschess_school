import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AdminOverview from './AdminOverview'

describe('AdminOverview', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders stats cards', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        totalUsers: 150,
        pendingCount: 5,
        enrollmentsCount: 42,
      }),
    } as Response))

    render(<AdminOverview />)

    await waitFor(() => expect(screen.getByText('150')).toBeInTheDocument())
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Загалом користувачів')).toBeInTheDocument()
    expect(screen.getByText('Записи учнів до тренерів')).toBeInTheDocument()
    expect(screen.getByText('Заявки на розгляді')).toBeInTheDocument()
  })

  it('shows dashes when stats are loading', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {}))

    render(<AdminOverview />)

    expect(screen.getAllByText('—')).toHaveLength(3)
  })

  it('shows pending attention badge when pendingCount > 0', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        totalUsers: 10,
        pendingCount: 3,
        enrollmentsCount: 2,
      }),
    } as Response))

    render(<AdminOverview />)

    await waitFor(() => expect(screen.getByText('Потребує уваги')).toBeInTheDocument())
  })

  it('handles fetch failure gracefully', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
    } as Response))

    render(<AdminOverview />)

    // Should not throw, remains in loading state (dashes)
    expect(screen.getAllByText('—')).toHaveLength(3)
  })
})
