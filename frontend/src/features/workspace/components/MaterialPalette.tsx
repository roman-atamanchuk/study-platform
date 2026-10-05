import { useEffect, useMemo, useRef, useState } from 'react'
import type { Material, MaterialBoard } from '../../../api/materials'
import { findLinkedSolution, findMaterial } from '../../course-review/utils/defaultPairing'
import { MaterialPaletteLegend } from './ReviewGuideBar'
import { readPinnedMaterialIds, togglePinnedMaterialId } from '../utils/materialPins'
import { materialPickerBadge } from '../utils/materialLabels'
import { buildCourseWideMaterials, buildExamTrees, collectPersonalMaterials, type ExamTreeNode } from '../utils/materialTree'

type PaletteFilter = 'ALL' | 'EXAMS' | 'COURSE' | 'MINE'

interface MaterialPaletteProps {
  open: boolean
  board: MaterialBoard
  selectedMaterialId: number | null
  otherPanelMaterialId?: number | null
  otherPanelSideLabel?: string
  panelLabel: string
  pinsStorageKey: string
  showLinkedSolutionAction?: boolean
  onSelect: (materialId: number) => void
  onSelectLinkedSolution?: (solutionId: number) => void
  onClose: () => void
}

function matchesQuery(material: Material, normalized: string): boolean {
  if (!normalized) return true
  return (
    material.title.toLowerCase().includes(normalized) ||
    String(material.year ?? '').includes(normalized)
  )
}

function filterTree(trees: ExamTreeNode[], normalized: string): ExamTreeNode[] {
  return trees
    .map((tree) => {
      const examMatches = matchesQuery(tree.exam, normalized)
      const children = tree.children.filter((child) => matchesQuery(child, normalized))
      if (examMatches || children.length > 0) {
        return { exam: tree.exam, children: examMatches ? tree.children : children }
      }
      return null
    })
    .filter((tree): tree is ExamTreeNode => tree != null)
}

function childKindLabel(material: Material): string | null {
  return materialPickerBadge(material)
}

function MaterialRow({
  material,
  selected,
  nested = false,
  pinned = false,
  onOtherPanel = false,
  onTogglePin,
  onSelect,
}: {
  material: Material
  selected: boolean
  nested?: boolean
  pinned?: boolean
  onOtherPanel?: boolean
  onTogglePin?: () => void
  onSelect: (materialId: number) => void
}) {
  const isPersonal = !material.official
  const kindLabel = childKindLabel(material)

  return (
    <div className="flex items-center gap-1">
      {onTogglePin ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onTogglePin()
          }}
          className={`shrink-0 rounded px-1 py-2 text-xs ${
            pinned ? 'text-amber-300 hover:text-amber-200' : 'text-slate-600 hover:text-slate-400'
          }`}
          aria-label={pinned ? 'Unpin material' : 'Pin material'}
          title={pinned ? 'Unpin' : 'Pin'}
        >
          {pinned ? '★' : '☆'}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onSelect(material.id)}
        className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-md border py-2 pr-3 text-left transition ${
          nested ? 'py-1.5 text-[13px]' : 'text-sm font-medium'
        } ${
          onOtherPanel
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-50'
            : 'border-transparent'
        } ${
          selected
            ? nested
              ? 'bg-sky-500/10 text-sky-100'
              : 'bg-sky-500/15 text-sky-100'
            : onOtherPanel
              ? ''
              : nested
                ? 'text-slate-300 hover:bg-slate-800/80'
                : 'text-slate-100 hover:bg-slate-800'
        }`}
      >
        <span
          className={`shrink-0 rounded-full ${
            nested ? 'h-1.5 w-1.5' : 'h-2 w-2'
          } ${
            selected
              ? 'bg-sky-400'
              : isPersonal
                ? 'border border-emerald-500/70 bg-emerald-500/10'
                : 'border border-slate-500 bg-slate-800'
          }`}
        />
        <span className="min-w-0 flex-1 truncate">{material.title}</span>
        {kindLabel ? (
          <span
            className={`shrink-0 text-[10px] uppercase tracking-wide ${
              isPersonal ? 'text-emerald-400/90' : 'text-slate-500'
            }`}
          >
            {kindLabel}
          </span>
        ) : null}
        {!nested && material.year ? (
          <span className="shrink-0 text-xs text-slate-500">{material.year}</span>
        ) : null}
      </button>
    </div>
  )
}

const FILTER_OPTIONS: { value: PaletteFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'EXAMS', label: 'Exams' },
  { value: 'COURSE', label: 'Course materials' },
  { value: 'MINE', label: 'Mine' },
]

export function MaterialPalette({
  open,
  board,
  selectedMaterialId,
  otherPanelMaterialId = null,
  otherPanelSideLabel = 'Other',
  panelLabel,
  pinsStorageKey,
  showLinkedSolutionAction = false,
  onSelect,
  onSelectLinkedSolution,
  onClose,
}: MaterialPaletteProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<PaletteFilter>('ALL')
  const [expandedExams, setExpandedExams] = useState<Set<number>>(new Set())
  const [pinnedIds, setPinnedIds] = useState<number[]>(() => readPinnedMaterialIds(pinsStorageKey))
  const inputRef = useRef<HTMLInputElement>(null)

  const examTrees = useMemo(() => buildExamTrees(board), [board])
  const courseWide = useMemo(() => buildCourseWideMaterials(board), [board])
  const personalMaterials = useMemo(() => collectPersonalMaterials(board), [board])

  useEffect(() => {
    setPinnedIds(readPinnedMaterialIds(pinsStorageKey))
  }, [pinsStorageKey, open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setFilter('ALL')
      return
    }
    setExpandedExams(new Set(examTrees.map((tree) => tree.exam.id)))
    inputRef.current?.focus()
  }, [open, examTrees])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const normalized = query.trim().toLowerCase()
  const filteredTrees = useMemo(() => filterTree(examTrees, normalized), [examTrees, normalized])
  const filteredCourseWide = useMemo(
    () => courseWide.filter((material) => matchesQuery(material, normalized)),
    [courseWide, normalized],
  )
  const filteredMine = useMemo(
    () => personalMaterials.filter((material) => matchesQuery(material, normalized)),
    [personalMaterials, normalized],
  )

  const pinnedMaterials = useMemo(() => {
    const all = [
      ...examTrees.map((tree) => tree.exam),
      ...examTrees.flatMap((tree) => tree.children),
      ...courseWide,
      ...personalMaterials,
    ]
    const seen = new Set<number>()
    return pinnedIds
      .map((id) => all.find((material) => material.id === id))
      .filter((material): material is Material => {
        if (!material || seen.has(material.id)) return false
        seen.add(material.id)
        return matchesQuery(material, normalized)
      })
  }, [pinnedIds, examTrees, courseWide, personalMaterials, normalized])

  const showExams = filter === 'ALL' || filter === 'EXAMS'
  const showCourse = filter === 'ALL' || filter === 'COURSE'
  const showMine = filter === 'ALL' || filter === 'MINE'

  const nothingVisible =
    pinnedMaterials.length === 0 &&
    (showExams ? filteredTrees.length : 0) === 0 &&
    (showCourse ? filteredCourseWide.length : 0) === 0 &&
    (showMine ? filteredMine.length : 0) === 0

  function handleTogglePin(materialId: number) {
    setPinnedIds(togglePinnedMaterialId(pinsStorageKey, materialId))
  }

  const otherPanelMaterial =
    otherPanelMaterialId != null ? findMaterial(board, otherPanelMaterialId) : null

  function isOnOtherPanel(materialId: number): boolean {
    return otherPanelMaterialId != null && materialId === otherPanelMaterialId
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Change material"
        className="flex max-h-[min(75vh,680px)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-800 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Change material · {panelLabel}</p>
          {otherPanelMaterial ? (
            <p className="mt-1 truncate text-[11px] text-slate-400">
              {otherPanelSideLabel} panel:{' '}
              <span className="text-slate-300">{otherPanelMaterial.title}</span>
            </p>
          ) : null}
          <input
            ref={inputRef}
            type="search"
            placeholder="Search materials..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-sky-400 focus:ring"
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-md px-2 py-1 text-xs ${
                  filter === option.value
                    ? 'bg-sky-500/20 text-sky-200'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <MaterialPaletteLegend />
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {nothingVisible ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">No materials match your search.</p>
          ) : null}

          {pinnedMaterials.length > 0 ? (
            <section className="mb-3">
              <h3 className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300/90">
                Pinned
              </h3>
              <ul className="space-y-0.5">
                {pinnedMaterials.map((material) => (
                  <li key={`pin-${material.id}`}>
                    <MaterialRow
                      material={material}
                      selected={material.id === selectedMaterialId}
                      pinned
                      onOtherPanel={isOnOtherPanel(material.id)}
                      onTogglePin={() => handleTogglePin(material.id)}
                      onSelect={(id) => {
                        onSelect(id)
                        onClose()
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {showExams && filteredTrees.length > 0 ? (
            <section className="mb-3">
              <h3 className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-300">Exam papers</h3>
              <ul className="space-y-2">
                {filteredTrees.map((tree) => {
                  const expanded = expandedExams.has(tree.exam.id)
                  const hasChildren = tree.children.length > 0
                  const linkedSolution = findLinkedSolution(board, tree.exam)
                  return (
                    <li
                      key={tree.exam.id}
                      className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/50"
                    >
                      <div className="flex items-stretch gap-0.5 px-1 py-0.5">
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedExams((current) => {
                                const next = new Set(current)
                                if (next.has(tree.exam.id)) next.delete(tree.exam.id)
                                else next.add(tree.exam.id)
                                return next
                              })
                            }
                            className="mt-1 flex w-7 shrink-0 items-start justify-center rounded px-1 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            aria-label={expanded ? 'Collapse' : 'Expand'}
                          >
                            {expanded ? '▾' : '▸'}
                          </button>
                        ) : (
                          <span className="w-7 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1 py-0.5">
                          <MaterialRow
                            material={tree.exam}
                            selected={tree.exam.id === selectedMaterialId}
                            pinned={pinnedIds.includes(tree.exam.id)}
                            onOtherPanel={isOnOtherPanel(tree.exam.id)}
                            onTogglePin={() => handleTogglePin(tree.exam.id)}
                            onSelect={(id) => {
                              onSelect(id)
                              onClose()
                            }}
                          />
                        </div>
                        {showLinkedSolutionAction && linkedSolution && onSelectLinkedSolution ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectLinkedSolution(linkedSolution.id)
                              onClose()
                            }}
                            className="mt-1 shrink-0 self-start rounded-md border border-slate-700 px-2 py-1.5 text-[11px] text-sky-300 hover:bg-slate-800"
                            title={`Open solution: ${linkedSolution.title}`}
                          >
                            Solution →
                          </button>
                        ) : null}
                      </div>
                      {expanded && hasChildren ? (
                        <div className="border-t border-slate-800/80 bg-slate-900/40 px-2 pb-2 pt-1">
                          <p className="mb-1 pl-9 text-[10px] uppercase tracking-wide text-slate-500">
                            Linked to {tree.exam.title}
                          </p>
                          <ul className="ml-7 space-y-0.5 border-l-2 border-sky-500/25 pl-3">
                            {tree.children.map((child) => (
                              <li key={child.id} className="relative">
                                <span
                                  aria-hidden
                                  className="absolute -left-3 top-[0.85rem] h-px w-2.5 bg-sky-500/25"
                                />
                                <MaterialRow
                                  material={child}
                                  selected={child.id === selectedMaterialId}
                                  nested
                                  pinned={pinnedIds.includes(child.id)}
                                  onOtherPanel={isOnOtherPanel(child.id)}
                                  onTogglePin={() => handleTogglePin(child.id)}
                                  onSelect={(id) => {
                                    onSelect(id)
                                    onClose()
                                  }}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}

          {showCourse && filteredCourseWide.length > 0 ? (
            <section className="mb-3">
              <h3 className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-300">
                Course materials
              </h3>
              <ul className="space-y-0.5">
                {filteredCourseWide.map((material) => (
                  <li key={material.id}>
                    <MaterialRow
                      material={material}
                      selected={material.id === selectedMaterialId}
                      pinned={pinnedIds.includes(material.id)}
                      onOtherPanel={isOnOtherPanel(material.id)}
                      onTogglePin={() => handleTogglePin(material.id)}
                      onSelect={(id) => {
                        onSelect(id)
                        onClose()
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {showMine && filteredMine.length > 0 ? (
            <section className="mb-3">
              <h3 className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
                My materials
              </h3>
              <ul className="space-y-0.5">
                {filteredMine.map((material) => (
                  <li key={material.id}>
                    <MaterialRow
                      material={material}
                      selected={material.id === selectedMaterialId}
                      pinned={pinnedIds.includes(material.id)}
                      onOtherPanel={isOnOtherPanel(material.id)}
                      onTogglePin={() => handleTogglePin(material.id)}
                      onSelect={(id) => {
                        onSelect(id)
                        onClose()
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="border-t border-slate-800 px-4 py-2 text-xs text-slate-500">Esc to close</div>
      </div>
    </div>
  )
}
