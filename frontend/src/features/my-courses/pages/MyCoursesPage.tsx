import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  archiveCourse,
  fetchMyCourses,
  updateUserCourseName,
  type UserCourse,
} from '../../../api/myCourses'
import { UserCourseNameDialog } from '../components/UserCourseNameDialog'
import {
  formatOfficialCourseLabel,
  resolveUserCourseTitle,
  shouldShowUserCourseParentHint,
} from '../utils/userCourseDisplay'

export function MyCoursesPage() {
  const [courses, setCourses] = useState<UserCourse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [archivingId, setArchivingId] = useState<number | null>(null)
  const [renamingCourse, setRenamingCourse] = useState<UserCourse | null>(null)
  const [renameBusy, setRenameBusy] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)

  useEffect(() => {
    fetchMyCourses()
      .then(setCourses)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  async function handleArchive(userCourseId: number) {
    setArchivingId(userCourseId)
    try {
      await archiveCourse(userCourseId)
      setCourses((current) => current.filter((course) => course.id !== userCourseId))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to archive course')
    } finally {
      setArchivingId(null)
    }
  }

  async function handleRenameConfirm(name: string) {
    if (!renamingCourse) return
    setRenameBusy(true)
    setRenameError(null)
    try {
      const updated = await updateUserCourseName(renamingCourse.id, name)
      setCourses((current) => current.map((course) => (course.id === updated.id ? updated : course)))
      setRenamingCourse(null)
    } catch (err: unknown) {
      setRenameError(err instanceof Error ? err.message : 'Failed to rename course')
    } finally {
      setRenameBusy(false)
    }
  }

  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">My Courses</h1>
            <p className="mt-1 text-slate-400">
              Open a course, rename your workspace, or archive it when you are finished.
            </p>
          </div>
          <Link
            to="/add-course"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            + Add course
          </Link>
        </div>

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
                  className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
                >
                  Open course
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setRenameError(null)
                    setRenamingCourse(course)
                  }}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Rename
                </button>
                <button
                  type="button"
                  disabled={archivingId === course.id}
                  onClick={() => void handleArchive(course.id)}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                >
                  {archivingId === course.id ? 'Archiving...' : 'Archive'}
                </button>
              </div>
            </article>
          ))}
          {!loading && !error && courses.length === 0 ? (
            <p className="text-slate-400">
              No courses yet.{' '}
              <Link className="text-sky-300 hover:text-sky-200" to="/">
                Browse official courses
              </Link>{' '}
              and use <span className="text-slate-300">Add to My Courses</span> from review, or{' '}
              <Link className="text-sky-300 hover:text-sky-200" to="/add-course">
                add a course manually
              </Link>
              .
            </p>
          ) : null}
        </section>
      </main>

      {renamingCourse ? (
        <UserCourseNameDialog
          open
          title="Rename workspace"
          description="Choose a name for this workspace. Leave the official course name or pick your own label."
          officialCourseName={renamingCourse.courseName}
          officialCourseCode={renamingCourse.courseCode}
          semesterNumber={renamingCourse.semesterNumber}
          initialName={resolveUserCourseTitle(renamingCourse)}
          confirmLabel="Save name"
          busy={renameBusy}
          error={renameError}
          onConfirm={(name) => void handleRenameConfirm(name)}
          onCancel={() => {
            if (!renameBusy) {
              setRenamingCourse(null)
              setRenameError(null)
            }
          }}
        />
      ) : null}
    </>
  )
}
