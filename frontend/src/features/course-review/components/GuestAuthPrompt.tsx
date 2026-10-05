import { Link } from 'react-router-dom'
import { useAuthModalStore } from '../../../stores/authModalStore'

export function GuestAuthPrompt({ message }: { message?: string }) {
  const openLogin = useAuthModalStore((state) => state.openLogin)

  return (
    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4">
      <p className="text-sm text-amber-100">
        {message ?? 'Please login or register first.'}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openLogin()}
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
        >
          Login
        </button>
        <Link
          to="/register"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800"
        >
          Register
        </Link>
      </div>
    </div>
  )
}
