import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import ParentAddChild from './ParentAddChild'

const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('ParentAddChild', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockNavigate.mockClear()
  })

  it('renders new account tab by default', () => {
    render(
      <MemoryRouter>
        <ParentAddChild />
      </MemoryRouter>,
    )

    expect(screen.getByText('Додати дитину')).toBeInTheDocument()
    expect(screen.getByText('Новий акаунт')).toBeInTheDocument()
    expect(screen.getByText('Є акаунт')).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Іван Петренко")).toBeInTheDocument()
    expect(screen.getByText('Створити акаунт')).toBeInTheDocument()
  })

  it('switches to code tab', () => {
    render(
      <MemoryRouter>
        <ParentAddChild />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Є акаунт'))

    expect(screen.getByPlaceholderText('8X4K92JF')).toBeInTheDocument()
    expect(screen.getByText("Прив'язати")).toBeInTheDocument()
  })

  it('submits new child form successfully', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({}),
    } as Response))

    render(
      <MemoryRouter>
        <ParentAddChild />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText("Іван Петренко"), { target: { value: 'Child Name' } })
    fireEvent.change(screen.getByPlaceholderText('ivan@example.com'), { target: { value: 'child@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Мінімум 8 символів'), { target: { value: 'password123' } })

    fireEvent.click(screen.getByText('Створити акаунт'))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/parent'))
  })

  it('shows error when create child fails', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: 'Email вже використовується' }),
    } as Response))

    render(
      <MemoryRouter>
        <ParentAddChild />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText("Іван Петренко"), { target: { value: 'Child Name' } })
    fireEvent.change(screen.getByPlaceholderText('ivan@example.com'), { target: { value: 'child@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Мінімум 8 символів'), { target: { value: 'password123' } })

    fireEvent.click(screen.getByText('Створити акаунт'))

    await waitFor(() => expect(screen.getByText('Email вже використовується')).toBeInTheDocument())
  })

  it('submits link code form successfully', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({}),
    } as Response))

    render(
      <MemoryRouter>
        <ParentAddChild />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Є акаунт'))

    const codeInput = screen.getByPlaceholderText('8X4K92JF')
    fireEvent.change(codeInput, { target: { value: 'ABC123' } })

    fireEvent.click(screen.getByText("Прив'язати"))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/parent'))
  })

  it('shows error when link code fails', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: 'Код не знайдено' }),
    } as Response))

    render(
      <MemoryRouter>
        <ParentAddChild />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Є акаунт'))

    const codeInput = screen.getByPlaceholderText('8X4K92JF')
    fireEvent.change(codeInput, { target: { value: 'ABC123' } })

    fireEvent.click(screen.getByText("Прив'язати"))

    await waitFor(() => expect(screen.getByText('Код не знайдено')).toBeInTheDocument())
  })

  it('disables link button when code is too short', () => {
    render(
      <MemoryRouter>
        <ParentAddChild />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Є акаунт'))

    const codeInput = screen.getByPlaceholderText('8X4K92JF')
    fireEvent.change(codeInput, { target: { value: 'AB' } })

    const btn = screen.getByText("Прив'язати")
    expect(btn).toBeDisabled()
  })

  it('converts code input to uppercase', () => {
    render(
      <MemoryRouter>
        <ParentAddChild />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Є акаунт'))

    const codeInput = screen.getByPlaceholderText('8X4K92JF') as HTMLInputElement
    fireEvent.change(codeInput, { target: { value: 'abc123' } })

    expect(codeInput.value).toBe('ABC123')
  })

  it('clears error when switching tabs', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: 'Email вже використовується' }),
    } as Response))

    render(
      <MemoryRouter>
        <ParentAddChild />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText("Іван Петренко"), { target: { value: 'Child Name' } })
    fireEvent.change(screen.getByPlaceholderText('ivan@example.com'), { target: { value: 'child@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Мінімум 8 символів'), { target: { value: 'password123' } })

    fireEvent.click(screen.getByText('Створити акаунт'))

    await waitFor(() => expect(screen.getByText('Email вже використовується')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Є акаунт'))

    expect(screen.queryByText('Email вже використовується')).not.toBeInTheDocument()
  })
})
