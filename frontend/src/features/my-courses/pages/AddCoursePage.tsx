import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProgrammes, type ProgrammeSummary } from '../../../api/publicLibrary'

export function AddCoursePage() {
  const [programmes, setProgrammes] = useState<ProgrammeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProgrammes()
      .then(setProgrammes)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/my-courses" className="text-sm text-sky-300 hover:text-sky-200">
        ← My Courses
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Add a course</h1>
      <p className="mt-2 text-slate-400">Pick a programme, then choose a course to open in your workspace.</p>

      {loading ? <p className="mt-6 text-slate-400">Loading...</p> : null}
      {error ? <p className="mt-6 text-rose-300">{error}</p> : null}

      <div className="mt-6 grid gap-3">
        {programmes.map((programme) => (
          <Link
            key={programme.id}
            to={`/programmes/${programme.id}`}
            className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-4 hover:border-sky-500/40"
          >
            <p className="text-xs uppercase tracking-wide text-sky-300">{programme.code}</p>
            <h2 className="mt-1 text-lg font-medium text-white">{programme.name}</h2>
          </Link>
        ))}
      </div>
    </main>
  )
}
