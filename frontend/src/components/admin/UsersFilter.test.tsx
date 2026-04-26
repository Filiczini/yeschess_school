import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UsersFilter } from './UsersFilter'

describe('UsersFilter', () => {
  it('renders role buttons', () => {
    render(
      <UsersFilter
        activeRole=""
        showDeleted={false}
        onRoleChange={vi.fn()}
        onToggleDeleted={vi.fn()}
      />,
    )

    expect(screen.getByText('Всі користувачі')).toBeInTheDocument()
    expect(screen.getByText('Учні')).toBeInTheDocument()
    expect(screen.getByText('Тренери')).toBeInTheDocument()
  })

  it('calls onRoleChange when role clicked', () => {
    const onRoleChange = vi.fn()
    render(
      <UsersFilter
        activeRole=""
        showDeleted={false}
        onRoleChange={onRoleChange}
        onToggleDeleted={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByText('Тренери'))
    expect(onRoleChange).toHaveBeenCalledWith('coach')
  })

  it('shows deleted tab for super admin', () => {
    render(
      <UsersFilter
        activeRole=""
        showDeleted={false}
        onRoleChange={vi.fn()}
        onToggleDeleted={vi.fn()}
        isSuperAdmin={true}
      />,
    )

    expect(screen.getByText('Видалені')).toBeInTheDocument()
  })

  it('toggles deleted view', () => {
    const onToggleDeleted = vi.fn()
    render(
      <UsersFilter
        activeRole=""
        showDeleted={false}
        onRoleChange={vi.fn()}
        onToggleDeleted={onToggleDeleted}
        isSuperAdmin={true}
      />,
    )

    fireEvent.click(screen.getByText('Видалені'))
    expect(onToggleDeleted).toHaveBeenCalledTimes(1)
  })

  it('hides role buttons when showing deleted', () => {
    render(
      <UsersFilter
        activeRole=""
        showDeleted={true}
        onRoleChange={vi.fn()}
        onToggleDeleted={vi.fn()}
        isSuperAdmin={true}
      />,
    )

    expect(screen.queryByText('Учні')).not.toBeInTheDocument()
  })

  it('renders extra actions', () => {
    render(
      <UsersFilter
        activeRole=""
        showDeleted={false}
        onRoleChange={vi.fn()}
        onToggleDeleted={vi.fn()}
        extraActions={<button>Action</button>}
      />,
    )

    expect(screen.getByText('Action')).toBeInTheDocument()
  })
})
