import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Material } from '../../../api/materials'
import { MaterialPreview } from '../../workspace/components/MaterialPreview'

interface AdminMaterialPreviewDialogProps {
  material: Material | null
  onClose: () => void
}

export function AdminMaterialPreviewDialog({ material, onClose }: AdminMaterialPreviewDialogProps) {
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)

  useEffect(() => {
    setPage(1)
    setPageCount(1)
  }, [material?.id])

  useEffect(() => {
    if (!material) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [material, onClose])

  if (!material) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-material-preview-title"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-sky-300">Preview</p>
            <h2 id="admin-material-preview-title" className="truncate text-lg font-medium text-white">
              {material.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {material.materialType.replace(/_/g, ' ')}
              {material.originalFilename ? ` · ${material.originalFilename}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close preview"
          >
            ×
          </button>
        </div>

        <div className="h-[65vh] min-h-[420px] overflow-hidden bg-slate-950">
          <MaterialPreview
            material={material}
            page={page}
            zoom={1}
            fitMode="width"
            onPageChange={setPage}
            onPageCountChange={setPageCount}
          />
        </div>

        {pageCount > 1 ? (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-800 px-4 py-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-200 disabled:opacity-40"
            >
              Previous
            </button>
            <p className="text-sm text-slate-400">
              Page {page} of {pageCount}
            </p>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
