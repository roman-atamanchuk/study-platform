import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProgrammes, type ProgrammeSummary } from '../../../api/publicLibrary'
import { useAuthModalStore } from '../../../stores/authModalStore'
import { useAuthStore } from '../../../stores/authStore'

export function HomePage() {
  const [programmes, setProgrammes] = useState<ProgrammeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const openLogin = useAuthModalStore((state) => state.openLogin)
  const authStatus = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    fetchProgrammes()
      .then(setProgrammes)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load programmes'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Study Workspace</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">Find course materials faster</h1>
      <p className="mt-4 text-lg text-slate-300">
        Select your programme to browse official courses, compare exam papers and solutions side by side,
        and build your personal study library when you are ready.
      </p>

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Select programme</h2>
        {loading ? <p className="mt-4 text-slate-400">Loading programmes...</p> : null}
        {error ? <p className="mt-4 text-rose-300">{error}</p> : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {programmes.map((programme) => (
            <Link
              key={programme.id}
              to={`/programmes/${programme.id}`}
              className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-4 hover:border-sky-500/40"
            >
              <p className="text-xs uppercase tracking-wide text-sky-300">{programme.code}</p>
              <h3 className="mt-1 text-lg font-medium text-white">{programme.name}</h3>
              {programme.streamName ? (
                <p className="mt-1 text-sm text-slate-400">Stream: {programme.streamName}</p>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      {authStatus === 'authenticated' ? (
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/my-courses"
            className="rounded-lg bg-sky-500 px-5 py-2.5 font-medium text-slate-950 hover:bg-sky-400"
          >
            My Courses
          </Link>
          {user?.role === 'ADMIN' ? (
            <Link
              to="/admin"
              className="rounded-lg border border-slate-700 px-5 py-2.5 font-medium text-slate-200 hover:bg-slate-800"
            >
              Admin
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => openLogin()}
            className="rounded-lg bg-sky-500 px-5 py-2.5 font-medium text-slate-950 hover:bg-sky-400"
          >
            Login
          </button>
          <Link
            to="/register"
            className="rounded-lg border border-slate-700 px-5 py-2.5 font-medium text-slate-200 hover:bg-slate-800"
          >
            Register
          </Link>
        </div>
      )}
    </main>
  )
}
