import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { fetchCourse, fetchPublicMaterialBoard } from '../../../api/courses'
import type { MaterialBoard } from '../../../api/materials'
import type { ActivePanel, WorkspaceViewMode } from '../../../api/workspace'
import { addCourseToLibrary, fetchMyCourses, type UserCourse } from '../../../api/myCourses'
import { useAuthStore } from '../../../stores/authStore'
import { useAuthModalStore } from '../../../stores/authModalStore'
import { defaultExamSolutionPair, findMaterial } from '../utils/defaultPairing'
import { DEFAULT_DIVIDER, StudyWorkspace } from '../../workspace/components/StudyWorkspace'
import { mirrorSwapDualPanels } from '../../workspace/utils/mirrorSwap'
import {
  REVIEW_COURSE_GUIDE_KEY,
  REVIEW_COURSE_GUIDE_TEXT,
} from '../../workspace/utils/materialLabels'
import type { PdfFitMode } from '../../workspace/components/PdfViewer'
import { AddToMyCoursesDialog } from '../../my-courses/components/AddToMyCoursesDialog'

export function CourseReviewPage() {
  const { courseId: courseIdParam } = useParams()
  const courseId = Number(courseIdParam)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const materialParam = searchParams.get('material')
  const modeParam = searchParams.get('mode')
  const authStatus = useAuthStore((state) => state.status)
  const openLogin = useAuthModalStore((state) => state.openLogin)
  const [courseName, setCourseName] = useState('')
  const [courseCode, setCourseCode] = useState<string | null>(null)
  const [semesterNumber, setSemesterNumber] = useState(0)
  const [board, setBoard] = useState<MaterialBoard | null>(null)
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('DUAL')
  const [activePanel, setActivePanel] = useState<ActivePanel>('LEFT')
  const [leftMaterialId, setLeftMaterialId] = useState<number | null>(null)
  const [rightMaterialId, setRightMaterialId] = useState<number | null>(null)
  const [leftZoom, setLeftZoom] = useState(1)
  const [rightZoom, setRightZoom] = useState(1)
  const [leftFitMode, setLeftFitMode] = useState<PdfFitMode>('width')
  const [rightFitMode, setRightFitMode] = useState<PdfFitMode>('width')
  const [leftPage, setLeftPage] = useState(1)
  const [rightPage, setRightPage] = useState(1)
  const [dividerPosition, setDividerPosition] = useState(DEFAULT_DIVIDER)
  const [existingCourses, setExistingCourses] = useState<UserCourse[]>([])
  const [adding, setAdding] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(courseId)) {
      setError('Invalid course id')
      return
    }

    Promise.all([fetchCourse(courseId), fetchPublicMaterialBoard(courseId)])
      .then(([course, materialBoard]) => {
        setCourseName(course.name)
        setCourseCode(course.code)
        setSemesterNumber(course.semesterNumber)
        setBoard(materialBoard)

        const requestedMaterialId = materialParam ? Number(materialParam) : null
        const wantsSingle = modeParam?.toUpperCase() === 'SINGLE'
        const requestedMaterial =
          requestedMaterialId != null && Number.isFinite(requestedMaterialId)
            ? findMaterial(materialBoard, requestedMaterialId)
            : null

        if (wantsSingle) {
          setViewMode('SINGLE')
          setActivePanel('LEFT')
        }

        if (requestedMaterial) {
          setLeftMaterialId(requestedMaterial.id)
          setLeftPage(1)
          if (wantsSingle) {
            setRightMaterialId(null)
          } else {
            const defaults = defaultExamSolutionPair(materialBoard)
            setRightMaterialId(defaults.rightMaterialId)
          }
        } else {
          const defaults = defaultExamSolutionPair(materialBoard)
          setLeftMaterialId(defaults.leftMaterialId)
          setRightMaterialId(defaults.rightMaterialId)
        }

        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load course')
      })
  }, [courseId, materialParam, modeParam])

  useEffect(() => {
    if (authStatus !== 'authenticated' || !Number.isFinite(courseId)) {
      setExistingCourses([])
      return
    }
    fetchMyCourses()
      .then((courses) => {
        setExistingCourses(courses.filter((course) => course.courseId === courseId && !course.archived))
      })
      .catch(() => setExistingCourses([]))
  }, [authStatus, courseId])

  async function handleAddToLibrary(displayName?: string, createAnother = false) {
    if (authStatus !== 'authenticated') {
      openLogin(`/courses/${courseId}/review`)
      return
    }
    setAdding(true)
    setAddError(null)
    try {
      const userCourse = await addCourseToLibrary(courseId, {
        displayName,
        createAnother,
      })
      navigate(`/workspace/${userCourse.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add course'
      setAddError(message)
      if (!createAnother) {
        setError(message)
      }
    } finally {
      setAdding(false)
    }
  }

  function handleAddClick() {
    if (authStatus !== 'authenticated') {
      openLogin(`/courses/${courseId}/review`)
      return
    }
    if (existingCourses.length > 0) {
      setAddError(null)
      setAddDialogOpen(true)
      return
    }
    void handleAddToLibrary()
  }

  function swapPanels() {
    const swapped = mirrorSwapDualPanels({
      left: {
        materialId: leftMaterialId,
        page: leftPage,
        zoom: leftZoom,
        fitMode: leftFitMode,
        scrollPosition: null,
      },
      right: {
        materialId: rightMaterialId,
        page: rightPage,
        zoom: rightZoom,
        fitMode: rightFitMode,
        scrollPosition: null,
      },
      activePanel,
      dividerPosition,
    })
    setLeftMaterialId(swapped.left.materialId)
    setRightMaterialId(swapped.right.materialId)
    setLeftPage(swapped.left.page)
    setRightPage(swapped.right.page)
    setLeftZoom(swapped.left.zoom)
    setRightZoom(swapped.right.zoom)
    setLeftFitMode(swapped.left.fitMode)
    setRightFitMode(swapped.right.fitMode)
    setActivePanel(swapped.activePanel)
    setDividerPosition(swapped.dividerPosition)
  }

  function handleLeftMaterialChange(materialId: number | null) {
    setLeftMaterialId(materialId)
    setLeftPage(1)
    if (viewMode === 'DUAL' && materialId != null) {
      setRightMaterialId(null)
      setRightPage(1)
    }
  }

  return (
    <>
      <StudyWorkspace
        title={courseName || 'Course review'}
        subtitle={courseCode}
        modeLabel="Review"
        pinsStorageKey={`review-course-${courseId}`}
        preferSingleOnNarrow
        reviewGuide={{
          text: REVIEW_COURSE_GUIDE_TEXT,
          storageKey: REVIEW_COURSE_GUIDE_KEY,
        }}
        backTo="/"
        backLabel="Home"
        board={board}
        viewMode={viewMode}
        activePanel={activePanel}
        leftMaterialId={leftMaterialId}
        rightMaterialId={rightMaterialId}
        leftZoom={leftZoom}
        rightZoom={rightZoom}
        leftFitMode={leftFitMode}
        rightFitMode={rightFitMode}
        leftPage={leftPage}
        rightPage={rightPage}
        dividerPosition={dividerPosition}
        readOnly
        statusMessage={error ?? undefined}
        statusIsError={error != null}
        headerRight={
          <button
            type="button"
            disabled={adding}
            onClick={handleAddClick}
            className="rounded-md bg-sky-500 px-2 py-1 text-xs font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add to My Courses'}
          </button>
        }
        onViewModeChange={setViewMode}
        onActivePanelChange={setActivePanel}
        onLeftMaterialChange={handleLeftMaterialChange}
        onRightMaterialChange={setRightMaterialId}
        onLeftZoomChange={setLeftZoom}
        onRightZoomChange={setRightZoom}
        onLeftFitModeChange={setLeftFitMode}
        onRightFitModeChange={setRightFitMode}
        onLeftPageChange={setLeftPage}
        onRightPageChange={setRightPage}
        onDividerChange={setDividerPosition}
        onSwapPanels={swapPanels}
      />

      <AddToMyCoursesDialog
        open={addDialogOpen}
        officialCourseName={courseName}
        officialCourseCode={courseCode}
        semesterNumber={semesterNumber}
        existingCourses={existingCourses}
        busy={adding}
        error={addError}
        onOpenExisting={(userCourseId) => {
          setAddDialogOpen(false)
          navigate(`/workspace/${userCourseId}`)
        }}
        onCreateAnother={(name) => void handleAddToLibrary(name, true)}
        onClose={() => {
          if (!adding) {
            setAddDialogOpen(false)
            setAddError(null)
          }
        }}
      />
    </>
  )
}
