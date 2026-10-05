import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchArchivedCourses, unarchiveCourse, type UserCourse } from '../../../api/myCourses'
import {
  formatOfficialCourseLabel,
  resolveUserCourseTitle,
  shouldShowUserCourseParentHint,
} from '../utils/userCourseDisplay'

export function ArchivedCoursesPage() {
  const [courses, setCourses] = useState<UserCourse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<number | null>(null)

  useEffect(() => {
    fetchArchivedCourses()
      .then(setCourses)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load archived courses'))
      .finally(() => setLoading(false))
  }, [])

  async function handleRestore(userCourseId: number) {
    setRestoringId(userCourseId)
    try {
      await unarchiveCourse(userCourseId)
      setCourses((current) => current.filter((course) => course.id !== userCourseId))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to restore course')
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-white">Archived Courses</h1>
      <p className="mt-1 text-slate-400">Restore a course to return it to My Courses.</p>

      {loading ? <p className="mt-8 text-slate-400">Loading...</p> : null}
      {error ? <p className="mt-8 text-rose-300">{error}</p> : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <article key={course.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-wide text-sky-300">
              {course.courseCode ?? 'Course'} · Semester {course.semesterNumber}
            </p>
            <h2 className="mt-2 text-lg font-medium text-white">{resolveUserCourseTitle(course)}</h2>
            {shouldShowUserCourseParentHint(course, courses) ? (
              <p className="mt-1 text-xs text-slate-500">
                Based on {formatOfficialCourseLabel(course)}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={`/workspace/${course.id}`}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
              >
                Open
              </Link>
              <button
                type="button"
                disabled={restoringId === course.id}
                onClick={() => void handleRestore(course.id)}
                className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50"
              >
                {restoringId === course.id ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          </article>
        ))}
        {!loading && !error && courses.length === 0 ? (
          <p className="text-slate-400">No archived courses.</p>
        ) : null}
      </section>
    </main>
  )
}
