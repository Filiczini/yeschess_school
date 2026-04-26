import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Login from './Login'

vi.mock('../lib/auth-client', () => ({
  signIn: { email: vi.fn() },
}))

import { signIn } from '../lib/auth-client'

describe('Login', () => {
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-ignore
    delete window.location
    window.location = { ...originalLocation, href: '' } as any
  })

  afterEach(() => {
    window.location = originalLocation
  })

  it('renders login form with email and password inputs', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByText('Увійти')).toBeInTheDocument()
  })

  it('shows loading state and disables button during submit', async () => {
    vi.mocked(signIn.email).mockReturnValue(new Promise(() => {}))

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByText('Увійти'))

    await waitFor(() => expect(screen.getByText('Вхід...')).toBeInTheDocument())
    expect(screen.getByText('Вхід...')).toBeDisabled()
  })

  it('redirects to /dashboard on successful login', async () => {
    vi.mocked(signIn.email).mockResolvedValue({ error: null } as any)

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByText('Увійти'))

    await waitFor(() => expect(window.location.href).toBe('/dashboard'))
  })

  it('displays error message on failed login', async () => {
    vi.mocked(signIn.email).mockResolvedValue({ error: { message: 'Invalid credentials' } } as any)

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByText('Увійти'))

    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
  })

  it('calls signIn.email with entered credentials', async () => {
    vi.mocked(signIn.email).mockResolvedValue({ error: null } as any)

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByText('Увійти'))

    await waitFor(() =>
      expect(signIn.email).toHaveBeenCalledWith({ email: 'test@test.com', password: 'secret123' }),
    )
  })
})
