import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProgramme, type CourseSummary } from '../../../api/publicLibrary'

interface ProgrammePageProps {
  programmeId: number
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

const PREVIEW_DISMISS_KEY = 'study-platform:programme-loading-preview-dismissed'
const PREVIEW_NOTE = 'Preview: programme page waits for courses to load — tell us if you want to keep this'

export function ProgrammePage({ programmeId }: ProgrammePageProps) {
  const [programmeName, setProgrammeName] = useState('')
  const [programmeCode, setProgrammeCode] = useState('')
  const [streamName, setStreamName] = useState<string | null>(null)
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [selectedSemester, setSelectedSemester] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewDismissed, setPreviewDismissed] = useState(
    () => localStorage.getItem(PREVIEW_DISMISS_KEY) === '1',
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setCourses([])
    setProgrammeName('')
    setProgrammeCode('')
    setStreamName(null)

    fetchProgramme(programmeId)
      .then((programme) => {
        if (cancelled) return
        setProgrammeName(programme.name)
        setProgrammeCode(programme.code)
        setStreamName(programme.streamName)
        setCourses(programme.courses)
        const firstSemester = programme.courses[0]?.semesterNumber ?? 1
        setSelectedSemester(firstSemester)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load programme')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [programmeId])

  const availableSemesters = useMemo(
    () => new Set(courses.map((course) => course.semesterNumber)),
    [courses],
  )

  const visibleCourses = courses.filter((course) => course.semesterNumber === selectedSemester)

  function dismissPreview() {
    localStorage.setItem(PREVIEW_DISMISS_KEY, '1')
    setPreviewDismissed(true)
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      {!previewDismissed ? (
        <div className="mb-6 flex items-start justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p>{PREVIEW_NOTE}</p>
          <button
            type="button"
            onClick={dismissPreview}
            className="shrink-0 rounded-md border border-amber-500/30 px-2 py-1 text-xs text-amber-200 hover:bg-amber-500/20"
          >
            Got it
          </button>
        </div>
      ) : null}

      <Link to="/" className="text-sm text-sky-300 hover:text-sky-200">
        ← Home
      </Link>

      <p className="mt-6 text-sm uppercase tracking-[0.2em] text-sky-300">
        {programmeCode || (loading ? 'Loading…' : 'Programme')}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-white">
        {programmeName || (loading ? 'Loading programme…' : 'Programme')}
      </h1>
      {streamName ? <p className="mt-2 text-sm text-slate-400">Stream: {streamName}</p> : null}

      {error ? <p className="mt-6 text-rose-300">{error}</p> : null}

      <div className="mt-8 flex flex-wrap gap-2">
        {SEMESTERS.map((semester) => (
          <button
            key={semester}
            type="button"
            onClick={() => setSelectedSemester(semester)}
            disabled={loading || !availableSemesters.has(semester)}
            title={
              loading
                ? 'Loading courses…'
                : availableSemesters.has(semester)
                  ? `Semester ${semester}`
                  : 'No courses published for this semester yet'
            }
            className={`h-10 w-10 rounded-lg text-sm font-medium ${
              selectedSemester === semester
                ? 'bg-sky-500 text-slate-950'
                : availableSemesters.has(semester)
                  ? 'border border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'border border-slate-800 text-slate-600'
            } ${loading ? 'opacity-50' : ''}`}
          >
            {semester}
          </button>
        ))}
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {loading ? (
          <p className="text-slate-400">Loading courses…</p>
        ) : null}
        {!loading
          ? visibleCourses.map((course) => (
              <article key={course.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">{course.code ?? 'Course'}</p>
                <h2 className="mt-2 text-lg font-medium text-white">{course.name}</h2>
                {course.publicMaterialCount != null ? (
                  <p className="mt-2 text-xs text-slate-400">
                    {course.publicMaterialCount} public material{course.publicMaterialCount === 1 ? '' : 's'}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">Past papers with solutions side by side</p>
                <Link
                  to={`/courses/${course.id}/review`}
                  className="mt-4 inline-block rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400"
                >
                  Open course
                </Link>
              </article>
            ))
          : null}
        {!loading && !error && visibleCourses.length === 0 ? (
          <p className="text-slate-400">No published courses for this semester yet.</p>
        ) : null}
      </section>
    </main>
  )
}
