import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  clearTrashMaterials,
  fetchTrashMaterials,
  permanentlyDeleteMaterial,
  restoreMaterial,
  type TrashMaterial,
} from '../../../api/materials'
import { ConfirmDialog, WorkspaceDialog } from './StudyWorkspace'

import { useAuthStore } from '../../../stores/authStore'

interface TrashMaterialsPanelProps {
  open: boolean
  userCourseId: number
  onClose: () => void
  onChanged?: () => void
}

function formatDeletedAt(value: string | null): string {
  if (!value) return 'Unknown time'
  return new Date(value).toLocaleString()
}

export function TrashMaterialsPanel({ open, userCourseId, onClose, onChanged }: TrashMaterialsPanelProps) {
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN')
  const [materials, setMaterials] = useState<TrashMaterial[]>([])
  const [error, setError] = useState<string | null>(null)
  const [clearError, setClearError] = useState<string | null>(null)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [pendingPurge, setPendingPurge] = useState<TrashMaterial | null>(null)
  const [purging, setPurging] = useState(false)
  const [purgeError, setPurgeError] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)

  const personalCount = useMemo(
    () => materials.filter((material) => material.canPermanentlyDelete).length,
    [materials],
  )

  const reload = useCallback(async () => {
    try {
      setMaterials(await fetchTrashMaterials(userCourseId))
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load trash')
    }
  }, [userCourseId])

  useEffect(() => {
    if (open) {
      void reload()
    }
  }, [open, reload])

  async function handleClearTrash() {
    setClearing(true)
    setClearError(null)
    try {
      await clearTrashMaterials(userCourseId)
      setMaterials((current) => current.filter((material) => !material.canPermanentlyDelete))
      setClearConfirmOpen(false)
      onChanged?.()
    } catch (err: unknown) {
      setClearError(err instanceof Error ? err.message : 'Failed to clear trash')
    } finally {
      setClearing(false)
    }
  }

  async function handleRestore(material: TrashMaterial) {
    setRestoringId(material.id)
    setError(null)
    try {
      await restoreMaterial(userCourseId, material.id)
      setMaterials((current) => current.filter((item) => item.id !== material.id))
      onChanged?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to restore material')
    } finally {
      setRestoringId(null)
    }
  }

  async function handlePurgeMaterial() {
    if (!pendingPurge) return
    setPurging(true)
    setPurgeError(null)
    try {
      await permanentlyDeleteMaterial(pendingPurge.id)
      setMaterials((current) => current.filter((item) => item.id !== pendingPurge.id))
      setPendingPurge(null)
      onChanged?.()
    } catch (err: unknown) {
      setPurgeError(err instanceof Error ? err.message : 'Failed to delete material')
    } finally {
      setPurging(false)
    }
  }

  return (
    <>
      <WorkspaceDialog open={open} title="Trash" onClose={onClose}>
        <p className="text-sm text-slate-400">
          {isAdmin
            ? 'Clear removes items permanently from the course catalog. Undo restores hidden official materials to your workspace.'
            : 'Your uploads can be cleared permanently. Official course materials can only be restored to your workspace.'}
        </p>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        {personalCount > 0 ? (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setClearConfirmOpen(true)}
              className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/10"
            >
              {isAdmin ? 'Clear trash' : 'Clear uploads'}
            </button>
          </div>
        ) : null}
        <ul className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
          {materials.length === 0 ? (
            <li className="text-sm text-slate-500">Trash is empty.</li>
          ) : null}
          {materials.map((material) => (
            <li key={material.id} className="rounded-lg border border-slate-800 px-3 py-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-white">{material.title}</p>
                    {material.official ? (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                        Official
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">{material.materialType.replace('_', ' ')}</p>
                  <p className="mt-1 text-xs text-slate-500">Removed {formatDeletedAt(material.trashedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={restoringId === material.id}
                    onClick={() => void handleRestore(material)}
                    className="text-xs text-emerald-300 hover:text-emerald-200 disabled:opacity-50"
                  >
                    {restoringId === material.id ? 'Restoring…' : 'Undo'}
                  </button>
                  {material.canPermanentlyDelete ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPurgeError(null)
                        setPendingPurge(material)
                      }}
                      className="text-xs text-rose-300 hover:text-rose-200"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </WorkspaceDialog>

      <ConfirmDialog
        open={clearConfirmOpen}
        title="Clear uploads from trash?"
        message={
          isAdmin
            ? `Permanently delete ${personalCount} item(s) from the course catalog? This cannot be undone.`
            : `Permanently delete ${personalCount} upload(s)? Official course materials in trash will stay until you undo them.`
        }
        confirmLabel={isAdmin ? 'Clear trash' : 'Clear uploads'}
        cancelLabel="Cancel"
        destructive
        busy={clearing}
        error={clearError}
        onConfirm={() => void handleClearTrash()}
        onCancel={() => {
          if (!clearing) {
            setClearConfirmOpen(false)
            setClearError(null)
          }
        }}
      />

      <ConfirmDialog
        open={pendingPurge != null}
        title="Delete permanently?"
        message={
          pendingPurge
            ? `Permanently delete "${pendingPurge.title}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Clear"
        cancelLabel="Cancel"
        destructive
        busy={purging}
        error={purgeError}
        onConfirm={() => void handlePurgeMaterial()}
        onCancel={() => {
          if (!purging) {
            setPendingPurge(null)
            setPurgeError(null)
          }
        }}
      />
    </>
  )
}
