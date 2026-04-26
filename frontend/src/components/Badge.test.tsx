import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, RoleBadge, StatusBadge, LevelBadge } from './Badge'

describe('Badge', () => {
  it('renders children with default classes', () => {
    render(<Badge>Test</Badge>)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('appends custom className', () => {
    const { container } = render(<Badge className="custom-class">Test</Badge>)
    expect(container.querySelector('span')).toHaveClass('custom-class')
  })
})

describe('RoleBadge', () => {
  it.each([
    ['student', 'Учень'],
    ['parent', 'Батько/Мати'],
    ['coach', 'Тренер'],
    ['school_owner', 'Власник'],
    ['admin', 'Адмін'],
    ['super_admin', 'Супер адмін'],
  ] as const)('renders label %s → %s', (role, label) => {
    render(<RoleBadge role={role} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('falls back to raw role for unknown roles', () => {
    render(<RoleBadge role="unknown_role" />)
    expect(screen.getByText('unknown_role')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it('renders light variant by default', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByText('Активний')).toBeInTheDocument()
  })

  it('renders dark variant when specified', () => {
    render(<StatusBadge status="confirmed" variant="dark" />)
    expect(screen.getByText('Підтверджено')).toBeInTheDocument()
  })

  it('falls back to raw status for unknown values', () => {
    render(<StatusBadge status="weird" />)
    expect(screen.getByText('weird')).toBeInTheDocument()
  })
})

describe('LevelBadge', () => {
  it.each([
    ['beginner', 'Початківець'],
    ['intermediate', 'Середній'],
    ['advanced', 'Просунутий'],
  ] as const)('renders label %s → %s', (level, label) => {
    render(<LevelBadge level={level} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('falls back to raw level for unknown values', () => {
    render(<LevelBadge level="expert" />)
    expect(screen.getByText('expert')).toBeInTheDocument()
  })
})
