import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import LinkCodeSection from './LinkCodeSection'

describe('LinkCodeSection', () => {
  it('renders generate button when no code', () => {
    const onGenerate = vi.fn()
    render(<LinkCodeSection code={null} loading={false} onGenerate={onGenerate} />)

    expect(screen.getByText('Отримати код прив\'язки')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<LinkCodeSection code={null} loading={true} onGenerate={vi.fn()} />)

    expect(screen.getByText('Генерація...')).toBeInTheDocument()
  })

  it('renders code and expiry when code exists', () => {
    const code = { code: 'A1B2C3D4E5', expiresAt: new Date(Date.now() + 3600000).toISOString() }
    render(<LinkCodeSection code={code} loading={false} onGenerate={vi.fn()} />)

    expect(screen.getByText('A1B2C3D4E5')).toBeInTheDocument()
    expect(screen.getByTitle('Скопіювати')).toBeInTheDocument()
  })

  it('calls onGenerate when button clicked', async () => {
    const onGenerate = vi.fn()
    render(<LinkCodeSection code={null} loading={false} onGenerate={onGenerate} />)

    await act(async () => {
      fireEvent.click(screen.getByText('Отримати код прив\'язки'))
    })

    expect(onGenerate).toHaveBeenCalledTimes(1)
  })

  it('copies code to clipboard', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.assign(navigator, { clipboard: { writeText } })

    const code = { code: 'X9Y8Z7W6V5', expiresAt: new Date(Date.now() + 3600000).toISOString() }
    render(<LinkCodeSection code={code} loading={false} onGenerate={vi.fn()} />)

    await act(async () => {
      fireEvent.click(screen.getByTitle('Скопіювати'))
    })

    expect(writeText).toHaveBeenCalledWith('X9Y8Z7W6V5')
  })
})
