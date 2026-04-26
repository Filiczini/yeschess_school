import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import ParentProfileEdit from './ParentProfileEdit'

const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...(actual as object), useNavigate: () => mockNavigate }
})

vi.mock('../lib/auth-client', () => ({
  useSession: () => ({ data: { user: { name: 'Parent One', email: 'parent@test.com' } } }),
}))

describe('ParentProfileEdit', () => {
  const mockUser = {
    name: 'Parent One',
    phone: '+380991111111',
    contactMethod: 'telegram',
    instagram: 'parentinsta',
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    mockNavigate.mockClear()
  })

  it('renders with session info and fetched data', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockUser,
    } as Response))

    render(
      <MemoryRouter>
        <ParentProfileEdit />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Parent One')).toBeInTheDocument())
    expect(screen.getByText('parent@test.com')).toBeInTheDocument()
    expect((screen.getByDisplayValue('+380991111111') as HTMLInputElement)).toBeInTheDocument()
    expect((screen.getByDisplayValue('parentinsta') as HTMLInputElement)).toBeInTheDocument()
  })

  it('submits successfully', async () => {
    const fetchMock = vi.fn(async (_url: string, options?: any) => {
      if (options?.method === 'PATCH') {
        return { ok: true, json: async () => ({}) }
      }
      return { ok: true, json: async () => mockUser }
    })
    globalThis.fetch = fetchMock

    render(
      <MemoryRouter>
        <ParentProfileEdit />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Parent One')).toBeInTheDocument())

    fireEvent.change(screen.getByDisplayValue('+380991111111'), { target: { value: '+380992222222' } })
    fireEvent.click(screen.getByText('Зберегти'))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/parent'))
  })

  it('shows error on failed save', async () => {
    const fetchMock = vi.fn(async (_url: string, options?: any) => {
      if (options?.method === 'PATCH') {
        return { ok: false, json: async () => ({ error: 'Помилка сервера' }) }
      }
      return { ok: true, json: async () => mockUser }
    })
    globalThis.fetch = fetchMock

    render(
      <MemoryRouter>
        <ParentProfileEdit />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Parent One')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Зберегти'))

    await waitFor(() => expect(screen.getByText('Помилка сервера')).toBeInTheDocument())
  })

  it('strips @ from instagram input', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockUser,
    } as Response))

    render(
      <MemoryRouter>
        <ParentProfileEdit />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Parent One')).toBeInTheDocument())

    const instagramInput = screen.getByDisplayValue('parentinsta')
    fireEvent.change(instagramInput, { target: { value: '@newhandle' } })

    expect((instagramInput as HTMLInputElement).value).toBe('newhandle')
  })
})
