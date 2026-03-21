import { useNavigate } from 'react-router'
import { useSession, signOut } from '../lib/auth-client'

export default function Dashboard() {
  const { data: session } = useSession()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center px-4">
      <div className="text-center text-white">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand">
            <iconify-icon icon="solar:crown-linear" width="22" height="22"></iconify-icon>
          </div>
          <span className="font-bold tracking-tight text-xl uppercase font-heading">YesChess</span>
        </div>

        <h1 className="text-3xl font-bold mb-2 font-heading">Дашборд</h1>
        <p className="text-blue-200 mb-2">Вітаємо, <strong className="text-white">{session?.user.name}</strong>!</p>
        <p className="text-blue-200/60 text-sm mb-8">{session?.user.email}</p>

        <button
          onClick={handleSignOut}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Вийти
        </button>
      </div>
    </div>
  )
}
