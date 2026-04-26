import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import ForgotPassword from './ForgotPassword'

const mockRequestPasswordReset = vi.fn()

vi.mock('../lib/auth-client', () => ({
  authClient: {
    requestPasswordReset: (...args: any[]) => mockRequestPasswordReset(...args),
  },
}))

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockRequestPasswordReset.mockClear()
  })

  it('renders forgot password form', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    )

    expect(screen.getByText('Забули пароль?')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByText('Надіслати посилання')).toBeInTheDocument()
    expect(screen.getByText('← Повернутись до входу')).toBeInTheDocument()
  })

  it('submits email and shows success message', async () => {
    mockRequestPasswordReset.mockResolvedValue({ error: null })

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'user@test.com' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(screen.getByText('Лист надіслано')).toBeInTheDocument())
    expect(screen.getByText((c: string) => c.includes('user@test.com'))).toBeInTheDocument()
    expect(mockRequestPasswordReset).toHaveBeenCalledWith({
      email: 'user@test.com',
      redirectTo: '/reset-password',
    })
  })

  it('shows error on requestPasswordReset failure', async () => {
    mockRequestPasswordReset.mockResolvedValue({ error: { message: 'Користувача не знайдено' } })

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'bad@test.com' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(screen.getByText('Користувача не знайдено')).toBeInTheDocument())
  })

  it('shows default error when no message provided', async () => {
    mockRequestPasswordReset.mockResolvedValue({ error: {} })

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'bad@test.com' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(screen.getByText('Помилка. Спробуйте ще раз.')).toBeInTheDocument())
  })

  it('shows loading state while submitting', async () => {
    let resolveRequest: (value: any) => void
    const requestPromise = new Promise<any>(resolve => { resolveRequest = resolve })
    mockRequestPasswordReset.mockReturnValue(requestPromise)

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'user@test.com' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(screen.getByText('Надсилаємо...')).toBeInTheDocument())

    resolveRequest!({ error: null })
  })
})
