import { auth } from '../auth.js'

export async function getSession(req: { headers: Record<string, string | string[] | undefined> }) {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value[0] : value)
  }
  return auth.api.getSession({ headers })
}

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>
