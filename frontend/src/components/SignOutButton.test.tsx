import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SignOutButton from './SignOutButton'

vi.mock('../lib/auth-client', () => ({
  signOut: vi.fn(() => Promise.resolve()),
}))

import { signOut } from '../lib/auth-client'

describe('SignOutButton', () => {
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-ignore
    delete window.location
    window.location = { ...originalLocation, href: '' } as any
  })

  afterEach(() => {
    window.location = originalLocation
  })

  it('calls signOut and redirects on click', async () => {
    render(<SignOutButton />)

    fireEvent.click(screen.getByText('Вийти'))
    await Promise.resolve()

    expect(signOut).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe('/')
  })

  it('applies dark variant classes by default', () => {
    const { container } = render(<SignOutButton />)
    expect(container.querySelector('button')).toHaveClass('bg-white/10')
    expect(container.querySelector('button')).toHaveClass('text-white')
  })

  it('applies light variant classes when specified', () => {
    const { container } = render(<SignOutButton variant="light" />)
    expect(container.querySelector('button')).toHaveClass('bg-gray-100')
    expect(container.querySelector('button')).toHaveClass('text-gray-700')
  })
})
