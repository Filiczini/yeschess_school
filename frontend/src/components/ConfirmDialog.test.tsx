import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        onClose={vi.fn()}
        title="Delete?"
        description="Are you sure?"
        confirmLabel="Delete"
        onConfirm={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders content when open is true', () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={vi.fn()}
        title="Delete?"
        description="Are you sure?"
        confirmLabel="Delete"
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText('Delete?')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Скасувати')).toBeInTheDocument()
  })

  it('calls onClose when cancel button clicked', () => {
    const onClose = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        title="Delete?"
        description="Are you sure?"
        confirmLabel="Delete"
        onConfirm={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByText('Скасувати'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onClose={vi.fn()}
        title="Delete?"
        description="Are you sure?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByText('Delete'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop clicked and not loading', () => {
    const onClose = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        title="Delete?"
        description="Are you sure?"
        confirmLabel="Delete"
        onConfirm={vi.fn()}
      />,
    )

    const backdrop = document.querySelector('.bg-black\\/40')
    expect(backdrop).toBeInTheDocument()
    if (backdrop) fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when backdrop clicked while loading', () => {
    const onClose = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        title="Delete?"
        description="Are you sure?"
        confirmLabel="Delete"
        onConfirm={vi.fn()}
        loading={true}
      />,
    )

    const backdrop = document.querySelector('.bg-black\\/40')
    if (backdrop) fireEvent.click(backdrop)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('disables buttons and shows spinner when loading', () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={vi.fn()}
        title="Delete?"
        description="Are you sure?"
        confirmLabel="Delete"
        onConfirm={vi.fn()}
        loading={true}
      />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    buttons.forEach((btn) => expect(btn).toBeDisabled())
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('applies danger styling when danger=true', () => {
    const { container } = render(
      <ConfirmDialog
        open={true}
        onClose={vi.fn()}
        title="Delete?"
        description="Are you sure?"
        confirmLabel="Delete"
        onConfirm={vi.fn()}
        danger={true}
      />,
    )

    expect(container.innerHTML).toContain('bg-red-100')
    expect(container.innerHTML).toContain('bg-red-600')
  })
})
