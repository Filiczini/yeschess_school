import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import OnboardingSteps from './OnboardingSteps'

describe('OnboardingSteps', () => {
  it('returns null when profile exists', () => {
    const { container } = render(
      <MemoryRouter>
        <OnboardingSteps hasProfile={true} hasCoach={false} />
      </MemoryRouter>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('returns null when coach is assigned', () => {
    const { container } = render(
      <MemoryRouter>
        <OnboardingSteps hasProfile={false} hasCoach={true} />
      </MemoryRouter>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders steps when neither profile nor coach', () => {
    render(
      <MemoryRouter>
        <OnboardingSteps hasProfile={false} hasCoach={false} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Як почати навчання')).toBeInTheDocument()
    expect(screen.getByText('Заповни свій профіль')).toBeInTheDocument()
    expect(screen.getByText('Дочекайся призначення тренера')).toBeInTheDocument()
    expect(screen.getByText('Запишись на перше заняття')).toBeInTheDocument()
    expect(screen.getByText('Заповнити →')).toBeInTheDocument()
  })
})
