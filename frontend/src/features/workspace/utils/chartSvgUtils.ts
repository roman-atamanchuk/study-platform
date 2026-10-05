export function formatTick(value: number): string {
  if (Number.isInteger(value)) {
    return String(value)
  }
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '')
}

export function buildTicks(min: number, max: number, count = 5): number[] {
  if (min === max) {
    return [min]
  }
  const step = (max - min) / Math.max(count - 1, 1)
  const ticks: number[] = []
  for (let index = 0; index < count; index += 1) {
    ticks.push(min + step * index)
  }
  return Array.from(new Set(ticks.map((value) => Math.round(value * 1000) / 1000))).sort(
    (a, b) => a - b,
  )
}

export function domainWithPadding(
  min: number,
  max: number,
  ratio = 0.08,
): { min: number; max: number; range: number } {
  if (min === max) {
    return { min: min - 1, max: max + 1, range: 2 }
  }
  const padding = (max - min) * ratio
  const paddedMin = min - padding
  const paddedMax = max + padding
  return { min: paddedMin, max: paddedMax, range: paddedMax - paddedMin || 1 }
}
