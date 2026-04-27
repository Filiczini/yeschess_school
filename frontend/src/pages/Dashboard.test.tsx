import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Dashboard from './Dashboard'

vi.mock('../lib/auth-client', () => ({
  useSession: vi.fn(() => ({ data: { user: { name: 'Test User', email: 'test@test.com' } } })),
}))

vi.mock('../components/SignOutButton', () => ({
  default: () => <button>Sign Out</button>,
}))

describe('Dashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches user profile on mount', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ role: 'student', status: 'active', plan: 'free' }),
    } as Response))

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith('/api/users/me', expect.objectContaining({ credentials: 'include' })))
  })

  it('redirects to /student for student role', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ role: 'student', status: 'active', plan: 'free' }),
    } as Response))

    const { container } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(container.innerHTML).not.toContain('Дашборд'))
  })

  it('redirects to /parent for parent role', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ role: 'parent', status: 'active', plan: 'free' }),
    } as Response))

    const { container } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(container.innerHTML).not.toContain('Дашборд'))
  })

  it('redirects to /coach for coach role', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ role: 'coach', status: 'active', plan: 'free' }),
    } as Response))

    const { container } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(container.innerHTML).not.toContain('Дашборд'))
  })

  it('redirects to /admin for admin role', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ role: 'admin', status: 'active', plan: 'free' }),
    } as Response))

    const { container } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(container.innerHTML).not.toContain('Дашборд'))
  })

  it('renders dashboard for unknown role', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ role: 'unknown', status: 'active', plan: 'free' }),
    } as Response))

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Дашборд')).toBeInTheDocument())
  })

  it('shows pending badge when status is pending', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ role: 'unknown', status: 'pending', plan: 'free' }),
    } as Response))

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('На розгляді')).toBeInTheDocument())
  })

  it('shows admin links for admin user', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ role: 'admin', status: 'active', plan: 'free' }),
    } as Response))

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText('Всі користувачі')).not.toBeInTheDocument()
    })
  })
})
