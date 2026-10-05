import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Material, MaterialBoard, MaterialType, MaterialVisibility } from '../../../api/materials'
import { flattenMaterialBoard, materialDownloadUrl, canRemoveMaterialToTrash } from '../../../api/materials'
import type { ActivePanel, WorkspaceViewMode } from '../../../api/workspace'
import { findMaterial } from '../../course-review/utils/defaultPairing'
import { materialTypeLabel } from '../utils/materialLabels'
import { resolveRelatedExamMaterialId } from '../utils/materialTree'
import { MaterialPalette } from './MaterialPalette'
import { ReviewGuideBar, type ReviewGuideConfig } from './ReviewGuideBar'
import type { PdfFitMode } from './PdfViewer'
import { ViewerPanel } from './ViewerPanel'
import { AiWorkspacePanel } from './AiWorkspacePanel'
import { NoteWorkspacePanel } from './NoteWorkspacePanel'

const DEFAULT_DIVIDER = 50

export type NoteDraftSession = {
  sourcePanel: ActivePanel
  parentExamMaterialId: number
  parentExamTitle: string
}

interface StudyWorkspaceProps {
  title: string
  subtitle?: string | null
  backTo: string
  backLabel: string
  board: MaterialBoard | null
  viewMode: WorkspaceViewMode
  activePanel: ActivePanel
  leftMaterialId: number | null
  rightMaterialId: number | null
  leftZoom: number
  rightZoom: number
  leftFitMode: PdfFitMode
  rightFitMode: PdfFitMode
  leftPage: number
  rightPage: number
  dividerPosition: number
  readOnly?: boolean
  workspaceUserCourseId?: number | null
  statusMessage?: string | null
  statusIsError?: boolean
  reviewGuide?: ReviewGuideConfig | null
  modeLabel?: string
  pinsStorageKey?: string
  preferSingleOnNarrow?: boolean
  headerRight?: ReactNode
  aiSourcePanel?: ActivePanel | null
  onAskAi?: (fromPanel: ActivePanel) => void
  onCloseAi?: () => void
  onAddRelatedMaterial?: (parentExamMaterialId: number, fromPanel: ActivePanel) => void
  noteDraft?: NoteDraftSession | null
  noteSaving?: boolean
  noteError?: string | null
  allowPublicNotes?: boolean
  onAddNote?: (parentExamMaterialId: number, fromPanel: ActivePanel) => void
  onCloseNoteDraft?: () => void
  onSaveNoteDraft?: (payload: {
    title: string
    htmlBody: string
    visibility: MaterialVisibility
  }) => void
  onUpdateNote?: (
    materialId: number,
    payload: { title: string; htmlBody: string; visibility: MaterialVisibility },
  ) => void | Promise<void>
  courseCode?: string | null
  onViewModeChange: (mode: WorkspaceViewMode) => void
  onActivePanelChange: (panel: ActivePanel) => void
  onLeftMaterialChange: (id: number | null) => void
  onRightMaterialChange: (id: number | null) => void
  onLeftZoomChange: (zoom: number) => void
  onRightZoomChange: (zoom: number) => void
  onLeftFitModeChange: (mode: PdfFitMode) => void
  onRightFitModeChange: (mode: PdfFitMode) => void
  onLeftPageChange: (page: number) => void
  onRightPageChange: (page: number) => void
  onDividerChange: (position: number) => void
  onSwapPanels?: () => void
  onDeleteMaterial?: (material: Material, side: ActivePanel) => void
  ownerMenu?: ReactNode
}

export function StudyWorkspace({
  title,
  subtitle,
  backTo,
  backLabel,
  board,
  viewMode,
  activePanel,
  leftMaterialId,
  rightMaterialId,
  leftZoom,
  rightZoom,
  leftFitMode,
  rightFitMode,
  leftPage,
  rightPage,
  dividerPosition,
  readOnly,
  workspaceUserCourseId,
  statusMessage,
  statusIsError = false,
  reviewGuide,
  modeLabel,
  pinsStorageKey,
  preferSingleOnNarrow = false,
  headerRight,
  aiSourcePanel = null,
  onAskAi,
  onCloseAi,
  onAddRelatedMaterial,
  noteDraft = null,
  noteSaving = false,
  noteError = null,
  allowPublicNotes = false,
  onAddNote,
  onCloseNoteDraft,
  onSaveNoteDraft,
  onUpdateNote,
  courseCode,
  onViewModeChange,
  onActivePanelChange,
  onLeftMaterialChange,
  onRightMaterialChange,
  onLeftZoomChange,
  onRightZoomChange,
  onLeftFitModeChange,
  onRightFitModeChange,
  onLeftPageChange,
  onRightPageChange,
  onDividerChange,
  onSwapPanels,
  onDeleteMaterial,
  ownerMenu,
}: StudyWorkspaceProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteTarget, setPaletteTarget] = useState<ActivePanel>('LEFT')
  const [leftPageCount, setLeftPageCount] = useState(1)
  const [rightPageCount, setRightPageCount] = useState(1)
  const dragging = useRef(false)
  const narrowApplied = useRef(false)

  const leftMaterial = board ? findMaterial(board, leftMaterialId) : null
  const rightMaterial = board ? findMaterial(board, rightMaterialId) : null
  const activeMaterial =
    activePanel === 'LEFT'
      ? leftMaterial
      : viewMode === 'DUAL'
        ? rightMaterial
        : leftMaterial

  const openPalette = useCallback(
    (target: ActivePanel = activePanel) => {
      setPaletteTarget(target)
      setPaletteOpen(true)
    },
    [activePanel],
  )

  useEffect(() => {
    if (!preferSingleOnNarrow || narrowApplied.current || !board) return
    if (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 767px)').matches) {
      onViewModeChange('SINGLE')
      narrowApplied.current = true
    }
  }, [board, preferSingleOnNarrow, onViewModeChange])

  const palettePinsKey =
    pinsStorageKey ??
    (board?.examPapers[0]?.courseId != null ? `course-${board.examPapers[0].courseId}` : 'review')

  const selectLeftMaterial = useCallback(
    (materialId: number | null) => {
      onLeftMaterialChange(materialId)
      onLeftPageChange(1)
      if (viewMode === 'DUAL' && materialId != null) {
        onRightMaterialChange(null)
        onRightPageChange(1)
      }
    },
    [viewMode, onLeftMaterialChange, onLeftPageChange, onRightMaterialChange, onRightPageChange],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openPalette(activePanel)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activePanel, openPalette])

  function startDividerDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    dragging.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveDivider(clientX: number, container: HTMLDivElement) {
    const rect = container.getBoundingClientRect()
    const next = ((clientX - rect.left) / rect.width) * 100
    onDividerChange(Math.min(75, Math.max(25, next)))
  }

  function onDividerPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return
    moveDivider(event.clientX, event.currentTarget.parentElement as HTMLDivElement)
  }

  function onDividerPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    dragging.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function downloadMaterial(material: ReturnType<typeof findMaterial>) {
    if (!material) return
    window.open(materialDownloadUrl(material.id), '_blank')
  }

  const paletteMaterialId = paletteTarget === 'LEFT' ? leftMaterialId : rightMaterialId
  const materialCount = board ? flattenMaterialBoard(board).length : 0

  function renderPanel(side: ActivePanel) {
    const isLeft = side === 'LEFT'
    const material = isLeft ? leftMaterial : rightMaterial
    const oppositeHasSource =
      (isLeft ? rightMaterial : leftMaterial) != null && onAskAi != null
    const showAskAiChoice = !material && oppositeHasSource && aiSourcePanel == null && noteDraft == null
    const askFromOpposite: ActivePanel = isLeft ? 'RIGHT' : 'LEFT'
    const canAskFromThisPanel = material != null && onAskAi != null
    const relatedExamId =
      material && board ? resolveRelatedExamMaterialId(material, board) : null
    const canAddRelated =
      relatedExamId != null && onAddRelatedMaterial != null
    const canAddNote = relatedExamId != null && onAddNote != null
    const noteParentTitle =
      material?.materialType === 'NOTE' && material.parentExamMaterialId != null && board
        ? findMaterial(board, material.parentExamMaterialId)?.title
        : undefined

    return (
      <ViewerPanel
        material={material}
        active={activePanel === side}
        materialSubtitle={
          material ? `${material.title} · ${materialTypeLabel(material)}` : undefined
        }
        zoom={isLeft ? leftZoom : rightZoom}
        fitMode={isLeft ? leftFitMode : rightFitMode}
        page={isLeft ? leftPage : rightPage}
        pageCount={isLeft ? leftPageCount : rightPageCount}
        readOnly={readOnly}
        emptyMessage={
          showAskAiChoice
            ? 'Compare another document or ask AI about the page open on the other side.'
            : materialCount === 0
              ? 'No official materials published for this course yet.'
              : 'Choose a document to start studying.'
        }
        emptySecondaryLabel={showAskAiChoice ? 'Ask AI' : undefined}
        onEmptySecondary={showAskAiChoice ? () => onAskAi?.(askFromOpposite) : undefined}
        onActivate={() => onActivePanelChange(side)}
        onChangeMaterial={() => openPalette(side)}
        onAskAi={canAskFromThisPanel ? () => onAskAi?.(side) : undefined}
        onAddMaterial={
          canAddRelated ? () => onAddRelatedMaterial(relatedExamId, side) : undefined
        }
        onAddNote={canAddNote ? () => onAddNote(relatedExamId, side) : undefined}
        noteParentTitle={noteParentTitle ?? undefined}
        noteSaving={noteSaving}
        noteError={noteError}
        allowPublicNotes={allowPublicNotes}
        onUpdateNote={
          material?.materialType === 'NOTE' && onUpdateNote
            ? (payload) => onUpdateNote(material.id, payload)
            : undefined
        }
        onZoomChange={isLeft ? onLeftZoomChange : onRightZoomChange}
        onFitModeChange={isLeft ? onLeftFitModeChange : onRightFitModeChange}
        onPageChange={isLeft ? onLeftPageChange : onRightPageChange}
        onPageCountChange={isLeft ? setLeftPageCount : setRightPageCount}
        onDownload={() => downloadMaterial(material)}
        canDelete={canRemoveMaterialToTrash(material, readOnly, workspaceUserCourseId)}
        removeFromTrashLabel={
          material?.official ? 'Remove official material from workspace' : 'Move my material to trash'
        }
        onDeleteMaterial={
          material && onDeleteMaterial ? () => onDeleteMaterial(material, side) : undefined
        }
      />
    )
  }

  function renderAiOverlay(sourceSide: ActivePanel) {
    const sourceMaterial = sourceSide === 'LEFT' ? leftMaterial : rightMaterial
    const sourcePage = sourceSide === 'LEFT' ? leftPage : rightPage
    const companionMaterial = sourceSide === 'LEFT' ? rightMaterial : leftMaterial
    const companionPage = sourceSide === 'LEFT' ? rightPage : leftPage
    const coveredSide: ActivePanel = sourceSide === 'LEFT' ? 'RIGHT' : 'LEFT'

    if (!sourceMaterial || !workspaceUserCourseId || !onCloseAi) return renderPanel(coveredSide)

    return (
      <AiWorkspacePanel
        key={`${sourceMaterial.id}-${sourcePage}`}
        userCourseId={workspaceUserCourseId}
        sourceMaterial={sourceMaterial}
        sourcePage={sourcePage}
        rightMaterial={companionMaterial}
        rightPage={companionPage}
        courseCode={courseCode}
        onChooseMaterial={() => openPalette(coveredSide)}
        onClose={onCloseAi}
      />
    )
  }

  function renderNoteDraftOverlay(session: NoteDraftSession) {
    if (!onCloseNoteDraft || !onSaveNoteDraft) {
      return renderPanel(session.sourcePanel === 'LEFT' ? 'RIGHT' : 'LEFT')
    }
    return (
      <NoteWorkspacePanel
        key={`draft-${session.parentExamMaterialId}-${session.sourcePanel}`}
        parentExamTitle={session.parentExamTitle}
        allowPublic={allowPublicNotes}
        saving={noteSaving}
        error={noteError}
        onSave={onSaveNoteDraft}
        onClose={onCloseNoteDraft}
      />
    )
  }

  function renderSide(side: ActivePanel) {
    const noteCoversThisSide =
      noteDraft != null && (noteDraft.sourcePanel === 'LEFT' ? 'RIGHT' : 'LEFT') === side
    if (noteCoversThisSide && noteDraft) {
      return renderNoteDraftOverlay(noteDraft)
    }
    const aiCoversThisSide =
      aiSourcePanel != null && (aiSourcePanel === 'LEFT' ? 'RIGHT' : 'LEFT') === side
    if (aiCoversThisSide) {
      return renderAiOverlay(aiSourcePanel)
    }
    return renderPanel(side)
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden overscroll-contain bg-slate-950 text-slate-100">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-800 px-3 py-2">
        <Link to={backTo} className="shrink-0 text-sm text-sky-300 hover:text-sky-200">
          ← {backLabel}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{title}</p>
          {modeLabel || subtitle ? (
            <p className="truncate text-xs text-slate-500">
              {modeLabel ? `${modeLabel}${subtitle ? ' · ' : ''}` : ''}
              {subtitle ?? ''}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onSwapPanels ? (
            <button
              type="button"
              disabled={viewMode !== 'DUAL'}
              onClick={onSwapPanels}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              title={
                viewMode === 'DUAL'
                  ? 'Mirror swap: materials, zoom, page, and panel width'
                  : 'Switch to Dual view to swap panels'
              }
              aria-label="Swap panels"
            >
              Swap
            </button>
          ) : null}
          <select
            value={viewMode}
            onChange={(event) => onViewModeChange(event.target.value as WorkspaceViewMode)}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
            aria-label="View mode"
          >
            <option value="SINGLE">Single</option>
            <option value="DUAL">Dual</option>
          </select>
        </div>

        {viewMode === 'SINGLE' ? (
          <div className="flex rounded-md border border-slate-700 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onActivePanelChange('LEFT')}
              className={`rounded px-2 py-1 ${
                activePanel === 'LEFT' ? 'bg-sky-500/20 text-sky-200' : 'text-slate-400'
              }`}
            >
              Left
            </button>
            <button
              type="button"
              onClick={() => onActivePanelChange('RIGHT')}
              className={`rounded px-2 py-1 ${
                activePanel === 'RIGHT' ? 'bg-sky-500/20 text-sky-200' : 'text-slate-400'
              }`}
            >
              Right
            </button>
          </div>
        ) : null}

        {headerRight}
        {ownerMenu}
      </header>

      {reviewGuide ? <ReviewGuideBar guide={reviewGuide} /> : null}

      {statusMessage ? (
        <div
          className={`shrink-0 border-b px-3 py-1.5 text-xs ${
            statusIsError
              ? 'border-rose-500/20 bg-rose-500/10 text-rose-100'
              : 'border-slate-700 bg-slate-900/80 text-slate-300'
          }`}
        >
          {statusMessage}
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1 overflow-hidden overscroll-contain">
        {!board ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Loading workspace...
          </div>
        ) : materialCount === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-lg font-medium text-white">No study materials yet</p>
            <p className="max-w-md text-sm text-slate-400">
              When materials are published, open an exam paper on the left and its solution on the right.
              Use Change material to browse exam papers and course materials.
            </p>
            <button
              type="button"
              onClick={() => openPalette('LEFT')}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
            >
              Change material
            </button>
          </div>
        ) : viewMode === 'SINGLE' ? (
          <div className="flex h-full w-full min-w-0">
            {renderSide(activePanel)}
          </div>
        ) : (
          <div
            className="grid h-full w-full min-w-0 overflow-hidden"
            style={{
              gridTemplateColumns: `${dividerPosition}fr 12px ${100 - dividerPosition}fr`,
            }}
          >
            <div className="flex h-full min-w-0 flex-col overflow-hidden">
              {renderSide('LEFT')}
            </div>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-valuenow={dividerPosition}
              aria-label="Resize panels"
              className="group relative z-10 flex cursor-col-resize items-center justify-center bg-slate-900 hover:bg-sky-500/10"
              onPointerDown={startDividerDrag}
              onPointerMove={onDividerPointerMove}
              onPointerUp={onDividerPointerUp}
            >
              <div className="h-16 w-1.5 rounded-full bg-slate-600 group-hover:bg-sky-400" />
            </div>
            <div className="flex h-full min-w-0 flex-col overflow-hidden">
              {renderSide('RIGHT')}
            </div>
          </div>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-500">
        <span>
          {aiSourcePanel && (aiSourcePanel === 'LEFT' ? leftMaterial : rightMaterial)
            ? `Ask AI · ${(aiSourcePanel === 'LEFT' ? leftMaterial : rightMaterial)!.title} · page ${
                aiSourcePanel === 'LEFT' ? leftPage : rightPage
              }`
            : `${activePanel === 'LEFT' ? 'Left' : 'Right'} panel active${
                activeMaterial ? ` · ${activeMaterial.title}` : ''
              }${activeMaterial ? ` · page ${activePanel === 'LEFT' ? leftPage : rightPage}` : ''}`}
        </span>
        <span>← → pages · Copy text for selection · Ctrl+K change material · drag center to resize</span>
      </footer>

      {board ? (
        <MaterialPalette
          open={paletteOpen}
          board={board}
          selectedMaterialId={paletteMaterialId}
          otherPanelMaterialId={
            viewMode === 'DUAL'
              ? paletteTarget === 'LEFT'
                ? rightMaterialId
                : leftMaterialId
              : null
          }
          otherPanelSideLabel={paletteTarget === 'LEFT' ? 'Right' : 'Left'}
          panelLabel={paletteTarget === 'LEFT' ? 'Left panel' : 'Right panel'}
          pinsStorageKey={palettePinsKey}
          showLinkedSolutionAction={paletteTarget === 'LEFT' && viewMode === 'DUAL'}
          onSelect={(materialId) => {
            if (paletteTarget === 'LEFT') {
              selectLeftMaterial(materialId)
            } else {
              onRightMaterialChange(materialId)
              onRightPageChange(1)
            }
            setPaletteOpen(false)
          }}
          onSelectLinkedSolution={(solutionId) => {
            onRightMaterialChange(solutionId)
            onRightPageChange(1)
            setPaletteOpen(false)
          }}
          onClose={() => setPaletteOpen(false)}
        />
      ) : null}
    </div>
  )
}

export function WorkspaceOwnerMenu({
  onAddMaterial,
  onManageMaterials,
  onTrash,
  onShare,
}: {
  onAddMaterial: () => void
  onManageMaterials: () => void
  onTrash: () => void
  onShare: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-md border border-slate-700 px-2 py-1 text-sm text-slate-300 hover:bg-slate-800"
        aria-label="Workspace actions"
      >
        ⋮
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[11rem] rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800"
            onClick={() => {
              onAddMaterial()
              setOpen(false)
            }}
          >
            Add my material
          </button>
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800"
            onClick={() => {
              onManageMaterials()
              setOpen(false)
            }}
          >
            My materials
          </button>
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800"
            onClick={() => {
              onTrash()
              setOpen(false)
            }}
          >
            Trash
          </button>
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800"
            onClick={() => {
              onShare()
              setOpen(false)
            }}
          >
            Share
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  destructive = false,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  destructive?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={busy ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-base font-medium text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-300">{message}</p>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
              destructive
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function WorkspaceDialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/50 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-medium text-white">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  )
}

export const MATERIAL_TYPE_OPTIONS: { value: MaterialType; label: string }[] = [
  { value: 'EXAM_PAPER', label: 'Exam paper' },
  { value: 'SOLUTION', label: 'Solution' },
  { value: 'LEARNING_MATERIAL', label: 'Learning material' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'OTHER', label: 'Other' },
]

export { DEFAULT_DIVIDER }
