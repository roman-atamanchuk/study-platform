import { useEffect, useState } from 'react'
import { formatOfficialCourseLabel } from '../utils/userCourseDisplay'

export function UserCourseNameDialog({
  open,
  title,
  description,
  officialCourseName,
  officialCourseCode,
  semesterNumber,
  initialName,
  confirmLabel,
  busy = false,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: string
  officialCourseName: string
  officialCourseCode?: string | null
  semesterNumber?: number
  initialName: string
  confirmLabel: string
  busy?: boolean
  error?: string | null
  onConfirm: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName)

  useEffect(() => {
    if (open) {
      setName(initialName)
    }
  }, [open, initialName])

  if (!open) return null

  const parentLabel = formatOfficialCourseLabel({
    courseName: officialCourseName,
    courseCode: officialCourseCode ?? null,
    semesterNumber: semesterNumber ?? 0,
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={busy ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-course-name-dialog-title"
        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="user-course-name-dialog-title" className="text-base font-medium text-white">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm text-slate-300">{description}</p> : null}
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
            onClick={onCancel}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onConfirm(name.trim() || officialCourseName)}
            className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50"
          >
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
