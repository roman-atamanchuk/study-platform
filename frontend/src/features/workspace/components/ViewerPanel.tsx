import { useEffect, useRef, useState } from 'react'
import { isPdfMaterial, type Material, type MaterialVisibility } from '../../../api/materials'
import { BrowserPdfViewer } from './BrowserPdfViewer'
import type { PdfFitMode } from './PdfViewer'
import { MaterialPreview } from './MaterialPreview'
import { NoteWorkspacePanel } from './NoteWorkspacePanel'

export type PanelViewerMode = 'study' | 'browser'

interface ViewerPanelProps {
  material: Material | null
  active: boolean
  zoom: number
  fitMode: PdfFitMode
  page: number
  pageCount: number
  readOnly?: boolean
  canDelete?: boolean
  removeFromTrashLabel?: string
  emptyMessage?: string
  emptySecondaryLabel?: string
  onEmptySecondary?: () => void
  materialSubtitle?: string
  onActivate: () => void
  onChangeMaterial: () => void
  onAskAi?: () => void
  onAddMaterial?: () => void
  onAddNote?: () => void
  onDeleteMaterial?: () => void
  noteParentTitle?: string
  noteSaving?: boolean
  noteError?: string | null
  allowPublicNotes?: boolean
  onUpdateNote?: (payload: {
    title: string
    htmlBody: string
    visibility: MaterialVisibility
  }) => void | Promise<void>
  onZoomChange: (zoom: number) => void
  onFitModeChange: (mode: PdfFitMode) => void
  onPageChange: (page: number) => void
  onPageCountChange: (count: number) => void
  onDownload?: () => void
}

export function ViewerPanel({
  material,
  active,
  zoom,
  fitMode,
  page,
  pageCount,
  canDelete = false,
  removeFromTrashLabel = 'Delete my material',
  emptyMessage,
  emptySecondaryLabel,
  onEmptySecondary,
  materialSubtitle,
  onActivate,
  onChangeMaterial,
  onAskAi,
  onAddMaterial,
  onAddNote,
  onDeleteMaterial,
  noteParentTitle,
  noteSaving = false,
  noteError = null,
  allowPublicNotes = false,
  onUpdateNote,
  onZoomChange,
  onFitModeChange,
  onPageChange,
  onPageCountChange,
  onDownload,
}: ViewerPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [materialMenuOpen, setMaterialMenuOpen] = useState(false)
  const [fitRevision, setFitRevision] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [viewerMode, setViewerMode] = useState<PanelViewerMode>('study')
  const [editingNote, setEditingNote] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const materialMenuRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setFitRevision(0)
    setViewerMode('study')
    setEditingNote(false)
  }, [material?.id])

  const isNote = material?.materialType === 'NOTE'
  const showBrowserToggle = material != null && isPdfMaterial(material) && !isNote
  const browserMode = viewerMode === 'browser' && showBrowserToggle
  const showPdfControls = material != null && !browserMode && !isNote && !editingNote

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !material || browserMode) return
    viewport.scrollTop = 0
    viewport.scrollLeft = 0
  }, [page, material?.id, browserMode])

  useEffect(() => {
    const node = viewportRef.current
    if (!node || browserMode) return

    function onWheel(event: WheelEvent) {
      const target = event.currentTarget
      if (!(target instanceof HTMLDivElement)) return
      if (Math.abs(event.deltaX) < 1) return
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return

      const { scrollLeft, scrollWidth, clientWidth } = target
      const maxScrollLeft = Math.max(0, scrollWidth - clientWidth)
      if (maxScrollLeft <= 0) {
        event.preventDefault()
        return
      }

      const atLeft = scrollLeft <= 0
      const atRight = scrollLeft >= maxScrollLeft - 1
      if ((event.deltaX < 0 && atLeft) || (event.deltaX > 0 && atRight)) {
        event.preventDefault()
      }
    }

    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [material?.id, browserMode])

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    let frame = 0
    const measure = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        setViewportWidth(node.clientWidth)
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [material?.id, browserMode])

  function applyFitWidth() {
    onFitModeChange('width')
    onZoomChange(1)
    setFitRevision((value) => value + 1)
  }

  function zoomOut() {
    if (fitMode === 'width') {
      onFitModeChange('custom')
      onZoomChange(0.9)
      return
    }
    onZoomChange(Math.max(0.5, Math.round((zoom - 0.1) * 10) / 10))
  }

  function zoomIn() {
    if (fitMode === 'width') {
      onFitModeChange('custom')
      onZoomChange(1.1)
      return
    }
    onZoomChange(Math.min(2.5, Math.round((zoom + 0.1) * 10) / 10))
  }

  function stopPanelActivation(event: React.MouseEvent | React.PointerEvent) {
    event.stopPropagation()
  }

  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [menuOpen])

  useEffect(() => {
    if (!materialMenuOpen) return
    function onPointerDown(event: MouseEvent) {
      if (materialMenuRef.current && !materialMenuRef.current.contains(event.target as Node)) {
        setMaterialMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [materialMenuOpen])

  const showMaterialDropdown =
    material != null && (onAskAi != null || onAddMaterial != null || onAddNote != null)

  function handleDeleteClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (!material || !onDeleteMaterial) return
    onDeleteMaterial()
    setMenuOpen(false)
  }

  const deleteButton =
    canDelete && material && onDeleteMaterial ? (
      <button
        type="button"
        onMouseDown={stopPanelActivation}
        onClick={handleDeleteClick}
        className="relative z-10 rounded px-2 py-1 text-rose-300 hover:bg-rose-500/15 hover:text-rose-200"
        title={removeFromTrashLabel}
        aria-label={removeFromTrashLabel}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m2 0V5a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
      </button>
    ) : null

  return (
    <div
      className={`flex min-h-0 min-w-0 flex-1 flex-col bg-slate-950 transition-shadow ${
        active ? 'ring-2 ring-inset ring-sky-400' : 'ring-1 ring-inset ring-slate-800'
      }`}
      onMouseDown={onActivate}
    >
      <div
        className="relative z-10 flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-2 py-1.5"
        onMouseDown={stopPanelActivation}
      >
        {showMaterialDropdown ? (
          <div className="relative" ref={materialMenuRef}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setMaterialMenuOpen((open) => !open)
              }}
              className="rounded-md bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-200 hover:bg-sky-500/25"
              aria-expanded={materialMenuOpen}
              aria-haspopup="menu"
            >
              Change material ▾
            </button>
            {materialMenuOpen ? (
              <div
                role="menu"
                className="absolute left-0 top-full z-20 mt-1 min-w-[11rem] rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl"
              >
                {onAskAi ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-1.5 text-left text-sm text-violet-200 hover:bg-slate-800"
                    onClick={() => {
                      onAskAi()
                      setMaterialMenuOpen(false)
                    }}
                  >
                    Ask AI
                  </button>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800"
                  onClick={() => {
                    onChangeMaterial()
                    setMaterialMenuOpen(false)
                  }}
                >
                  Change material…
                </button>
                {onAddMaterial ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800"
                    onClick={() => {
                      onAddMaterial()
                      setMaterialMenuOpen(false)
                    }}
                  >
                    Add material
                  </button>
                ) : null}
                {onAddNote ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800"
                    onClick={() => {
                      onAddNote()
                      setMaterialMenuOpen(false)
                    }}
                  >
                    Add note
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onChangeMaterial()
            }}
            className="rounded-md bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-200 hover:bg-sky-500/25"
          >
            Change material
          </button>
        )}

        {showBrowserToggle ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setViewerMode((mode) => (mode === 'study' ? 'browser' : 'study'))
            }}
            className={`rounded-md px-2 py-1 text-xs font-medium hover:bg-slate-800 ${
              browserMode ? 'bg-emerald-500/20 text-emerald-200' : 'text-slate-300'
            }`}
            title={
              browserMode
                ? 'Switch to study view (zoom and dual-panel scroll)'
                : 'Switch to browser PDF for text selection and copy'
            }
          >
            {browserMode ? 'Study view' : 'Copy text'}
          </button>
        ) : null}

        {showPdfControls ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!material || page <= 1}
            onClick={(event) => {
              event.stopPropagation()
              onPageChange(page - 1)
            }}
            className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            title="Previous page"
          >
            ‹
          </button>
          <span className="min-w-[4.5rem] text-center text-xs text-slate-400">
            {material ? `${page} / ${pageCount}` : '—'}
          </span>
          <button
            type="button"
            disabled={!material || page >= pageCount}
            onClick={(event) => {
              event.stopPropagation()
              onPageChange(page + 1)
            }}
            className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            title="Next page"
          >
            ›
          </button>
        </div>
        ) : browserMode ? (
          <span className="text-xs text-emerald-300/90">Select text in the PDF below</span>
        ) : null}

        <div className="ml-auto flex items-center gap-1">
          {isNote && onUpdateNote && !editingNote ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setEditingNote(true)
              }}
              className="rounded-md border border-slate-600 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              Edit
            </button>
          ) : null}
          {showPdfControls ? (
            <>
              <button
                type="button"
                disabled={!material}
                onClick={applyFitWidth}
                className={`rounded px-2 py-1 text-xs hover:bg-slate-800 disabled:opacity-40 ${
                  fitMode === 'width' ? 'bg-sky-500/20 text-sky-200' : 'text-slate-300'
                }`}
                title="Fit to width"
              >
                Fit
              </button>
              <button
                type="button"
                disabled={!material}
                onClick={zoomOut}
                className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                title="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                disabled={!material}
                onClick={applyFitWidth}
                className={`w-10 rounded px-1 py-1 text-center text-xs hover:bg-slate-800 disabled:opacity-40 ${
                  fitMode === 'width' ? 'text-sky-200' : 'text-slate-400'
                }`}
                title="Fit to width"
              >
                {fitMode === 'width' ? 'Fit' : `${Math.round(zoom * 100)}%`}
              </button>
              <button
                type="button"
                disabled={!material}
                onClick={zoomIn}
                className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                title="Zoom in"
              >
                +
              </button>
            </>
          ) : null}

          {deleteButton}

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              disabled={!material}
              onClick={(event) => {
                event.stopPropagation()
                setMenuOpen((open) => !open)
              }}
              className="rounded px-2 py-1 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              aria-label="More actions"
            >
              ⋮
            </button>
            {menuOpen && material ? (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
                {!isNote ? (
                  <button
                    type="button"
                    className="block w-full px-3 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800"
                    onClick={() => {
                      onDownload?.()
                      setMenuOpen(false)
                    }}
                  >
                    Download
                  </button>
                ) : null}
                {showPdfControls ? (
                  <button
                    type="button"
                    className="block w-full px-3 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800"
                    onClick={() => {
                      applyFitWidth()
                      setMenuOpen(false)
                    }}
                  >
                    Fit to width
                  </button>
                ) : null}
                {canDelete && onDeleteMaterial ? (
                  <button
                    type="button"
                    className="block w-full px-3 py-1.5 text-left text-sm text-rose-300 hover:bg-slate-800"
                    onClick={handleDeleteClick}
                  >
                    {removeFromTrashLabel}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {material && materialSubtitle && !editingNote ? (
        <div className="shrink-0 truncate border-b border-slate-800/50 bg-slate-900/40 px-3 py-1 text-xs text-slate-400">
          {materialSubtitle}
        </div>
      ) : null}

      <div
        ref={viewportRef}
        className={`relative min-h-0 flex-1 overscroll-contain bg-slate-950 ${
          browserMode || (isNote && editingNote) ? 'overflow-hidden' : 'overflow-auto'
        }`}
      >
        {!material ? (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <div>
              <p className="text-sm text-slate-400">{emptyMessage ?? 'No document loaded'}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onChangeMaterial()
                  }}
                  className="rounded-lg bg-sky-500/20 px-3 py-1.5 text-sm text-sky-200 hover:bg-sky-500/30"
                >
                  Choose material
                </button>
                {onEmptySecondary && emptySecondaryLabel ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onEmptySecondary()
                    }}
                    className="rounded-lg bg-violet-500/20 px-3 py-1.5 text-sm text-violet-200 hover:bg-violet-500/30"
                  >
                    {emptySecondaryLabel}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : isNote && editingNote && onUpdateNote ? (
          <NoteWorkspacePanel
            key={`edit-note-${material.id}`}
            embedded
            parentExamTitle={noteParentTitle ?? 'exam'}
            existingMaterial={material}
            initialTitle={material.title}
            initialHtml={material.htmlBody ?? ''}
            initialVisibility={material.visibility}
            allowPublic={allowPublicNotes}
            saving={noteSaving}
            error={noteError}
            onSave={(payload) => {
              void Promise.resolve(onUpdateNote(payload)).then(
                () => setEditingNote(false),
                () => undefined,
              )
            }}
            onClose={() => setEditingNote(false)}
          />
        ) : browserMode ? (
          <BrowserPdfViewer material={material} page={page} />
        ) : (
          <MaterialPreview
            material={material}
            page={page}
            zoom={zoom}
            fitMode={fitMode}
            fitRevision={fitRevision}
            viewportWidth={viewportWidth}
            onPageChange={onPageChange}
            onPageCountChange={onPageCountChange}
          />
        )}
      </div>
    </div>
  )
}
