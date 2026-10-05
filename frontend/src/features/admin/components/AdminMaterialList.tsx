import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  deleteOfficialMaterial,
  fetchAdminCourseMaterials,
  updateOfficialMaterialVisibility,
} from '../../../api/admin'
import type { Material, MaterialVisibility } from '../../../api/materials'
import { courseReviewMaterialUrl } from '../../course-review/utils/reviewNavigation'
const visibilityClass: Record<string, string> = {
  PUBLIC: 'bg-emerald-500/15 text-emerald-300',
  SHARED: 'bg-sky-500/15 text-sky-300',
  PRIVATE: 'bg-slate-700 text-slate-300',
}

interface AdminMaterialListProps {
  courseId: number | null
  compact?: boolean
  onChanged?: () => void
}

export function AdminMaterialList({ courseId, compact = false, onChanged }: AdminMaterialListProps) {
  const navigate = useNavigate()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reload = useCallback(async () => {
    if (courseId == null) {
      setMaterials([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      setMaterials(await fetchAdminCourseMaterials(courseId))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load materials')
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    void reload()
  }, [reload])

  async function handleDelete(material: Material) {
    const confirmed = window.confirm(`Delete "${material.title}"?\n\nThis cannot be undone.`)
    if (!confirmed) return
    try {
      await deleteOfficialMaterial(material.id)
      await reload()
      onChanged?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function handleVisibilityChange(material: Material, visibility: MaterialVisibility) {
    try {
      await updateOfficialMaterialVisibility(material.id, visibility)
      await reload()
      onChanged?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update visibility failed')
    }
  }

  function openInReview(material: Material) {
    if (courseId == null || material.visibility !== 'PUBLIC') return
    navigate(courseReviewMaterialUrl(courseId, material.id))
  }

  function stopRowClick(event: React.MouseEvent | React.KeyboardEvent) {
    event.stopPropagation()
  }

  if (courseId == null) {
    return <p className="text-sm text-slate-500">Select a course to manage materials.</p>
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-400">Loading materials…</p> : null}

      {!loading && materials.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
          No official materials for this course yet.
        </p>
      ) : null}

      {materials.length > 0 ? (
        <p className="text-xs text-slate-500">
          {materials.length} material{materials.length === 1 ? '' : 's'}
          {materials.length > 6 ? ' · scroll the list below' : ''}
          {' · click a public material to open in course review'}
        </p>
      ) : null}

      <div
        className={
          compact
            ? 'max-h-72 overflow-y-auto rounded-lg border border-slate-800/60 pr-1'
            : 'max-h-[min(60vh,560px)] overflow-y-auto rounded-lg border border-slate-800/60 pr-1'
        }
      >
        <ul className="space-y-2 p-1">
        {materials.map((material) => {
          const canOpenInReview = material.visibility === 'PUBLIC'
          return (
          <li
            key={material.id}
            role={canOpenInReview ? 'button' : undefined}
            tabIndex={canOpenInReview ? 0 : undefined}
            onClick={() => openInReview(material)}
            onKeyDown={(event) => {
              if (!canOpenInReview) return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openInReview(material)
              }
            }}
            className={`flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-800 px-3 py-3 ${
              canOpenInReview ? 'cursor-pointer hover:border-slate-700 hover:bg-slate-800/40' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-white">{material.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs ${visibilityClass[material.visibility] ?? visibilityClass.PRIVATE}`}>
                  {material.visibility}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {material.materialType.replace('_', ' ')}
                {material.year != null ? ` · ${material.year}` : ''}
                {material.originalFilename ? ` · ${material.originalFilename}` : ''}
              </p>
            </div>
            <div
              className="flex shrink-0 flex-wrap items-center gap-2"
              onClick={stopRowClick}
              onKeyDown={stopRowClick}
            >
              <select
                value={material.visibility}
                onChange={(e) => void handleVisibilityChange(material, e.target.value as MaterialVisibility)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                aria-label={`Visibility for ${material.title}`}
              >
                <option value="PUBLIC">Public</option>
                <option value="SHARED">Shared</option>
                <option value="PRIVATE">Private</option>
              </select>
              <button
                type="button"
                onClick={() => void handleDelete(material)}
                className="rounded-lg border border-rose-500/50 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
              >
                Delete
              </button>
            </div>
          </li>
          )
        })}
        </ul>
      </div>

    </div>
  )
}
