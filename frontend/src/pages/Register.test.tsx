import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Register from './Register'

const mockSignUp = vi.fn()

vi.mock('../lib/auth-client', () => ({
  signUp: { email: (...args: any[]) => mockSignUp(...args) },
}))

describe('Register', () => {
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: 'active' }),
    } as Response))
    // @ts-ignore
    delete window.location
    window.location = { ...originalLocation, href: '' } as any
  })

  afterEach(() => {
    window.location = originalLocation
  })

  function fillForm() {
    fireEvent.change(screen.getByPlaceholderText("Іван Петренко"), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByPlaceholderText('мін. 8 символів'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByPlaceholderText('+38 (098) 000-00-00'), { target: { value: '+380991234567' } })
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@test.com' } })
  }

  it('renders role selector and registration form', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )

    expect(screen.getByText('Реєстрація')).toBeInTheDocument()
    expect(screen.getByText('Я учень')).toBeInTheDocument()
    expect(screen.getByText('Я батько/мати')).toBeInTheDocument()
    expect(screen.getByText('Я тренер')).toBeInTheDocument()
  })

  it('selects role and fills form', async () => {
    mockSignUp.mockResolvedValue({ error: null })

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Я учень'))
    fillForm()

    fireEvent.click(screen.getByText('Зареєструватись'))

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
    }))
  })

  it('disables submit button when no role selected', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )

    const btn = screen.getByText('Зареєструватись')
    expect(btn).toBeDisabled()
  })

  it('shows error on signUp failure', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'Email already in use' } })

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Я учень'))
    fillForm()

    fireEvent.click(screen.getByText('Зареєструватись'))

    await waitFor(() => expect(screen.getByText('Email already in use')).toBeInTheDocument())
  })

  it('redirects to /pending when coach status is pending', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: 'pending' }),
    } as Response))

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Я тренер'))
    fillForm()

    fireEvent.click(screen.getByText('Зареєструватись'))

    await waitFor(() => expect(window.location.href).toBe('/pending'))
  })

  it('redirects to /dashboard when registration is active', async () => {
    mockSignUp.mockResolvedValue({ error: null })

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Я учень'))
    fillForm()

    fireEvent.click(screen.getByText('Зареєструватись'))

    await waitFor(() => expect(window.location.href).toBe('/dashboard'))
  })

  it('shows error when role PATCH fails', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: 'Role assignment failed' }),
    } as Response))

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Я учень'))
    fillForm()

    fireEvent.click(screen.getByText('Зареєструватись'))

    await waitFor(() => expect(screen.getByText("Не вдалось встановити роль")).toBeInTheDocument())
  })
})
