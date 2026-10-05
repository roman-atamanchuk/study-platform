import { useAuthStore } from '../stores/authStore'
import { HomePage } from '../features/home/pages/HomePage'

export function HomeRoute() {
  const status = useAuthStore((state) => state.status)

  if (status === 'idle' || status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading...
      </main>
    )
  }

  return <HomePage />
}
