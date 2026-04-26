import { signOut } from '../lib/auth-client'

type SignOutButtonProps = {
  variant?: 'dark' | 'light'
  className?: string
}

export default function SignOutButton({ variant = 'dark', className }: SignOutButtonProps) {
  async function handleSignOut() {
    await signOut()
    window.location.href = '/'
  }

  const base =
    variant === 'dark'
      ? 'w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm font-medium transition-colors'
      : 'w-full py-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors'

  return (
    <button onClick={handleSignOut} className={`${base} ${className ?? ''}`}>
      Вийти
    </button>
  )
}
