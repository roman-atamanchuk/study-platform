import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthModalStore } from '../stores/authModalStore'
import { useAuthStore } from '../stores/authStore'

const navLinkClass = (active: boolean) =>
  active
    ? 'rounded-lg bg-sky-500/20 px-3 py-2 text-sm font-medium text-sky-300'
    : 'rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white'

export function PublicLayout() {
  const location = useLocation()
  const authStatus = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const openLogin = useAuthModalStore((state) => state.openLogin)

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="text-lg font-semibold text-white">
            Study Workspace
          </Link>
          <p className="hidden text-sm text-slate-500 md:block">
            Browse official courses · Compare materials side by side
          </p>
          <nav className="flex flex-wrap items-center gap-1">
            {authStatus === 'authenticated' ? (
              <>
                <Link to="/" className={navLinkClass(location.pathname === '/')}>
                  Home
                </Link>
                <Link to="/my-courses" className={navLinkClass(location.pathname.startsWith('/my-courses'))}>
                  My Courses
                </Link>
                <Link to="/settings" className={navLinkClass(location.pathname.startsWith('/settings'))}>
                  Settings
                </Link>
                {user?.role === 'ADMIN' ? (
                  <Link to="/admin" className={navLinkClass(location.pathname.startsWith('/admin'))}>
                    Admin
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => void useAuthStore.getState().signOut()}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openLogin()}
                  className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Login
                </button>
                <Link
                  to="/register"
                  className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
