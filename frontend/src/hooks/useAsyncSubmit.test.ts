import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAsyncSubmit } from './useAsyncSubmit'

describe('useAsyncSubmit', () => {
  it('sets loading true while running and false after success', async () => {
    const fn = vi.fn(() => Promise.resolve('success'))
    const { result } = renderHook(() => useAsyncSubmit(fn))

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()

    let promise: Promise<string | undefined>
    act(() => {
      promise = result.current.run()
    })

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('captures error on rejection', async () => {
    const fn = vi.fn(() => Promise.reject(new Error('Something went wrong')))
    const { result } = renderHook(() => useAsyncSubmit(fn))

    act(() => {
      result.current.run()
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Something went wrong')
  })

  it('captures string error on rejection', async () => {
    const fn = vi.fn(() => Promise.reject('String error'))
    const { result } = renderHook(() => useAsyncSubmit(fn))

    act(() => {
      result.current.run()
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('String error')
  })

  it('resets error and loading state', async () => {
    const fn = vi.fn(() => Promise.reject(new Error('fail')))
    const { result } = renderHook(() => useAsyncSubmit(fn))

    act(() => {
      result.current.run()
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('fail')

    act(() => {
      result.current.reset()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('passes arguments through to the wrapped function', async () => {
    const fn = vi.fn((a: number, b: string) => Promise.resolve(`${a}-${b}`))
    const { result } = renderHook(() => useAsyncSubmit(fn))

    act(() => {
      result.current.run(42, 'test')
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fn).toHaveBeenCalledWith(42, 'test')
  })
})
