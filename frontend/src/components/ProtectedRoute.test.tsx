import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import ProtectedRoute from './ProtectedRoute'

vi.mock('../lib/auth-client', () => ({
  useSession: vi.fn(),
}))

import { useSession } from '../lib/auth-client'

describe('ProtectedRoute', () => {
  it('shows loading spinner while session is pending', () => {
    vi.mocked(useSession).mockReturnValue({ data: null, isPending: true } as any)

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="content">Secret</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('redirects to /login when unauthenticated', () => {
    vi.mocked(useSession).mockReturnValue({ data: null, isPending: false } as any)

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="content">Secret</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: '1', email: 'a@b.com' } },
      isPending: false,
    } as any)

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="content">Secret</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.getByText('Secret')).toBeInTheDocument()
  })
})
