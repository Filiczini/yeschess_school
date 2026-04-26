import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import StudentProfileEdit from './StudentProfileEdit'

const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...(actual as object), useNavigate: () => mockNavigate }
})

describe('StudentProfileEdit', () => {
  const mockProfile = {
    level: 'intermediate',
    fideRating: 1500,
    clubRating: 1400,
    chesscomUsername: 'alicechess',
    lichessUsername: 'alicelichess',
    bio: 'I love chess',
    birthdate: '2010-05-15',
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    mockNavigate.mockClear()
  })

  it('shows loading state initially', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <StudentProfileEdit />
      </MemoryRouter>,
    )

    expect(screen.getByText('Завантаження...')).toBeInTheDocument()
  })

  it('renders form with fetched data', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockProfile,
    } as Response))

    render(
      <MemoryRouter>
        <StudentProfileEdit />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Мій профіль')).toBeInTheDocument())
    expect((screen.getByPlaceholderText('напр. 1500') as HTMLInputElement).value).toBe('1500')
    expect((screen.getByPlaceholderText('напр. 1200') as HTMLInputElement).value).toBe('1400')
    const nickInputs = screen.getAllByPlaceholderText('ваш нікнейм')
    expect((nickInputs[0] as HTMLInputElement).value).toBe('alicechess')
    expect((nickInputs[1] as HTMLInputElement).value).toBe('alicelichess')
    expect((screen.getByPlaceholderText('Розкажи про себе...') as HTMLTextAreaElement).value).toBe('I love chess')
  })

  it('submits form successfully', async () => {
    const fetchMock = vi.fn(async (_url: string, options?: any) => {
      if (options?.method === 'PUT') {
        return { ok: true, json: async () => ({}) }
      }
      return { ok: true, json: async () => mockProfile }
    })
    globalThis.fetch = fetchMock

    render(
      <MemoryRouter>
        <StudentProfileEdit />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Мій профіль')).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText('напр. 1500'), { target: { value: '1600' } })
    fireEvent.click(screen.getByText('Зберегти'))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/student'))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('shows error on failed save', async () => {
    const fetchMock = vi.fn(async (_url: string, options?: any) => {
      if (options?.method === 'PUT') {
        return { ok: false, json: async () => ({ error: 'Не вдалося зберегти' }) }
      }
      return { ok: true, json: async () => mockProfile }
    })
    globalThis.fetch = fetchMock

    render(
      <MemoryRouter>
        <StudentProfileEdit />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Мій профіль')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Зберегти'))

    await waitFor(() => expect(screen.getByText('Не вдалося зберегти')).toBeInTheDocument())
  })

  it('updates form fields on change', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({}),
    } as Response))

    render(
      <MemoryRouter>
        <StudentProfileEdit />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Мій профіль')).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText('напр. 1500'), { target: { value: '1800' } })
    expect((screen.getByPlaceholderText('напр. 1500') as HTMLInputElement).value).toBe('1800')

    fireEvent.change(screen.getByPlaceholderText('Розкажи про себе...'), { target: { value: 'Updated bio' } })
    expect((screen.getByPlaceholderText('Розкажи про себе...') as HTMLTextAreaElement).value).toBe('Updated bio')
  })
})
