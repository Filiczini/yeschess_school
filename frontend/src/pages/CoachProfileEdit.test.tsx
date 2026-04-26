import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import CoachProfileEdit from './CoachProfileEdit'

const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('CoachProfileEdit', () => {
  const mockProfile = {
    bio: 'Experienced coach',
    title: 'GM',
    fideRating: 2500,
    hourlyRate: '500',
    languages: ['Українська', 'Англійська'],
    specializations: ['Дебют', 'Тактика'],
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    mockNavigate.mockClear()
  })

  it('shows loading state initially', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <CoachProfileEdit />
      </MemoryRouter>,
    )

    expect(screen.getByText('Завантаження...')).toBeInTheDocument()
  })

  it('renders form with fetched profile data', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockProfile,
    } as Response))

    render(
      <MemoryRouter>
        <CoachProfileEdit />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Мій профіль')).toBeInTheDocument())
    expect(screen.getByDisplayValue('Experienced coach')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2500')).toBeInTheDocument()
    expect(screen.getByDisplayValue('500')).toBeInTheDocument()
  })

  it('shows validation error when hourly rate is empty', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...mockProfile, hourlyRate: '500' }),
    } as Response))

    render(
      <MemoryRouter>
        <CoachProfileEdit />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Мій профіль')).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText('500'), { target: { value: '' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(screen.getByText('Вкажіть ставку за годину')).toBeInTheDocument())
  })

  it('submits form and navigates on success', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockProfile,
    } as Response))

    render(
      <MemoryRouter>
        <CoachProfileEdit />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Мій профіль')).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText('Розкажіть про свій досвід, підхід до навчання...'), { target: { value: 'New bio' } })
    fireEvent.click(screen.getByText('Зберегти профіль'))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/coach/profile'))
  })

  it('shows server error on failed save', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...mockProfile, hourlyRate: '500' }),
    } as Response))

    render(
      <MemoryRouter>
        <CoachProfileEdit />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Мій профіль')).toBeInTheDocument())

    // Override fetch for the PUT call
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: 'Недійсні дані' }),
    } as Response))

    fireEvent.click(screen.getByText('Зберегти профіль'))

    await waitFor(() => expect(screen.getByText('Недійсні дані')).toBeInTheDocument())
  })

  it('toggles language selection', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockProfile,
    } as Response))

    render(
      <MemoryRouter>
        <CoachProfileEdit />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Мови навчання')).toBeInTheDocument())

    const langBtn = screen.getByText('Польська')
    fireEvent.click(langBtn)

    // After clicking, the button should have the selected style (bg-white)
    expect(langBtn).toHaveClass('bg-white')
  })

  it('toggles specialization selection', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockProfile,
    } as Response))

    render(
      <MemoryRouter>
        <CoachProfileEdit />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Спеціалізація')).toBeInTheDocument())

    const specBtn = screen.getByText('Ендшпіль')
    fireEvent.click(specBtn)

    expect(specBtn).toHaveClass('bg-white')
  })
})
