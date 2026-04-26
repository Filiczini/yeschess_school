import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import CoachProfile from './CoachProfile'

describe('CoachProfile', () => {
  const mockProfile = {
    id: 'c1',
    bio: 'Experienced GM coach with 10+ years of teaching.',
    title: 'GM',
    fideRating: 2600,
    hourlyRate: '800',
    languages: ['Українська', 'Англійська'],
    specializations: ['Дебют', 'Ендшпіль'],
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading state initially', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <CoachProfile />
      </MemoryRouter>,
    )

    expect(screen.getByText('Завантаження...')).toBeInTheDocument()
  })

  it('renders profile with all sections', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockProfile,
    } as Response))

    render(
      <MemoryRouter>
        <CoachProfile />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Мій профіль')).toBeInTheDocument())
    expect(screen.getByText('Редагувати')).toBeInTheDocument()
    expect(screen.getByText('Experienced GM coach with 10+ years of teaching.')).toBeInTheDocument()
    expect(screen.getByText('GM')).toBeInTheDocument()
    expect(screen.getByText('2600')).toBeInTheDocument()
    expect(screen.getByText('800')).toBeInTheDocument()
    expect(screen.getByText('₴ / год')).toBeInTheDocument()
    expect(screen.getByText('Українська')).toBeInTheDocument()
    expect(screen.getByText('Англійська')).toBeInTheDocument()
    expect(screen.getByText('Дебют')).toBeInTheDocument()
    expect(screen.getByText('Ендшпіль')).toBeInTheDocument()
  })

  it('shows empty state when no profile', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => null,
    } as Response))

    render(
      <MemoryRouter>
        <CoachProfile />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Профіль ще не заповнено.')).toBeInTheDocument())
    expect(screen.getByText('Заповнити профіль')).toBeInTheDocument()
  })

  it('hides bio section when bio is empty', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...mockProfile, bio: null }),
    } as Response))

    render(
      <MemoryRouter>
        <CoachProfile />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Мій профіль')).toBeInTheDocument())
    expect(screen.queryByText('Про себе')).not.toBeInTheDocument()
  })

  it('shows dashes when optional fields are null', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...mockProfile,
        title: null,
        fideRating: null,
        languages: [],
        specializations: [],
      }),
    } as Response))

    render(
      <MemoryRouter>
        <CoachProfile />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Мій профіль')).toBeInTheDocument())
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
  })
})
