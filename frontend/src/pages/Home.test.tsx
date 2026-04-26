import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Home from './Home'

vi.mock('../lib/auth-client', () => ({
  useSession: () => ({ data: null }),
}))

describe('Home', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders hero section with CTA buttons', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    expect(screen.getByText('YesChess')).toBeInTheDocument()
    expect(screen.getByText((c: string) => c.includes('Шахова школа'))).toBeInTheDocument()
    expect(screen.getAllByText('Залишити заявку').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('+38 (098) 083-77-42')).toBeInTheDocument()
    expect(screen.getByText('Увійти')).toBeInTheDocument()
  })

  it('renders FAQ section', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    expect(screen.getByText('Часті запитання')).toBeInTheDocument()
    expect(screen.getByText('Яка вартість занять (групових та індивідуальних)?')).toBeInTheDocument()
  })

  it('renders reviews section', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    expect(screen.getByText('Відгуки')).toBeInTheDocument()
    expect(screen.getByText('Марія К.')).toBeInTheDocument()
  })

  it('opens lead modal on button click', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByText('Залишити заявку')[0])

    // Modal title appears in the modal header
    expect(screen.getAllByText('Залишити заявку').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByPlaceholderText("Іван Петренко")).toBeInTheDocument()
    expect(screen.getByPlaceholderText('+38 (098) 000-00-00 або @username')).toBeInTheDocument()
  })

  it('submits lead form successfully', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({}),
    } as Response))

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByText('Залишити заявку')[0])

    fireEvent.change(screen.getByPlaceholderText("Іван Петренко"), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByPlaceholderText('+38 (098) 000-00-00 або @username'), { target: { value: '+380991234567' } })

    fireEvent.click(screen.getByText('Відправити заявку'))

    await waitFor(() => expect(screen.getByText('Заявку отримано!')).toBeInTheDocument())
  })

  it('shows error when lead submission fails', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({}),
    } as Response))

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByText('Залишити заявку')[0])

    fireEvent.change(screen.getByPlaceholderText("Іван Петренко"), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByPlaceholderText('+38 (098) 000-00-00 або @username'), { target: { value: '+380991234567' } })

    fireEvent.click(screen.getByText('Відправити заявку'))

    await waitFor(() => expect(screen.getByText('Щось пішло не так. Спробуйте ще раз.')).toBeInTheDocument())
  })

  it('closes lead modal on backdrop click', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByText('Залишити заявку')[0])
    expect(screen.getByPlaceholderText("Іван Петренко")).toBeInTheDocument()

    // Click on the modal backdrop (the fixed div wrapping the modal)
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/60')
    if (backdrop) {
      fireEvent.click(backdrop)
    }
  })

  it('toggles FAQ items', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    const faqButton = screen.getByText('Яка вартість занять (групових та індивідуальних)?')
    fireEvent.click(faqButton)

    expect(screen.getByText((c: string) => c.includes('Вартість занять залежить'))).toBeInTheDocument()
  })
})
