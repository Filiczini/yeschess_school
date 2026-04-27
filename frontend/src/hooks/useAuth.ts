import { useState, useEffect } from 'react'

interface UserMe {
  role: string
  status: string
}

export function useAuth() {
  const [role, setRole] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: UserMe) => {
        setRole(d.role)
        setStatus(d.status)
      })
      .catch(() => {
        // ignore
      })
  }, [])

  const isAdmin = role === 'admin' || role === 'super_admin'
  const isSuperAdmin = role === 'super_admin'
  const isPending = status === 'pending'

  return { isAdmin, isSuperAdmin, isPending, role }
}
