import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router'
import { useSession, signOut } from '../lib/auth-client'

const NAV_ITEMS = [
  { path: '/admin/users', label: 'Всі користувачі', icon: 'solar:users-group-rounded-linear' },
  { path: '/admin/enrollments', label: 'Призначення учнів', icon: 'solar:user-plus-linear' },
  { path: '/admin/approvals', label: 'Заявки на розгляді', icon: 'solar:hourglass-linear', badge: true },
]

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Огляд платформи',
  '/admin/users': 'Всі користувачі',
  '/admin/enrollments': 'Призначення учнів',
  '/admin/approvals': 'Заявки на розгляді',
}

export default function AdminLayout() {
  const { data: session } = useSession()
  const location = useLocation()
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setPendingCount(d.pendingCount))
      .catch(() => {})
  }, [location.pathname])

  const title = PAGE_TITLES[location.pathname] ?? 'Адмінпанель'

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  async function handleSignOut() {
    await signOut()
    window.location.href = '/'
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FC] text-gray-900 antialiased" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-gray-200 h-full flex flex-col shrink-0 z-20">

        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-light rounded flex items-center justify-center shadow-sm">
              <iconify-icon icon="solar:crown-linear" width="16" height="16" style={{ color: 'white' }}></iconify-icon>
            </div>
            <span className="font-heading text-lg font-medium tracking-tight text-gray-900">YESCHESS</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="px-3 pb-2 pt-1 text-xs font-medium text-gray-400 uppercase tracking-widest">
            Меню
          </div>

          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors border group ${
                  active
                    ? 'bg-[#F0EEFA] text-brand-light border-brand-light/20'
                    : 'text-gray-500 hover:bg-[#F0EEFA]/60 hover:text-brand-light border-transparent'
                }`}
              >
                <iconify-icon
                  icon={item.icon}
                  width="20"
                  height="20"
                  style={{ color: active ? 'var(--color-brand-light)' : undefined }}
                  className={active ? '' : 'text-gray-400 group-hover:text-brand-light transition-colors'}
                ></iconify-icon>
                <span className="flex-1">{item.label}</span>
                {item.badge && pendingCount != null && pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#F0EEFA] text-brand-light text-[11px] font-medium min-w-[20px]">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User profile */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <div className="flex items-center justify-between p-2 -m-2 rounded-md hover:bg-[#F0EEFA]/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-light to-brand shadow-sm text-white flex items-center justify-center text-xs font-medium">
                {initials}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium text-gray-900 leading-tight">{session?.user?.name ?? '...'}</span>
                <span className="text-xs text-gray-500">Адмін</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Вийти"
              className="text-gray-400 group-hover:text-brand-light transition-colors cursor-pointer"
            >
              <iconify-icon icon="solar:logout-2-linear" width="18" height="18"></iconify-icon>
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 overflow-y-auto relative">

        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 px-10 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="font-heading text-xl font-medium tracking-tight text-gray-900">{title}</h1>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-green-700 bg-green-50 border border-green-200/60">
              <iconify-icon icon="solar:pulse-linear" width="14" height="14" className="mr-1.5"></iconify-icon>
              Система онлайн
            </span>
          </div>
        </header>

        {/* Page content */}
        <Outlet />
      </main>
    </div>
  )
}
