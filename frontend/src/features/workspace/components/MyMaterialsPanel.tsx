import { useCallback, useEffect, useState } from 'react'
import {
  fetchMaterials,
  isImageMaterial,
  updateMaterialVisibility,
  type Material,
  type MaterialVisibility,
} from '../../../api/materials'
import { WorkspaceDialog } from './StudyWorkspace'

interface MyMaterialsPanelProps {
  open: boolean
  userCourseId: number
  examPapers?: Material[]
  refreshKey?: number
  onClose: () => void
  onChanged: () => void
  onDeleteMaterial: (material: Material) => void
  onPreviewMaterial: (material: Material) => void
}

import { useAuthStore } from '../../../stores/authStore'

export function MyMaterialsPanel({
  open,
  userCourseId,
  examPapers = [],
  refreshKey = 0,
  onClose,
  onChanged,
  onDeleteMaterial,
  onPreviewMaterial,
}: MyMaterialsPanelProps) {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'ADMIN'
  const [materials, setMaterials] = useState<Material[]>([])
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const all = await fetchMaterials(userCourseId)
      setMaterials(all.filter((material) => !material.official))
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load materials')
    }
  }, [userCourseId])

  useEffect(() => {
    if (open) {
      void reload()
    }
  }, [open, reload, refreshKey])

  function materialScopeLabel(material: Material): string {
    if (material.materialType === 'NOTE') {
      const exam = examPapers.find((paper) => paper.id === material.parentExamMaterialId)
      return exam ? `Note · ${exam.title}` : 'Note · Linked to exam'
    }
    if (material.materialType === 'VIDEO' || material.videoId) {
      if (material.parentExamMaterialId == null) return 'YouTube video · Course materials'
      const exam = examPapers.find((paper) => paper.id === material.parentExamMaterialId)
      if (exam) return `YouTube video · ${exam.title}`
      return 'YouTube video · Linked to exam'
    }
    if (isImageMaterial(material)) {
      if (material.parentExamMaterialId == null) return 'Image · Course materials'
      const exam = examPapers.find((paper) => paper.id === material.parentExamMaterialId)
      if (exam) return `Image · ${exam.title}`
      return 'Image · Linked to exam'
    }
    if (material.materialType === 'MY_MATERIAL') {
      if (material.parentExamMaterialId == null) return 'My material · Course materials'
      const exam = examPapers.find((paper) => paper.id === material.parentExamMaterialId)
      if (exam) {
        return `My material · ${exam.title}`
      }
      return 'My material · Linked to exam'
    }
    return material.materialType.replaceAll('_', ' ').toLowerCase()
  }

  async function handleVisibility(material: Material, visibility: MaterialVisibility) {
    try {
      await updateMaterialVisibility(material.id, visibility)
      await reload()
      onChanged()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  return (
    <WorkspaceDialog open={open} title="My materials" onClose={onClose}>
      <p className="text-sm text-slate-400">
        Your uploads only. Shared is the default — included when you share this course. Private hides from shared views.
      </p>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      <ul className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
        {materials.length === 0 ? (
          <li className="text-sm text-slate-500">No personal uploads yet.</li>
        ) : null}
        {materials.map((material) => (
          <li key={material.id} className="rounded-lg border border-slate-800 px-3 py-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-white">{material.title}</p>
                <p className="text-xs text-slate-500">{materialScopeLabel(material)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={material.visibility}
                  onChange={(e) => void handleVisibility(material, e.target.value as MaterialVisibility)}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                >
                  {isAdmin ? <option value="PUBLIC">Public</option> : null}
                  <option value="SHARED">Shared</option>
                  <option value="PRIVATE">Private</option>
                </select>
                <button
                  type="button"
                  onClick={() => onPreviewMaterial(material)}
                  className="text-xs text-sky-300 hover:text-sky-200"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteMaterial(material)}
                  className="text-xs text-rose-300 hover:text-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </WorkspaceDialog>
  )
}
