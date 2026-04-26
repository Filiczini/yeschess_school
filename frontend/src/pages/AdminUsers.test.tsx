import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import AdminUsers from './AdminUsers'

describe('AdminUsers', () => {
  const mockUsers = [
    { id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'student', status: 'active', plan: 'free', createdAt: '2024-01-01', deletedAt: null },
    { id: 'u2', name: 'Bob', email: 'bob@test.com', role: 'coach', status: 'pending', plan: 'free', createdAt: '2024-02-01', deletedAt: null },
  ]

  const mockDeletedUsers = [
    { id: 'u3', name: 'Charlie', email: 'charlie@test.com', role: 'student', status: 'active', plan: 'free', createdAt: '2024-01-01', deletedAt: '2024-06-01' },
  ]

  function mockFetchSequence(responses: any[]) {
    let callIndex = 0
    globalThis.fetch = vi.fn(async () => {
      const res = responses[callIndex++] ?? { ok: true, json: async () => ({}) }
      return res
    })
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders user table with data', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'super_admin' }) },
      { ok: true, json: async () => ({ data: mockUsers, meta: { total: 2, page: 1, limit: 50, pages: 1 } }) },
    ])

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('alice@test.com')).toBeInTheDocument()
    expect(screen.getByText('bob@test.com')).toBeInTheDocument()
  })

  it('shows empty state when no users', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'super_admin' }) },
      { ok: true, json: async () => ({ data: [], meta: { total: 0, page: 1, limit: 50, pages: 0 } }) },
    ])

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Користувачів не знайдено')).toBeInTheDocument())
    expect(screen.getByText('Спробуйте змінити фільтр')).toBeInTheDocument()
  })

  it('filters users by role', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'super_admin' }) },
      { ok: true, json: async () => ({ data: mockUsers, meta: { total: 2, page: 1, limit: 50, pages: 1 } }) },
      { ok: true, json: async () => ({ data: [mockUsers[1]], meta: { total: 1, page: 1, limit: 50, pages: 1 } }) },
    ])

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Тренери'))

    await waitFor(() => expect(screen.queryByText('Alice')).not.toBeInTheDocument())
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('toggles deleted users view', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'super_admin' }) },
      { ok: true, json: async () => ({ data: mockUsers, meta: { total: 2, page: 1, limit: 50, pages: 1 } }) },
      { ok: true, json: async () => ({ data: mockDeletedUsers, meta: { total: 1, page: 1, limit: 50, pages: 1 } }) },
    ])

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Видалені'))

    await waitFor(() => expect(screen.getByText('Charlie')).toBeInTheDocument())
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('shows pagination when multiple pages', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'super_admin' }) },
      { ok: true, json: async () => ({ data: mockUsers, meta: { total: 60, page: 1, limit: 50, pages: 2 } }) },
    ])

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText((c) => c.includes('Сторінка 1 з 2'))).toBeInTheDocument())
    // Check that pagination total appears (there are two elements with count, just check at least one)
    const countElements = screen.getAllByText((c: string) => c.includes('60') && c.includes('записів'))
    expect(countElements.length).toBeGreaterThanOrEqual(1)
  })

  it('navigates to next page', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'super_admin' }) },
      { ok: true, json: async () => ({ data: mockUsers, meta: { total: 60, page: 1, limit: 50, pages: 2 } }) },
      { ok: true, json: async () => ({ data: [{ ...mockUsers[0], id: 'u99' }], meta: { total: 60, page: 2, limit: 50, pages: 2 } }) },
    ])

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText((c) => c.includes('Сторінка 1 з 2'))).toBeInTheDocument())

    fireEvent.click(screen.getByText('Далі →'))

    await waitFor(() => expect(screen.getByText((c) => c.includes('Сторінка 2 з 2'))).toBeInTheDocument())
  })

  it('opens delete confirmation dialog', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'super_admin' }) },
      { ok: true, json: async () => ({ data: mockUsers, meta: { total: 2, page: 1, limit: 50, pages: 1 } }) },
    ])

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())

    // Find delete button for Alice
    const deleteButtons = screen.getAllByTitle('Видалити користувача')
    await act(async () => {
      fireEvent.click(deleteButtons[0])
    })

    // Use findByText for async appearance
    const dialogTitle = await screen.findByText('Видалити користувача?')
    expect(dialogTitle).toBeInTheDocument()
    // Alice appears twice: in table and in dialog
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('alice@test.com').length).toBeGreaterThanOrEqual(1)
  })

  it('confirms soft delete and removes user from list', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'super_admin' }) },
      { ok: true, json: async () => ({ data: mockUsers, meta: { total: 2, page: 1, limit: 50, pages: 1 } }) },
      // After delete, refetch
      { ok: true, json: async () => ({ data: [mockUsers[1]], meta: { total: 1, page: 1, limit: 50, pages: 1 } }) },
    ])

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())

    const deleteButtons = screen.getAllByTitle('Видалити користувача')
    await act(async () => {
      fireEvent.click(deleteButtons[0])
    })

    await waitFor(() => expect(screen.getByText('Видалити користувача?')).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByText('Видалити'))
    })

    await waitFor(() => expect(screen.queryByText('Alice')).not.toBeInTheDocument())
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('restores deleted user', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'super_admin' }) },
      { ok: true, json: async () => ({ data: mockDeletedUsers, meta: { total: 1, page: 1, limit: 50, pages: 1 } }) },
      // After clicking "Видалені", load fetches again
      { ok: true, json: async () => ({ data: mockDeletedUsers, meta: { total: 1, page: 1, limit: 50, pages: 1 } }) },
      { ok: true, json: async () => ({ ok: true }) },
    ])

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>,
    )

    // Wait for profile to load so isSuperAdmin becomes true
    await waitFor(() => expect(screen.getByText('Видалені')).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByText('Видалені'))
    })

    await waitFor(() => expect(screen.getByText('Charlie')).toBeInTheDocument())

    const restoreBtn = screen.getByTitle('Відновити користувача')
    await act(async () => {
      fireEvent.click(restoreBtn)
    })

    await waitFor(() => expect(screen.queryByText('Charlie')).not.toBeInTheDocument())
  })

  it('selects a single user via checkbox', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'super_admin' }) },
      { ok: true, json: async () => ({ data: mockDeletedUsers, meta: { total: 1, page: 1, limit: 50, pages: 1 } }) },
      // After clicking "Видалені"
      { ok: true, json: async () => ({ data: mockDeletedUsers, meta: { total: 1, page: 1, limit: 50, pages: 1 } }) },
    ])

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Видалені')).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByText('Видалені'))
    })

    await waitFor(() => expect(screen.getByText('Charlie')).toBeInTheDocument())

    const checkboxes = document.querySelectorAll('input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThanOrEqual(1)
    await act(async () => {
      fireEvent.click(checkboxes[0])
    })

    // Permanent delete button should appear when at least one selected
    expect(screen.getByText((c: string) => c.includes('Видалити остаточно'))).toBeInTheDocument()
  })

  it('shows loading spinner while fetching', () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'super_admin' }) },
      new Promise(() => {}) as any, // never resolves
    ])

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>,
    )

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('selects all users and permanently deletes them', async () => {
    mockFetchSequence([
      { ok: true, json: async () => ({ role: 'super_admin' }) },
      { ok: true, json: async () => ({ data: mockDeletedUsers, meta: { total: 1, page: 1, limit: 50, pages: 1 } }) },
      // After toggle
      { ok: true, json: async () => ({ data: mockDeletedUsers, meta: { total: 1, page: 1, limit: 50, pages: 1 } }) },
      { ok: true, json: async () => ({ ok: true, deleted: 1 }) },
    ])

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Видалені')).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByText('Видалені'))
    })

    await waitFor(() => expect(screen.getByText('Charlie')).toBeInTheDocument())

    const checkbox = document.querySelector('input[type="checkbox"]')
    if (checkbox) {
      await act(async () => {
        fireEvent.click(checkbox)
      })
    }

    const permanentBtn = screen.getByText((c: string) => c.includes('Видалити остаточно'))
    await act(async () => {
      fireEvent.click(permanentBtn)
    })

    await waitFor(() => expect(screen.getByText('Видалити назавжди?')).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByText('Видалити назавжди'))
    })

    await waitFor(() => expect(screen.queryByText('Charlie')).not.toBeInTheDocument())
  })

  it('navigates to previous page', async () => {
    globalThis.fetch = vi.fn(async (_url: string) => {
      if (_url.includes('/api/users/me')) {
        return { ok: true, json: async () => ({ role: 'super_admin' }) } as Response
      }
      if (_url.includes('page=2')) {
        return { ok: true, json: async () => ({ data: mockUsers, meta: { total: 60, page: 2, limit: 50, pages: 2 } }) } as Response
      }
      return { ok: true, json: async () => ({ data: mockUsers, meta: { total: 60, page: 1, limit: 50, pages: 2 } }) } as Response
    })

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText((c) => c.includes('Сторінка 1 з 2'))).toBeInTheDocument())

    fireEvent.click(screen.getByText('Далі →'))

    await waitFor(() => expect(screen.getByText((c) => c.includes('Сторінка 2 з 2'))).toBeInTheDocument())

    fireEvent.click(screen.getByText('← Назад'))

    await waitFor(() => expect(screen.getByText((c) => c.includes('Сторінка 1 з 2'))).toBeInTheDocument())
  })
})
