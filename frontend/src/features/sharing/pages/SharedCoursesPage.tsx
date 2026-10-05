import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSharedCourses, type SharedCourse } from '../../../api/sharing'

export function SharedCoursesPage() {
  const [courses, setCourses] = useState<SharedCourse[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSharedCourses()
      .then(setCourses)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load shared courses')
      })
  }, [])

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-white">Shared Courses</h1>
      <p className="mt-2 text-slate-400">Open shared course versions in read-only mode.</p>

      {error ? <p className="mt-6 text-rose-300">{error}</p> : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <article key={course.sharedAccessId} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-wide text-sky-300">{course.courseCode ?? 'Course'}</p>
            <h2 className="mt-2 text-lg font-medium text-white">{course.courseName}</h2>
            <p className="mt-1 text-sm text-slate-400">Shared by {course.ownerName}</p>
            <Link
              to={`/workspace/${course.userCourseId}`}
              className="mt-4 inline-block rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950"
            >
              Open read-only workspace
            </Link>
          </article>
        ))}
        {!error && courses.length === 0 ? (
          <p className="text-slate-500">No shared courses yet. Accept an invite link to see courses here.</p>
        ) : null}
      </section>
    </main>
  )
}
