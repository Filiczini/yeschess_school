import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import NotFound from './NotFound'

describe('NotFound', () => {
  it('renders 404 page with correct text', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Сторінку не знайдено')).toBeInTheDocument()
    expect(screen.getByText((c: string) => c.includes('Схоже, ця сторінка не існує'))).toBeInTheDocument()
  })

  it('has link back to home', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )

    expect(screen.getByText('На головну')).toBeInTheDocument()
  })
})
