import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  createCourse,
  createProgramme,
  deleteCourse,
  deleteProgramme,
  fetchAdminCourses,
  fetchAdminProgrammes,
  updateCourse,
  updateProgramme,
  uploadOfficialMaterial,
  addOfficialVideo,
  fetchAdminCourseMaterials,
  type CourseDetailResponse,
} from '../../../api/admin'
import type { MaterialType, Material, MaterialVisibility } from '../../../api/materials'
import type { ProgrammeSummary } from '../../../api/publicLibrary'
import { AdminSubNav } from '../components/AdminSubNav'
import { AdminMaterialList } from '../components/AdminMaterialList'
import { MaterialFileDropzone } from '../../../components/MaterialFileDropzone'
import { MaterialVisibilitySelect } from '../../../components/MaterialVisibilitySelect'
import { ConfirmDialog } from '../../workspace/components/StudyWorkspace'
import { parseYoutubeVideoId } from '../../../utils/youtube'

type CatalogTab = 'programmes' | 'courses' | 'materials'

type PendingCatalogConfirm =
  | { type: 'delete-programme'; programme: ProgrammeSummary }
  | { type: 'hide-course'; course: CourseDetailResponse }
  | { type: 'delete-course'; course: CourseDetailResponse }

const statusLabel: Record<string, string> = {
  PUBLISHED: 'Published',
  HIDDEN: 'Hidden',
  ARCHIVED: 'Archived',
}

const statusClass: Record<string, string> = {
  PUBLISHED: 'bg-emerald-500/15 text-emerald-300',
  HIDDEN: 'bg-amber-500/15 text-amber-300',
  ARCHIVED: 'bg-slate-700 text-slate-300',
}

export function AdminCatalogPage() {
  const location = useLocation()
  const initialTab = (location.state as { tab?: CatalogTab } | null)?.tab
  const [tab, setTab] = useState<CatalogTab>(initialTab ?? 'programmes')
  const [programmes, setProgrammes] = useState<ProgrammeSummary[]>([])
  const [courses, setCourses] = useState<CourseDetailResponse[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<PendingCatalogConfirm | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const [programmeCode, setProgrammeCode] = useState('')
  const [programmeName, setProgrammeName] = useState('')
  const [programmeStream, setProgrammeStream] = useState('')
  const [editingProgrammeId, setEditingProgrammeId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editStream, setEditStream] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const [courseProgrammeId, setCourseProgrammeId] = useState<number | ''>('')
  const [courseSemester, setCourseSemester] = useState(1)
  const [courseName, setCourseName] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null)
  const [editCourseProgrammeId, setEditCourseProgrammeId] = useState<number | ''>('')
  const [editCourseSemester, setEditCourseSemester] = useState(1)
  const [editCourseName, setEditCourseName] = useState('')
  const [editCourseCode, setEditCourseCode] = useState('')
  const [editCourseStatus, setEditCourseStatus] = useState<'PUBLISHED' | 'HIDDEN' | 'ARCHIVED'>('PUBLISHED')

  const [materialTitle, setMaterialTitle] = useState('')
  const [materialType, setMaterialType] = useState<MaterialType>('EXAM_PAPER')
  const [solutionExamMaterialId, setSolutionExamMaterialId] = useState<number | null>(null)
  const [courseExamPapers, setCourseExamPapers] = useState<Material[]>([])
  const [materialFiles, setMaterialFiles] = useState<File[]>([])
  const [materialYoutubeUrl, setMaterialYoutubeUrl] = useState('')
  const [materialVisibility, setMaterialVisibility] = useState<MaterialVisibility>('PUBLIC')
  const [uploadingMaterials, setUploadingMaterials] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [materialsVersion, setMaterialsVersion] = useState(0)

  useEffect(() => {
    if (!selectedCourseId) {
      setCourseExamPapers([])
      setSolutionExamMaterialId(null)
      return
    }
    void fetchAdminCourseMaterials(selectedCourseId)
      .then((materials) => {
        setCourseExamPapers(materials.filter((material) => material.materialType === 'EXAM_PAPER'))
      })
      .catch(() => setCourseExamPapers([]))
  }, [selectedCourseId, materialsVersion])

  async function reload() {
    const [p, c] = await Promise.all([fetchAdminProgrammes(), fetchAdminCourses()])
    setProgrammes(p)
    setCourses(c)
    if (!selectedCourseId && c[0]) setSelectedCourseId(c[0].id)
  }

  useEffect(() => {
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [])

  function clearFeedback() {
    setError(null)
    setMessage(null)
  }

  function openCourseMaterials(courseId: number) {
    setTab('materials')
    setSelectedCourseId(courseId)
    clearFeedback()
  }

  function bumpMaterialsVersion() {
    setMaterialsVersion((value) => value + 1)
  }

  async function handleCreateProgramme(event: React.FormEvent) {
    event.preventDefault()
    clearFeedback()
    try {
      await createProgramme({
        code: programmeCode,
        name: programmeName,
        streamName: programmeStream.trim() || undefined,
      })
      setProgrammeCode('')
      setProgrammeName('')
      setProgrammeStream('')
      setMessage('Programme created')
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Create programme failed')
    }
  }

  function startEditProgramme(programme: ProgrammeSummary) {
    clearFeedback()
    setEditingProgrammeId(programme.id)
    setEditName(programme.name)
    setEditStream(programme.streamName ?? '')
    setEditDescription(programme.description ?? '')
  }

  function cancelEditProgramme() {
    setEditingProgrammeId(null)
    setEditName('')
    setEditStream('')
    setEditDescription('')
  }

  async function handleUpdateProgramme(event: React.FormEvent) {
    event.preventDefault()
    if (editingProgrammeId == null) return
    clearFeedback()
    try {
      await updateProgramme(editingProgrammeId, {
        name: editName.trim(),
        streamName: editStream.trim() || null,
        description: editDescription.trim() || null,
      })
      setMessage('Programme updated')
      cancelEditProgramme()
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update programme failed')
    }
  }

  function handleDeleteProgramme(programme: ProgrammeSummary) {
    setConfirmError(null)
    setPendingConfirm({ type: 'delete-programme', programme })
  }

  async function executePendingConfirm() {
    if (!pendingConfirm) return
    setConfirmBusy(true)
    setConfirmError(null)
    clearFeedback()
    try {
      if (pendingConfirm.type === 'delete-programme') {
        const programme = pendingConfirm.programme
        await deleteProgramme(programme.id)
        setMessage('Programme deleted')
        if (editingProgrammeId === programme.id) cancelEditProgramme()
      } else if (pendingConfirm.type === 'hide-course') {
        const course = pendingConfirm.course
        await updateCourse(course.id, { status: 'HIDDEN' })
        setMessage('Course hidden from catalog')
        if (editingCourseId === course.id) cancelEditCourse()
      } else {
        const course = pendingConfirm.course
        await deleteCourse(course.id)
        setMessage('Course deleted')
        if (editingCourseId === course.id) cancelEditCourse()
        if (selectedCourseId === course.id) setSelectedCourseId(null)
      }
      setPendingConfirm(null)
      await reload()
    } catch (err: unknown) {
      setConfirmError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setConfirmBusy(false)
    }
  }

  async function handleCreateCourse(event: React.FormEvent) {
    event.preventDefault()
    if (courseProgrammeId === '') return
    clearFeedback()
    try {
      await createCourse({
        programmeId: Number(courseProgrammeId),
        semesterNumber: courseSemester,
        name: courseName,
        code: courseCode || undefined,
      })
      setCourseName('')
      setCourseCode('')
      setMessage('Course created')
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Create course failed')
    }
  }

  function startEditCourse(course: CourseDetailResponse) {
    clearFeedback()
    setEditingCourseId(course.id)
    setEditCourseProgrammeId(course.programmeId)
    setEditCourseSemester(course.semesterNumber)
    setEditCourseName(course.name)
    setEditCourseCode(course.code ?? '')
    setEditCourseStatus(course.status as 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED')
  }

  function cancelEditCourse() {
    setEditingCourseId(null)
  }

  async function handleUpdateCourse(event: React.FormEvent) {
    event.preventDefault()
    if (editingCourseId == null || editCourseProgrammeId === '') return
    clearFeedback()
    try {
      await updateCourse(editingCourseId, {
        programmeId: Number(editCourseProgrammeId),
        semesterNumber: editCourseSemester,
        name: editCourseName.trim(),
        code: editCourseCode.trim() || null,
        status: editCourseStatus,
      })
      setMessage('Course updated')
      cancelEditCourse()
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update course failed')
    }
  }

  function handleHideCourse(course: CourseDetailResponse) {
    setConfirmError(null)
    setPendingConfirm({ type: 'hide-course', course })
  }

  function handleDeleteCourse(course: CourseDetailResponse) {
    setConfirmError(null)
    setPendingConfirm({ type: 'delete-course', course })
  }

  async function handleUploadMaterial(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedCourseId) return

    const isVideo = materialType === 'VIDEO'
    const youtubeVideoId = parseYoutubeVideoId(materialYoutubeUrl)

    if (isVideo) {
      if (!youtubeVideoId) {
        setError('Enter a valid YouTube link')
        return
      }
      if (!materialTitle.trim()) {
        setError('Title is required for YouTube videos')
        return
      }
    } else if (materialFiles.length === 0) {
      return
    }

    clearFeedback()
    setUploadingMaterials(true)
    setUploadProgress(null)
    try {
      const sharedTitle = materialTitle.trim() || undefined

      if (isVideo && youtubeVideoId) {
        setUploadProgress('Adding YouTube video…')
        await addOfficialVideo(selectedCourseId, {
          title: sharedTitle!,
          videoId: youtubeVideoId,
          visibility: materialVisibility,
        })
        setMaterialTitle('')
        setMaterialYoutubeUrl('')
        setUploadProgress(null)
        setMessage('Official YouTube video added')
        bumpMaterialsVersion()
        await reload()
        return
      }

      const count = materialFiles.length
      for (let index = 0; index < materialFiles.length; index += 1) {
        const file = materialFiles[index]
        setUploadProgress(`Uploading ${index + 1} of ${materialFiles.length}…`)
        const title = count === 1 ? sharedTitle : undefined
        await uploadOfficialMaterial(
          selectedCourseId,
          file,
          title,
          materialType,
          materialVisibility,
          undefined,
          materialType === 'SOLUTION' ? solutionExamMaterialId : null,
        )
      }
      setMaterialTitle('')
      setMaterialFiles([])
      setUploadProgress(null)
      setMessage(count === 1 ? 'Official material uploaded' : `${count} official materials uploaded`)
      bumpMaterialsVersion()
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingMaterials(false)
      setUploadProgress(null)
    }
  }

  const adminYoutubeVideoId = parseYoutubeVideoId(materialYoutubeUrl)
  const isVideoUpload = materialType === 'VIDEO'
  const canSubmitOfficialUpload =
    selectedCourseId != null &&
    (isVideoUpload
      ? adminYoutubeVideoId != null && materialTitle.trim().length > 0
      : materialFiles.length > 0 &&
        (materialType !== 'SOLUTION' || solutionExamMaterialId != null))

  const tabClass = (value: CatalogTab) =>
    tab === value
      ? 'rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950'
      : 'rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800'

  const confirmCopy =
    pendingConfirm?.type === 'delete-programme'
      ? {
          title: 'Delete programme?',
          message: `Delete "${pendingConfirm.programme.name}" (${pendingConfirm.programme.code})? Only works when it has no courses and no students linked to it.`,
          confirmLabel: 'Delete programme',
        }
      : pendingConfirm?.type === 'hide-course'
        ? {
            title: 'Hide course from catalog?',
            message: `Hide "${pendingConfirm.course.name}" from the public catalog? Students who already added it keep access. New students will not see it.`,
            confirmLabel: 'Hide course',
          }
        : pendingConfirm?.type === 'delete-course'
          ? {
              title: 'Delete course permanently?',
              message: `Permanently delete "${pendingConfirm.course.name}"? Only works when no students have added it and it has no official materials. Otherwise use Hide.`,
              confirmLabel: 'Delete course',
            }
          : null

  return (
    <>
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-white">Admin</h1>
      <AdminSubNav />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-white">Catalog management</h2>
          <p className="mt-1 text-sm text-slate-400">
            Use the tabs below to edit or delete programmes and courses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setTab('programmes')} className={tabClass('programmes')}>
            Programmes ({programmes.length})
          </button>
          <button type="button" onClick={() => setTab('courses')} className={tabClass('courses')}>
            Courses ({courses.length})
          </button>
          <button type="button" onClick={() => setTab('materials')} className={tabClass('materials')}>
            Materials
          </button>
        </div>
      </div>

      {message ? <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-300">{error}</p> : null}

      {tab === 'programmes' ? (
        <div className="mt-8 space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-lg font-medium text-white">Add programme</h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(e) => void handleCreateProgramme(e)}>
              <input value={programmeCode} onChange={(e) => setProgrammeCode(e.target.value)} placeholder="Code (e.g. BSC-CS)" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" required />
              <input value={programmeName} onChange={(e) => setProgrammeName(e.target.value)} placeholder="Name" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" required />
              <input value={programmeStream} onChange={(e) => setProgrammeStream(e.target.value)} placeholder="Stream (optional)" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white sm:col-span-2" />
              <button type="submit" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 sm:col-span-2 sm:w-fit">
                Create programme
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-lg font-medium text-white">All programmes</h3>
            <p className="mt-1 text-sm text-slate-400">
              Each row has Edit and Delete on the right. Programme code cannot be changed. Delete only works when there are no linked courses or students.
            </p>
            <ul className="mt-4 space-y-2">
              {programmes.length === 0 ? (
                <li className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                  No programmes yet — create one above.
                </li>
              ) : null}
              {programmes.map((programme) => (
                <li key={programme.id} className="rounded-lg border border-slate-800 px-3 py-3">
                  {editingProgrammeId === programme.id ? (
                    <form className="space-y-3" onSubmit={(e) => void handleUpdateProgramme(e)}>
                      <p className="text-xs uppercase tracking-wide text-sky-300">{programme.code}</p>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                        required
                      />
                      <input
                        value={editStream}
                        onChange={(e) => setEditStream(e.target.value)}
                        placeholder="Stream"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                        rows={2}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950">
                          Save changes
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditProgramme}
                          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-sky-300">{programme.code}</p>
                        <p className="font-medium text-white">{programme.name}</p>
                        {programme.streamName ? (
                          <p className="text-sm text-slate-400">Stream: {programme.streamName}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEditProgramme(programme)}
                          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteProgramme(programme)}
                          className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-300 hover:bg-rose-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {tab === 'courses' ? (
        <div className="mt-8 space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-lg font-medium text-white">Add course</h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(e) => void handleCreateCourse(e)}>
              <select value={courseProgrammeId} onChange={(e) => setCourseProgrammeId(Number(e.target.value))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white sm:col-span-2" required>
                <option value="">Select programme</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
              <input type="number" min={1} max={8} value={courseSemester} onChange={(e) => setCourseSemester(Number(e.target.value))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
              <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="Course code" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
              <input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="Course name" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white sm:col-span-2" required />
              <button type="submit" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 sm:col-span-2 sm:w-fit">
                Create course
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-lg font-medium text-white">All courses</h3>
            <p className="mt-1 text-sm text-slate-400">
              Edit updates name, semester, programme, or status. Hide removes a course from the public catalog. Delete permanently removes it only when no students or materials are linked.
            </p>
            <ul className="mt-4 space-y-2">
              {courses.length === 0 ? (
                <li className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                  No courses yet — create one above.
                </li>
              ) : null}
              {courses.map((course) => (
                <li key={course.id} className="rounded-lg border border-slate-800 px-3 py-3">
                  {editingCourseId === course.id ? (
                    <form className="space-y-3" onSubmit={(e) => void handleUpdateCourse(e)}>
                      <select
                        value={editCourseProgrammeId}
                        onChange={(e) => setEditCourseProgrammeId(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                        required
                      >
                        {programmes.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} — {p.name}
                          </option>
                        ))}
                      </select>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={editCourseSemester}
                          onChange={(e) => setEditCourseSemester(Number(e.target.value))}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                        />
                        <select
                          value={editCourseStatus}
                          onChange={(e) => setEditCourseStatus(e.target.value as 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED')}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                        >
                          <option value="PUBLISHED">Published (visible in catalog)</option>
                          <option value="HIDDEN">Hidden (not in catalog)</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      </div>
                      <input
                        value={editCourseName}
                        onChange={(e) => setEditCourseName(e.target.value)}
                        placeholder="Course name"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                        required
                      />
                      <input
                        value={editCourseCode}
                        onChange={(e) => setEditCourseCode(e.target.value)}
                        placeholder="Course code"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      />
                      <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                        <p className="text-sm font-medium text-white">
                          Official materials ({course.totalMaterialCount} total, {course.publicMaterialCount} public)
                        </p>
                        <div className="mt-3">
                          <AdminMaterialList
                            key={`${course.id}-${materialsVersion}`}
                            courseId={course.id}
                            compact
                            onChanged={() => {
                              bumpMaterialsVersion()
                              void reload()
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => openCourseMaterials(course.id)}
                          className="mt-3 text-sm text-sky-300 hover:text-sky-200"
                        >
                          Upload more in Materials tab →
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950">
                          Save changes
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditCourse}
                          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-white">{course.name}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass[course.status] ?? statusClass.ARCHIVED}`}>
                            {statusLabel[course.status] ?? course.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          {course.programmeCode} · Semester {course.semesterNumber}
                          {course.code ? ` · ${course.code}` : ''}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {course.totalMaterialCount} official materials ({course.publicMaterialCount} public)
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openCourseMaterials(course.id)}
                          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                        >
                          Materials
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditCourse(course)}
                          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        {course.status === 'PUBLISHED' ? (
                          <button
                            type="button"
                            onClick={() => void handleHideCourse(course)}
                            className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-300 hover:bg-amber-500/20"
                          >
                            Hide
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleDeleteCourse(course)}
                          className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-300 hover:bg-rose-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {tab === 'materials' ? (
        <div className="mt-8 space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-lg font-medium text-white">Upload official material</h3>
            <p className="mt-1 text-sm text-slate-400">
              Drag and drop multiple PDFs. Title and year default from filename. Choose visibility for the whole batch.
            </p>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(e) => void handleUploadMaterial(e)}>
              <select value={selectedCourseId ?? ''} onChange={(e) => setSelectedCourseId(Number(e.target.value))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white sm:col-span-2" required>
                <option value="" disabled>
                  Select course
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.programmeCode} · {c.name}
                  </option>
                ))}
              </select>
              <select
                value={materialType}
                onChange={(e) => {
                  const next = e.target.value as MaterialType
                  setMaterialType(next)
                  if (next !== 'SOLUTION') setSolutionExamMaterialId(null)
                  if (next === 'VIDEO') setMaterialFiles([])
                  else setMaterialYoutubeUrl('')
                }}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              >
                <option value="EXAM_PAPER">Exam paper</option>
                <option value="SOLUTION">Solution</option>
                <option value="LEARNING_MATERIAL">Learning material</option>
                <option value="VIDEO">YouTube video</option>
                <option value="OTHER">Other</option>
              </select>
              {materialType === 'SOLUTION' ? (
                <select
                  value={solutionExamMaterialId ?? ''}
                  onChange={(e) => setSolutionExamMaterialId(Number(e.target.value) || null)}
                  required
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white sm:col-span-2"
                >
                  <option value="" disabled>
                    Link to exam paper (required for solutions)
                  </option>
                  {courseExamPapers.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}
                    </option>
                  ))}
                </select>
              ) : null}
              <MaterialVisibilitySelect
                value={materialVisibility}
                onChange={setMaterialVisibility}
                context="official"
              />
              <input
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
                placeholder={
                  isVideoUpload ? 'Title (required for YouTube videos)' : 'Title for single file only (optional)'
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white sm:col-span-2"
              />
              {isVideoUpload ? (
                <input
                  type="url"
                  value={materialYoutubeUrl}
                  onChange={(e) => setMaterialYoutubeUrl(e.target.value)}
                  placeholder="YouTube link — https://www.youtube.com/watch?v=… or youtu.be/…"
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white sm:col-span-2"
                />
              ) : (
                <MaterialFileDropzone
                  files={materialFiles}
                  onFilesChange={setMaterialFiles}
                  disabled={uploadingMaterials}
                />
              )}
              {uploadProgress ? <p className="text-sm text-sky-300 sm:col-span-2">{uploadProgress}</p> : null}
              <button
                type="submit"
                disabled={uploadingMaterials || !canSubmitOfficialUpload}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white sm:col-span-2 sm:w-fit disabled:opacity-50"
              >
                {uploadingMaterials
                  ? 'Uploading…'
                  : isVideoUpload
                    ? 'Add YouTube video'
                    : materialFiles.length > 1
                      ? `Upload ${materialFiles.length} files`
                      : 'Upload official material'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-lg font-medium text-white">Official materials for course</h3>
            <p className="mt-1 text-sm text-slate-400">
              Click a public material to open it in course review (single panel). Change visibility or delete using the controls on each row.
            </p>
            <div className="mt-4">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Course</label>
              <select
                value={selectedCourseId ?? ''}
                onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.programmeCode} · {c.name} ({c.totalMaterialCount} materials)
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4">
              <AdminMaterialList
                key={`${selectedCourseId ?? 'none'}-${materialsVersion}`}
                courseId={selectedCourseId}
                onChanged={() => {
                  bumpMaterialsVersion()
                  void reload()
                }}
              />
            </div>
          </section>
        </div>
      ) : null}
    </main>

    {confirmCopy ? (
      <ConfirmDialog
        open={pendingConfirm != null}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={confirmCopy.confirmLabel}
        destructive
        busy={confirmBusy}
        error={confirmError}
        onConfirm={() => void executePendingConfirm()}
        onCancel={() => {
          if (!confirmBusy) {
            setPendingConfirm(null)
            setConfirmError(null)
          }
        }}
      />
    ) : null}
    </>
  )
}
