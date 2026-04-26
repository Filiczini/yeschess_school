import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import ResetPassword from './ResetPassword'

const mockResetPassword = vi.fn()

vi.mock('../lib/auth-client', () => ({
  authClient: {
    resetPassword: (...args: any[]) => mockResetPassword(...args),
  },
}))

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockResetPassword.mockClear()
  })

  it('shows invalid link when no token', () => {
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>,
    )

    expect(screen.getByText('Недійсне посилання')).toBeInTheDocument()
    expect(screen.getByText('Запросити нове посилання')).toBeInTheDocument()
  })

  it('renders reset form with token', () => {
    const entries = ['/?token=abc123']
    render(
      <MemoryRouter initialEntries={entries}>
        <ResetPassword />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('Новий пароль').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByPlaceholderText('Мінімум 8 символів')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByText('Зберегти пароль')).toBeInTheDocument()
  })

  it('shows error when password too short', async () => {
    const entries = ['/?token=abc123']
    render(
      <MemoryRouter initialEntries={entries}>
        <ResetPassword />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Мінімум 8 символів'), { target: { value: 'short' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'short' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(screen.getByText('Пароль має містити щонайменше 8 символів')).toBeInTheDocument())
  })

  it('shows error when passwords do not match', async () => {
    const entries = ['/?token=abc123']
    render(
      <MemoryRouter initialEntries={entries}>
        <ResetPassword />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Мінімум 8 символів'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'different123' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(screen.getByText('Паролі не збігаються')).toBeInTheDocument())
  })

  it('submits successfully and shows success state', async () => {
    mockResetPassword.mockResolvedValue({ error: null })
    const entries = ['/?token=abc123']

    render(
      <MemoryRouter initialEntries={entries}>
        <ResetPassword />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Мінімум 8 символів'), { target: { value: 'newpassword123' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'newpassword123' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(screen.getByText('Пароль змінено!')).toBeInTheDocument())
    expect(screen.getByText('Увійти')).toBeInTheDocument()
    expect(mockResetPassword).toHaveBeenCalledWith({ newPassword: 'newpassword123', token: 'abc123' })
  })

  it('shows error on resetPassword failure', async () => {
    mockResetPassword.mockResolvedValue({ error: { message: 'Токен застарів' } })
    const entries = ['/?token=abc123']

    render(
      <MemoryRouter initialEntries={entries}>
        <ResetPassword />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Мінімум 8 символів'), { target: { value: 'newpassword123' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'newpassword123' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(screen.getByText('Токен застарів')).toBeInTheDocument())
  })

  it('shows default error when no message provided', async () => {
    mockResetPassword.mockResolvedValue({ error: {} })
    const entries = ['/?token=abc123']

    render(
      <MemoryRouter initialEntries={entries}>
        <ResetPassword />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Мінімум 8 символів'), { target: { value: 'newpassword123' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'newpassword123' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(screen.getByText('Помилка скидання паролю. Посилання могло застаріти.')).toBeInTheDocument())
  })
})
