import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorMessage from './ErrorMessage'

describe('ErrorMessage', () => {
  it('returns null when error is null', () => {
    const { container } = render(<ErrorMessage error={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when error is undefined', () => {
    const { container } = render(<ErrorMessage error={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when error is empty string', () => {
    const { container } = render(<ErrorMessage error="" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders dark variant by default', () => {
    render(<ErrorMessage error="Something broke" />)
    const el = screen.getByText('Something broke')
    expect(el).toBeInTheDocument()
    expect(el).toHaveClass('text-red-300')
  })

  it('renders light variant', () => {
    render(<ErrorMessage error="Light error" variant="light" />)
    expect(screen.getByText('Light error')).toHaveClass('text-red-600')
  })

  it('renders auth variant', () => {
    render(<ErrorMessage error="Auth error" variant="auth" />)
    expect(screen.getByText('Auth error')).toHaveClass('text-red-300')
  })

  it('renders admin variant with icon', () => {
    render(<ErrorMessage error="Admin error" variant="admin" />)
    const el = screen.getByText('Admin error')
    expect(el).toBeInTheDocument()
    expect(el).toHaveClass('text-red-600')
    expect(document.querySelector('iconify-icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<ErrorMessage error="Styled" className="my-class" />)
    expect(screen.getByText('Styled')).toHaveClass('my-class')
  })
})
