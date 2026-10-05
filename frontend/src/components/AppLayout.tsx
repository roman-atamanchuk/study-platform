import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const navLinkClass = (active: boolean) =>
  active
    ? 'rounded-lg bg-sky-500/20 px-3 py-2 text-sm font-medium text-sky-300'
    : 'rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const signOut = useAuthStore((state) => state.signOut)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const path = location.pathname

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="text-lg font-semibold text-white">
            Study Workspace
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <Link to="/" className={navLinkClass(path === '/')}>
              Home
            </Link>
            <Link
              to="/my-courses"
              className={navLinkClass(path.startsWith('/my-courses') && !path.includes('/archived'))}
            >
              My Courses
            </Link>
            <Link to="/shared-courses" className={navLinkClass(path.startsWith('/shared-courses'))}>
              Shared
            </Link>
            <Link to="/my-courses/archived" className={navLinkClass(path.startsWith('/my-courses/archived'))}>
              Archived
            </Link>
            <Link to="/settings" className={navLinkClass(path.startsWith('/settings'))}>
              Settings
            </Link>
            {user?.role === 'ADMIN' ? (
              <Link to="/admin" className={navLinkClass(path.startsWith('/admin'))}>
                Admin
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
