const PIN_PREFIX = 'study-platform:pinned-materials:'

export function readPinnedMaterialIds(storageKey: string): number[] {
  try {
    const raw = localStorage.getItem(PIN_PREFIX + storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is number => typeof id === 'number')
  } catch {
    return []
  }
}

export function writePinnedMaterialIds(storageKey: string, ids: number[]): void {
  localStorage.setItem(PIN_PREFIX + storageKey, JSON.stringify(ids))
}

export function togglePinnedMaterialId(storageKey: string, materialId: number): number[] {
  const current = readPinnedMaterialIds(storageKey)
  const next = current.includes(materialId)
    ? current.filter((id) => id !== materialId)
    : [...current, materialId]
  writePinnedMaterialIds(storageKey, next)
  return next
}
