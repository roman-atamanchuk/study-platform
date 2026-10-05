import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'

export function GuestRoute() {
  const status = useAuthStore((state) => state.status)

  if (status === 'idle' || status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading session...
      </main>
    )
  }

  if (status === 'authenticated') {
    return <Navigate to="/my-courses" replace />
  }

  return <Outlet />
}
