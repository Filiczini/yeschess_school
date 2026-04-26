import { useState, useCallback } from 'react'

export interface UseAsyncSubmitResult<T, A extends unknown[]> {
  run: (...args: A) => Promise<T | undefined>
  loading: boolean
  error: string | null
  reset: () => void
}

export function useAsyncSubmit<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>,
): UseAsyncSubmitResult<T, A> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (...args: A): Promise<T | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const result = await fn(...args)
        return result
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
      } finally {
        setLoading(false)
      }
    },
    [fn],
  )

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return { run, loading, error, reset }
}
