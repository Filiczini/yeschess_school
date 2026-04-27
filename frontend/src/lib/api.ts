const API_BASE = import.meta.env.VITE_API_URL ?? ''

function buildUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = buildUrl(path)
  const headers: Record<string, string> = {}
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const data = (await res.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }
  return (await res.json()) as T
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  return apiRequest<T>('GET', path)
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>('POST', path, body)
}

export async function apiPatch<T = unknown>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>('PATCH', path, body)
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  return apiRequest<T>('DELETE', path)
}
