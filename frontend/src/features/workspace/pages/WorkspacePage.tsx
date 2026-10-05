import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  fetchMaterialBoard,
  uploadMaterial,
  addVideoMaterial,
  addNoteMaterial,
  updateMaterial,
  updateMaterialVisibility,
  deleteMaterial,
  hideOfficialMaterial,
  type Material,
  type MaterialBoard,
  type MaterialVisibility,
} from '../../../api/materials'
import { fetchUserCourse, type UserCourse } from '../../../api/myCourses'
import { resolveUserCourseTitle } from '../../my-courses/utils/userCourseDisplay'
import { defaultExamSolutionPair, findMaterial } from '../../course-review/utils/defaultPairing'
import { createShareLink, fetchShareLinks, revokeShareLink, type ShareLink } from '../../../api/sharing'
import {
  fetchWorkspaceState,
  saveWorkspaceState,
  type ActivePanel,
  type WorkspaceState,
  type WorkspaceViewMode,
} from '../../../api/workspace'
import { MyMaterialsPanel } from '../components/MyMaterialsPanel'
import { TrashMaterialsPanel } from '../components/TrashMaterialsPanel'
import {
  DEFAULT_DIVIDER,
  StudyWorkspace,
  ConfirmDialog,
  WorkspaceDialog,
  WorkspaceOwnerMenu,
  type NoteDraftSession,
} from '../components/StudyWorkspace'
import { listOfficialExamPapers } from '../utils/materialTree'
import { dualPanelStateFromWorkspace, mirrorSwapDualPanels } from '../utils/mirrorSwap'
import {
  REVIEW_SHARED_GUIDE_TEXT,
  REVIEW_WORKSPACE_GUIDE_KEY,
  REVIEW_WORKSPACE_GUIDE_TEXT,
  SHARE_RECIPIENT_NOTE,
} from '../utils/materialLabels'
import type { PdfFitMode } from '../components/PdfViewer'
import { MaterialFileDropzone } from '../../../components/MaterialFileDropzone'
import { MaterialVisibilitySelect } from '../../../components/MaterialVisibilitySelect'
import { parseYoutubeVideoId } from '../../../utils/youtube'
import { useAuthStore } from '../../../stores/authStore'

export function WorkspacePage() {
  const { userCourseId: userCourseIdParam } = useParams()
  const userCourseId = Number(userCourseIdParam)
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'ADMIN'
  const [board, setBoard] = useState<MaterialBoard | null>(null)
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null)
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [error, setError] = useState<string | null>(null)
  const [userCourse, setUserCourse] = useState<UserCourse | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [trashOpen, setTrashOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadScope, setUploadScope] = useState<'COURSE' | 'EXAM'>('COURSE')
  const [uploadExamMaterialId, setUploadExamMaterialId] = useState<number | null>(null)
  const [uploadVisibility, setUploadVisibility] = useState<MaterialVisibility>('SHARED')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadYoutubeUrl, setUploadYoutubeUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [leftFitMode, setLeftFitMode] = useState<PdfFitMode>('width')
  const [rightFitMode, setRightFitMode] = useState<PdfFitMode>('width')
  const [pendingDelete, setPendingDelete] = useState<Material | null>(null)
  const [deletingMaterial, setDeletingMaterial] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [materialsRefreshKey, setMaterialsRefreshKey] = useState(0)
  const [aiSourcePanel, setAiSourcePanel] = useState<ActivePanel | null>(null)
  const [addSourcePanel, setAddSourcePanel] = useState<ActivePanel | null>(null)
  const [noteDraft, setNoteDraft] = useState<NoteDraftSession | null>(null)
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)
  const saveTimer = useRef<number | null>(null)
  const isOwner = userCourse?.ownedByCurrentUser ?? false

  const reload = useCallback(async () => {
    if (!Number.isFinite(userCourseId)) return
    const [boardData, stateData, links, courseInfo] = await Promise.all([
      fetchMaterialBoard(userCourseId),
      fetchWorkspaceState(userCourseId),
      fetchShareLinks(userCourseId).catch(() => [] as ShareLink[]),
      fetchUserCourse(userCourseId),
    ])
    setUserCourse(courseInfo)
    setShareLinks(courseInfo.ownedByCurrentUser ? links : [])
    setBoard(boardData)

    let nextState = { ...stateData }
    if (nextState.leftMaterialId && !findMaterial(boardData, nextState.leftMaterialId)) {
      nextState = { ...nextState, leftMaterialId: null, leftPage: 1 }
    }
    if (nextState.rightMaterialId && !findMaterial(boardData, nextState.rightMaterialId)) {
      nextState = { ...nextState, rightMaterialId: null, rightPage: 1 }
    }
    if (!nextState.leftMaterialId) {
      const defaults = defaultExamSolutionPair(boardData)
      nextState = {
        ...nextState,
        leftMaterialId: defaults.leftMaterialId,
        rightMaterialId: defaults.rightMaterialId,
      }
    }
    if (nextState.viewMode == null) nextState.viewMode = 'DUAL'
    if (nextState.activePanel == null) nextState.activePanel = 'LEFT'
    if (nextState.dividerPosition == null) nextState.dividerPosition = DEFAULT_DIVIDER
    if (nextState.leftZoom == null) nextState.leftZoom = 1
    if (nextState.rightZoom == null) nextState.rightZoom = 1
    setLeftFitMode(nextState.leftZoom !== 1 ? 'custom' : 'width')
    setRightFitMode(nextState.rightZoom !== 1 ? 'custom' : 'width')
    setWorkspace(nextState)
  }, [userCourseId])

  useEffect(() => {
    if (!Number.isFinite(userCourseId)) {
      setError('Invalid course id')
      return
    }
    reload().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to load workspace')
    })
  }, [userCourseId, reload])

  const scheduleSave = useCallback(
    (next: WorkspaceState) => {
      if (!isOwner) return
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        void saveWorkspaceState(userCourseId, next).catch(() => undefined)
      }, 600)
    },
    [userCourseId, isOwner],
  )

  function patchWorkspace(patch: Partial<WorkspaceState>) {
    setWorkspace((current) => {
      if (!current) return current
      const next = { ...current, ...patch }
      scheduleSave(next)
      return next
    })
  }

  function swapPanels() {
    setAiSourcePanel(null)
    setNoteDraft(null)
    setNoteError(null)
    setLeftFitMode(rightFitMode)
    setRightFitMode(leftFitMode)
    setWorkspace((current) => {
      if (!current) return current
      const swapped = mirrorSwapDualPanels(
        dualPanelStateFromWorkspace(current, leftFitMode, rightFitMode),
      )
      const next: WorkspaceState = {
        ...current,
        leftMaterialId: swapped.left.materialId,
        rightMaterialId: swapped.right.materialId,
        leftPage: swapped.left.page,
        rightPage: swapped.right.page,
        leftZoom: swapped.left.zoom,
        rightZoom: swapped.right.zoom,
        leftScrollPosition: swapped.left.scrollPosition,
        rightScrollPosition: swapped.right.scrollPosition,
        dividerPosition: swapped.dividerPosition,
        activePanel: swapped.activePanel,
      }
      scheduleSave(next)
      return next
    })
  }

  useEffect(() => {
    if (addOpen) {
      setUploadVisibility(isAdmin ? 'PUBLIC' : 'SHARED')
    }
  }, [addOpen, isAdmin])

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault()
    if (!isOwner) return

    const youtubeVideoId = parseYoutubeVideoId(uploadYoutubeUrl)
    if (uploadYoutubeUrl.trim() && !youtubeVideoId) {
      setError('Enter a valid YouTube link (youtube.com or youtu.be)')
      return
    }
    if (selectedFiles.length === 0 && !youtubeVideoId) return
    if (youtubeVideoId && !uploadTitle.trim()) {
      setError('Title is required when adding a YouTube video')
      return
    }

    setUploading(true)
    setUploadProgress(null)
    setError(null)
    const sourcePanel = addSourcePanel
    try {
      const sharedTitle = uploadTitle.trim() || undefined
      const parentExamMaterialId = uploadScope === 'EXAM' ? uploadExamMaterialId : null
      const created: Material[] = []

      if (youtubeVideoId) {
        setUploadProgress('Adding YouTube video…')
        created.push(
          await addVideoMaterial(userCourseId, {
            title: sharedTitle!,
            videoId: youtubeVideoId,
            visibility: uploadVisibility,
            parentExamMaterialId,
          }),
        )
      }

      for (let index = 0; index < selectedFiles.length; index += 1) {
        const file = selectedFiles[index]
        setUploadProgress(`Uploading ${index + 1} of ${selectedFiles.length}…`)
        const title = selectedFiles.length === 1 && !youtubeVideoId ? sharedTitle : undefined
        created.push(
          await uploadMaterial(userCourseId, file, title, uploadVisibility, parentExamMaterialId),
        )
      }

      const previewMaterialId = created[0]?.id ?? null

      setUploadTitle('')
      setUploadYoutubeUrl('')
      setSelectedFiles([])
      setUploadProgress(null)
      setUploadScope('COURSE')
      setUploadExamMaterialId(null)
      setAddSourcePanel(null)
      setAddOpen(false)
      await reload()

      if (previewMaterialId != null && sourcePanel != null) {
        setAiSourcePanel(null)
        const opposite: ActivePanel = sourcePanel === 'LEFT' ? 'RIGHT' : 'LEFT'
        if (opposite === 'RIGHT') {
          setRightFitMode('width')
          patchWorkspace({
            viewMode: 'DUAL',
            rightMaterialId: previewMaterialId,
            rightPage: 1,
            activePanel: 'RIGHT',
          })
        } else {
          setLeftFitMode('width')
          // Keep the source exam on the right — do not clear it when opening left.
          patchWorkspace({
            viewMode: 'DUAL',
            leftMaterialId: previewMaterialId,
            leftPage: 1,
            activePanel: 'LEFT',
          })
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const parsedYoutubeVideoId = parseYoutubeVideoId(uploadYoutubeUrl)
  const canSubmitUpload =
    (selectedFiles.length > 0 || parsedYoutubeVideoId != null) &&
    (uploadScope !== 'EXAM' || uploadExamMaterialId != null) &&
    (!parsedYoutubeVideoId || uploadTitle.trim().length > 0)

  async function handleCreateShareLink() {
    const link = await createShareLink(userCourseId)
    setShareLinks((prev) => [link, ...prev])
  }

  async function handleRevokeLink(shareLinkId: number) {
    await revokeShareLink(shareLinkId)
    setShareLinks((prev) => prev.filter((l) => l.id !== shareLinkId))
  }

  function requestDeleteMaterial(material: Material) {
    if (!isOwner) return
    setDeleteError(null)
    setPendingDelete(material)
  }

  function handleLeftMaterialChange(leftMaterialId: number | null) {
    setAiSourcePanel(null)
    setNoteDraft(null)
    setNoteError(null)
    const patch: Partial<WorkspaceState> = { leftMaterialId, leftPage: 1 }
    if (workspace?.viewMode === 'DUAL' && leftMaterialId != null) {
      patch.rightMaterialId = null
      patch.rightPage = 1
    }
    patchWorkspace(patch)
  }

  function handleRightMaterialChange(rightMaterialId: number | null) {
    setAiSourcePanel(null)
    setNoteDraft(null)
    setNoteError(null)
    patchWorkspace({ rightMaterialId })
  }

  function handleAskAi(fromPanel: ActivePanel) {
    const sourceId = fromPanel === 'LEFT' ? workspace?.leftMaterialId : workspace?.rightMaterialId
    if (sourceId == null) return
    const opposite: ActivePanel = fromPanel === 'LEFT' ? 'RIGHT' : 'LEFT'
    setNoteDraft(null)
    setNoteError(null)
    setAiSourcePanel(fromPanel)
    patchWorkspace({ viewMode: 'DUAL', activePanel: opposite })
  }

  function handleCloseAi() {
    setAiSourcePanel(null)
  }

  function handleAddNote(parentExamMaterialId: number, fromPanel: ActivePanel) {
    const exam = board ? findMaterial(board, parentExamMaterialId) : null
    if (!exam) return
    const opposite: ActivePanel = fromPanel === 'LEFT' ? 'RIGHT' : 'LEFT'
    setAiSourcePanel(null)
    setNoteError(null)
    setNoteDraft({
      sourcePanel: fromPanel,
      parentExamMaterialId,
      parentExamTitle: exam.title,
    })
    patchWorkspace({ viewMode: 'DUAL', activePanel: opposite })
  }

  function handleCloseNoteDraft() {
    setNoteDraft(null)
    setNoteError(null)
  }

  async function handleSaveNoteDraft(payload: {
    title: string
    htmlBody: string
    visibility: MaterialVisibility
  }) {
    if (!noteDraft || !isOwner) return
    setNoteSaving(true)
    setNoteError(null)
    const sourcePanel = noteDraft.sourcePanel
    try {
      const created = await addNoteMaterial(userCourseId, {
        title: payload.title,
        htmlBody: payload.htmlBody,
        visibility: payload.visibility,
        parentExamMaterialId: noteDraft.parentExamMaterialId,
      })
      setNoteDraft(null)
      await reload()
      const opposite: ActivePanel = sourcePanel === 'LEFT' ? 'RIGHT' : 'LEFT'
      if (opposite === 'RIGHT') {
        setRightFitMode('width')
        patchWorkspace({
          viewMode: 'DUAL',
          rightMaterialId: created.id,
          rightPage: 1,
          activePanel: 'RIGHT',
        })
      } else {
        setLeftFitMode('width')
        patchWorkspace({
          viewMode: 'DUAL',
          leftMaterialId: created.id,
          leftPage: 1,
          activePanel: 'LEFT',
        })
      }
    } catch (err: unknown) {
      setNoteError(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setNoteSaving(false)
    }
  }

  async function handleUpdateNote(
    materialId: number,
    payload: { title: string; htmlBody: string; visibility: MaterialVisibility },
  ) {
    if (!isOwner) return
    setNoteSaving(true)
    setNoteError(null)
    try {
      await updateMaterial(materialId, {
        title: payload.title,
        htmlBody: payload.htmlBody,
      })
      await updateMaterialVisibility(materialId, payload.visibility)
      await reload()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update note'
      setNoteError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setNoteSaving(false)
    }
  }

  function openAddMaterialDialog(
    parentExamMaterialId?: number | null,
    fromPanel?: ActivePanel | null,
  ) {
    setAddSourcePanel(fromPanel ?? null)
    if (parentExamMaterialId != null) {
      setUploadScope('EXAM')
      setUploadExamMaterialId(parentExamMaterialId)
    } else {
      setUploadScope('COURSE')
      setUploadExamMaterialId(null)
    }
    setAddOpen(true)
  }

  function handlePreviewMaterial(material: Material) {
    const panel = workspace?.activePanel ?? 'LEFT'
    if (panel === 'RIGHT') {
      patchWorkspace({ rightMaterialId: material.id, rightPage: 1, activePanel: 'RIGHT' })
      setRightFitMode('width')
    } else {
      const patch: Partial<WorkspaceState> = {
        leftMaterialId: material.id,
        leftPage: 1,
        activePanel: 'LEFT',
      }
      if (workspace?.viewMode === 'DUAL') {
        patch.rightMaterialId = null
        patch.rightPage = 1
      }
      setAiSourcePanel(null)
      patchWorkspace(patch)
      setLeftFitMode('width')
    }
    setManageOpen(false)
  }

  async function confirmDeleteMaterial() {
    if (!pendingDelete || !isOwner) return
    const materialId = pendingDelete.id
    const isOfficial = pendingDelete.official
    setDeletingMaterial(true)
    setDeleteError(null)
    setError(null)
    try {
      if (isOfficial) {
        await hideOfficialMaterial(userCourseId, materialId)
      } else {
        await deleteMaterial(materialId)
      }

      const current = workspace
      const next: WorkspaceState = current
        ? { ...current }
        : {
            id: null,
            userCourseId,
            leftMaterialId: null,
            rightMaterialId: null,
            leftPage: 1,
            rightPage: 1,
            leftScrollPosition: null,
            rightScrollPosition: null,
            leftZoom: 1,
            rightZoom: 1,
            dividerPosition: DEFAULT_DIVIDER,
            activePanel: 'LEFT',
            viewMode: 'DUAL',
          }

      if (next.leftMaterialId === materialId) {
        next.leftMaterialId = null
        next.leftPage = 1
      }
      if (next.rightMaterialId === materialId) {
        next.rightMaterialId = null
        next.rightPage = 1
      }

      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current)
        saveTimer.current = null
      }

      setPendingDelete(null)
      setWorkspace(next)
      setBoard(await fetchMaterialBoard(userCourseId))
      setMaterialsRefreshKey((value) => value + 1)
      void saveWorkspaceState(userCourseId, next).catch(() => undefined)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      setDeleteError(message)
      setError(message)
    } finally {
      setDeletingMaterial(false)
    }
  }

  if (!Number.isFinite(userCourseId)) {
    return <main className="p-8 text-rose-300">Invalid workspace id.</main>
  }

  return (
    <>
      <StudyWorkspace
        title={userCourse ? resolveUserCourseTitle(userCourse) : 'Workspace'}
        pinsStorageKey={`workspace-${userCourseId}`}
        preferSingleOnNarrow
        reviewGuide={
          isOwner
            ? {
                text: REVIEW_WORKSPACE_GUIDE_TEXT,
                storageKey: REVIEW_WORKSPACE_GUIDE_KEY,
              }
            : userCourse
              ? {
                  text: REVIEW_SHARED_GUIDE_TEXT,
                  storageKey: `study-platform:shared-guide-${userCourseId}`,
                }
              : null
        }
        backTo="/my-courses"
        backLabel="My Courses"
        board={board}
        viewMode={workspace?.viewMode ?? 'DUAL'}
        activePanel={(workspace?.activePanel ?? 'LEFT') as ActivePanel}
        leftMaterialId={workspace?.leftMaterialId ?? null}
        rightMaterialId={workspace?.rightMaterialId ?? null}
        leftZoom={workspace?.leftZoom ?? 1}
        rightZoom={workspace?.rightZoom ?? 1}
        leftFitMode={leftFitMode}
        rightFitMode={rightFitMode}
        leftPage={workspace?.leftPage ?? 1}
        rightPage={workspace?.rightPage ?? 1}
        dividerPosition={workspace?.dividerPosition ?? DEFAULT_DIVIDER}
        readOnly={!isOwner}
        workspaceUserCourseId={userCourseId}
        statusMessage={error ?? undefined}
        statusIsError={error != null}
        onViewModeChange={(viewMode: WorkspaceViewMode) => patchWorkspace({ viewMode })}
        onActivePanelChange={(activePanel: ActivePanel) => patchWorkspace({ activePanel })}
        onLeftMaterialChange={handleLeftMaterialChange}
        onRightMaterialChange={handleRightMaterialChange}
        aiSourcePanel={aiSourcePanel}
        onAskAi={isOwner ? handleAskAi : undefined}
        onCloseAi={handleCloseAi}
        onAddRelatedMaterial={
          isOwner
            ? (examId, fromPanel) => openAddMaterialDialog(examId, fromPanel)
            : undefined
        }
        noteDraft={noteDraft}
        noteSaving={noteSaving}
        noteError={noteError}
        allowPublicNotes={isAdmin}
        onAddNote={isOwner ? handleAddNote : undefined}
        onCloseNoteDraft={handleCloseNoteDraft}
        onSaveNoteDraft={(payload) => void handleSaveNoteDraft(payload)}
        onUpdateNote={isOwner ? (id, payload) => handleUpdateNote(id, payload) : undefined}
        courseCode={userCourse?.courseCode}
        onLeftZoomChange={(leftZoom) => patchWorkspace({ leftZoom })}
        onRightZoomChange={(rightZoom) => patchWorkspace({ rightZoom })}
        onLeftFitModeChange={setLeftFitMode}
        onRightFitModeChange={setRightFitMode}
        onLeftPageChange={(leftPage) => patchWorkspace({ leftPage })}
        onRightPageChange={(rightPage) => patchWorkspace({ rightPage })}
        onDividerChange={(dividerPosition) => patchWorkspace({ dividerPosition })}
        onSwapPanels={swapPanels}
        onDeleteMaterial={isOwner ? requestDeleteMaterial : undefined}
        ownerMenu={
          isOwner ? (
            <WorkspaceOwnerMenu
              onAddMaterial={() => openAddMaterialDialog()}
              onManageMaterials={() => setManageOpen(true)}
              onTrash={() => setTrashOpen(true)}
              onShare={() => setShareOpen(true)}
            />
          ) : undefined
        }
      />

      <ConfirmDialog
        open={pendingDelete != null}
        title={pendingDelete?.official ? 'Remove from workspace?' : 'Move to trash?'}
        message={
          pendingDelete
            ? pendingDelete.official
              ? `Remove "${pendingDelete.title}" from your workspace? The official file stays published — you can restore it from Trash.`
              : `Move "${pendingDelete.title}" to trash? You can permanently remove it later from Trash in the menu.`
            : ''
        }
        confirmLabel={pendingDelete?.official ? 'Remove' : 'Move to trash'}
        cancelLabel="Cancel"
        destructive
        busy={deletingMaterial}
        error={deleteError}
        onConfirm={() => void confirmDeleteMaterial()}
        onCancel={() => {
          if (!deletingMaterial) {
            setPendingDelete(null)
            setDeleteError(null)
          }
        }}
      />

      <WorkspaceDialog
        open={addOpen}
        title="Add my material"
        onClose={() => {
          setAddOpen(false)
          setAddSourcePanel(null)
        }}
      >
        <form className="space-y-3" onSubmit={(e) => void handleUpload(e)}>
          <p className="text-sm text-slate-400">
            {uploadScope === 'EXAM' && uploadExamMaterialId != null
              ? `This upload will be linked under “${
                  (board ? findMaterial(board, uploadExamMaterialId)?.title : null) ??
                  'the selected exam'
                }”. You can change that below.`
              : isAdmin
                ? 'Choose Public to publish on the course page for all students. Link to an exam paper or add to course materials.'
                : 'Personal uploads only. Link to an official exam paper or add to course materials.'}
          </p>
          <input
            type="text"
            placeholder={
              parseYoutubeVideoId(uploadYoutubeUrl)
                ? 'Title (required for YouTube videos)'
                : 'Title (optional for files — defaults to filename)'
            }
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium uppercase tracking-wide text-slate-400">Related to</legend>
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="radio"
                name="uploadScope"
                checked={uploadScope === 'COURSE'}
                onChange={() => setUploadScope('COURSE')}
              />
              Course materials
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="radio"
                name="uploadScope"
                checked={uploadScope === 'EXAM'}
                onChange={() => setUploadScope('EXAM')}
              />
              Exam paper
            </label>
          </fieldset>
          {uploadScope === 'EXAM' ? (
            <select
              value={uploadExamMaterialId ?? ''}
              onChange={(e) => setUploadExamMaterialId(Number(e.target.value) || null)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              <option value="" disabled>
                Select official exam paper
              </option>
              {listOfficialExamPapers(board ?? { examPapers: [], solutions: [], learningMaterials: [], images: [], videos: [], other: [], myMaterials: [] }).map(
                (exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}
                  </option>
                ),
              )}
            </select>
          ) : null}
          <MaterialVisibilitySelect
            value={uploadVisibility}
            onChange={setUploadVisibility}
            context="personal"
            allowPublic={isAdmin}
          />
          <MaterialFileDropzone files={selectedFiles} onFilesChange={setSelectedFiles} disabled={uploading} />
          <div className="space-y-1">
            <label htmlFor="upload-youtube-url" className="text-xs font-medium uppercase tracking-wide text-slate-400">
              YouTube link (optional)
            </label>
            <input
              id="upload-youtube-url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=… or youtu.be/…"
              value={uploadYoutubeUrl}
              onChange={(e) => setUploadYoutubeUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            <p className="text-xs text-slate-500">
              Paste a YouTube URL instead of uploading a file, or use both. Title is required for videos.
            </p>
          </div>
          {uploadProgress ? <p className="text-xs text-sky-300">{uploadProgress}</p> : null}
          <button
            type="submit"
            disabled={uploading || !canSubmitUpload}
            className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50"
          >
            {uploading
              ? 'Uploading…'
              : selectedFiles.length > 1
                ? `Upload ${selectedFiles.length} files`
                : parsedYoutubeVideoId && selectedFiles.length === 0
                  ? 'Add YouTube video'
                  : parsedYoutubeVideoId && selectedFiles.length > 0
                    ? 'Upload and add video'
                    : 'Upload my material'}
          </button>
        </form>
      </WorkspaceDialog>

      <MyMaterialsPanel
        open={manageOpen}
        userCourseId={userCourseId}
        examPapers={board?.examPapers ?? []}
        refreshKey={materialsRefreshKey}
        onClose={() => setManageOpen(false)}
        onChanged={() => void reload()}
        onDeleteMaterial={requestDeleteMaterial}
        onPreviewMaterial={handlePreviewMaterial}
      />

      <TrashMaterialsPanel
        open={trashOpen}
        userCourseId={userCourseId}
        onClose={() => setTrashOpen(false)}
        onChanged={() => {
          void reload()
          setMaterialsRefreshKey((value) => value + 1)
        }}
      />

      <WorkspaceDialog open={shareOpen} title="Share course version" onClose={() => setShareOpen(false)}>
        <p className="text-sm text-slate-400">
          {SHARE_RECIPIENT_NOTE}
        </p>
        {board && workspace ? (
          <p className="mt-2 text-xs text-slate-500">
            Current review layout — Left:{' '}
            <span className="text-slate-300">
              {findMaterial(board, workspace.leftMaterialId)?.title ?? 'None'}
            </span>
            {' · '}
            Right:{' '}
            <span className="text-slate-300">
              {findMaterial(board, workspace.rightMaterialId)?.title ?? 'None'}
            </span>
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void handleCreateShareLink()}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Create share link
        </button>
        <ul className="mt-4 space-y-2">
          {shareLinks.map((link) => (
            <li key={link.id} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">
              <p className="truncate text-sky-300">{link.shareUrl}</p>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(link.shareUrl)}
                  className="text-slate-400 hover:text-white"
                >
                  Copy
                </button>
                {link.active ? (
                  <button
                    type="button"
                    onClick={() => void handleRevokeLink(link.id)}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    Revoke
                  </button>
                ) : null}
              </div>
            </li>
          ))}
          {shareLinks.length === 0 ? (
            <li className="text-xs text-slate-500">No share links yet.</li>
          ) : null}
        </ul>
      </WorkspaceDialog>
    </>
  )
}
