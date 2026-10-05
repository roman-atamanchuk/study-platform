import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'

export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === 'idle' || status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading session...
      </main>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
