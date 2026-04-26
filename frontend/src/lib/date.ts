/**
 * Date formatting utilities — centralized to avoid duplication and UTC bugs.
 * All functions use consistent timezone handling.
 */

const UKRAINIAN_LOCALE = 'uk-UA'

export function formatDate(
  iso: string | Date,
  opts?: { utc?: boolean },
): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleDateString(UKRAINIAN_LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: opts?.utc ? 'UTC' : undefined,
  })
}

export function formatDateTime(
  iso: string | Date,
  opts?: { utc?: boolean; longMonth?: boolean },
): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleString(UKRAINIAN_LOCALE, {
    day: 'numeric',
    month: opts?.longMonth ? 'long' : 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: opts?.utc ? 'UTC' : undefined,
  })
}

export function formatDateFull(
  iso: string | Date,
  opts?: { utc?: boolean },
): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleDateString(UKRAINIAN_LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: opts?.utc ? 'UTC' : undefined,
  })
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}
