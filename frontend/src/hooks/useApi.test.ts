import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useApi, apiGet, apiPost, apiPatch, apiDelete } from './useApi'

describe('useApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in loading state and resolves with data', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ message: 'hello' }),
    } as Response))

    const { result } = renderHook(() => useApi('/api/test'))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual({ message: 'hello' })
    expect(result.current.error).toBeNull()
  })

  it('sets error on failed request', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Server down' }),
    } as Response))

    const { result } = renderHook(() => useApi('/api/test'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toContain('Server down')
    expect(result.current.data).toBeNull()
  })

  it('does not fetch when path is null', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({}),
    } as Response))

    const { result } = renderHook(() => useApi(null))

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('refetch triggers a new request', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ count: 1 }),
    } as Response))

    const { result } = renderHook(() => useApi('/api/test'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    result.current.refetch()

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    })
  })

  it('normalizes array response when option set', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ notAnArray: true }),
    } as Response))

    const { result } = renderHook(() => useApi('/api/test', { normalizeArray: true }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(Array.isArray(result.current.data)).toBe(true)
    expect(result.current.data).toEqual([])
  })
})

describe('apiRequest helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('apiGet sends GET request', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ id: '1' }),
    } as Response))

    const data = await apiGet('/api/item')
    expect(data).toEqual({ id: '1' })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/item',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    )
  })

  it('apiPost sends POST with body', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ created: true }),
    } as Response))

    const body = { name: 'Test' }
    await apiPost('/api/item', body)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/item',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    )
  })

  it('throws on non-ok response', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Not found' }),
    } as Response))

    await expect(apiGet('/api/missing')).rejects.toThrow('Not found')
  })
})
