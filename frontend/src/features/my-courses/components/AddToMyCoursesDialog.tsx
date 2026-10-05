import { useEffect, useState } from 'react'
import type { UserCourse } from '../../../api/myCourses'
import { formatOfficialCourseLabel, resolveUserCourseTitle } from '../utils/userCourseDisplay'

type DialogStep = 'exists' | 'name'

export function AddToMyCoursesDialog({
  open,
  officialCourseName,
  officialCourseCode,
  semesterNumber,
  existingCourses,
  busy = false,
  error,
  onOpenExisting,
  onCreateAnother,
  onClose,
}: {
  open: boolean
  officialCourseName: string
  officialCourseCode?: string | null
  semesterNumber: number
  existingCourses: UserCourse[]
  busy?: boolean
  error?: string | null
  onOpenExisting: (userCourseId: number) => void
  onCreateAnother: (name: string) => void
  onClose: () => void
}) {
  const [step, setStep] = useState<DialogStep>('exists')
  const [name, setName] = useState(officialCourseName)

  useEffect(() => {
    if (open) {
      setStep('exists')
      setName(officialCourseName)
    }
  }, [open, officialCourseName])

  if (!open) return null

  const parentLabel = formatOfficialCourseLabel({
    courseName: officialCourseName,
    courseCode: officialCourseCode ?? null,
    semesterNumber,
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={busy ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-my-courses-dialog-title"
        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {step === 'exists' ? (
          <>
            <h2 id="add-to-my-courses-dialog-title" className="text-base font-medium text-white">
              Already in My Courses
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              You already have {existingCourses.length === 1 ? 'a workspace' : 'workspaces'} for{' '}
              <span className="text-white">{officialCourseName}</span>. Open it, or create another
              independent copy with its own materials.
            </p>
            <ul className="mt-4 space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              {existingCourses.map((course) => (
                <li key={course.id} className="text-sm text-slate-200">
                  {resolveUserCourseTitle(course)}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">Official course · {parentLabel}</p>
            {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || existingCourses.length === 0}
                onClick={() => onOpenExisting(existingCourses[0]!.id)}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                Open existing
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setName(officialCourseName)
                  setStep('name')
                }}
                className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50"
              >
                Add another
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="add-to-my-courses-dialog-title" className="text-base font-medium text-white">
              Name your new workspace
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Pick a name so you can tell this copy apart from your existing one.
            </p>
            <label className="mt-4 block text-sm text-slate-300">
              Workspace name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={officialCourseName}
                maxLength={255}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">Based on {parentLabel}</p>
            {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep('exists')}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onCreateAnother(name.trim() || officialCourseName)}
                className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50"
              >
                {busy ? 'Creating…' : 'Create workspace'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
