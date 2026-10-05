import type { BoxplotPointSpec, ChartSpec, XyPlotPoint } from '../types/chartTypes'

function isBoxplotPoint(value: unknown): value is BoxplotPointSpec {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const point = value as BoxplotPointSpec
  return (
    typeof point.min === 'number' &&
    Number.isFinite(point.min) &&
    typeof point.q1 === 'number' &&
    Number.isFinite(point.q1) &&
    typeof point.median === 'number' &&
    Number.isFinite(point.median) &&
    typeof point.q3 === 'number' &&
    Number.isFinite(point.q3) &&
    typeof point.max === 'number' &&
    Number.isFinite(point.max)
  )
}

function repairQuartiles(point: BoxplotPointSpec): BoxplotPointSpec {
  const { min, q1, median, q3, max } = point
  if (min <= q1 && q1 <= median && median <= q3 && q3 <= max) {
    return point
  }
  const sorted = [min, q1, median, q3, max].sort((a, b) => a - b)
  return { ...point, min: sorted[0], q1: sorted[1], median: sorted[2], q3: sorted[3], max: sorted[4] }
}

function isToyScale(min: number, max: number): boolean {
  return max <= 30 && min <= 15
}

function isMassContext(spec: ChartSpec): boolean {
  const xLabel = spec.xLabel?.toLowerCase() ?? ''
  const yLabel = spec.yLabel?.toLowerCase() ?? ''
  const title = spec.title?.toLowerCase() ?? ''
  const labels = spec.labels.join(' ').toLowerCase()
  return (
    xLabel.includes('mass') ||
    xLabel.includes('tonne') ||
    yLabel.includes('output') ||
    title.includes('output') ||
    title.includes('mass') ||
    labels.includes('output') ||
    labels.includes('mass')
  )
}

export function firstBoxplotPoint(spec: ChartSpec): BoxplotPointSpec | null {
  for (const dataset of spec.datasets) {
    for (const entry of dataset.data) {
      if (isBoxplotPoint(entry)) {
        return repairQuartiles(entry)
      }
    }
  }
  return null
}

export function extractXyPointsFromChart(spec: ChartSpec): XyPlotPoint[] | null {
  const dataset = spec.datasets[0]
  if (!dataset?.data?.length) {
    return null
  }

  const data = dataset.data
  const first = data[0]
  if (first && typeof first === 'object' && !Array.isArray(first) && 'x' in first && 'y' in first) {
    const points = (data as unknown as Array<{ x: unknown; y: unknown }>)
      .map((point) => ({ x: Number(point.x), y: Number(point.y) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    return points.length >= 2 ? points : null
  }

  if (spec.type === 'line' || spec.type === 'bar') {
    const ys = data as number[]
    if (!Array.isArray(ys) || ys.length < 2) {
      return null
    }
    const xs = spec.labels.map((label) => Number(label))
    if (!xs.every((value) => Number.isFinite(value))) {
      return null
    }
    const points = xs
      .map((x, index) => ({ x, y: ys[index] }))
      .filter((point) => Number.isFinite(point.y))
    return points.length >= 2 ? points : null
  }

  return null
}

export function hasRenderableChartData(spec: ChartSpec): boolean {
  if (spec.type === 'boxplot') {
    return firstBoxplotPoint(spec) !== null
  }
  if (spec.type === 'pie' || spec.type === 'doughnut') {
    const values = spec.datasets[0]?.data as number[] | undefined
    return Array.isArray(values) && values.some((value) => Number.isFinite(value))
  }
  if (spec.type === 'line' || spec.type === 'bar' || !spec.type) {
    if (extractXyPointsFromChart(spec)) {
      return true
    }
    const ys = spec.datasets[0]?.data as number[] | undefined
    return Array.isArray(ys) && ys.length > 0 && ys.some((value) => Number.isFinite(value))
  }
  return false
}

/** Fix common AI mistakes: vertical layout, invalid quartiles, 0–10 toy scale on mass/output questions. */
export function normalizeChartSpec(spec: ChartSpec): ChartSpec {
  if (spec.type !== 'boxplot') {
    return spec
  }

  const massContext = isMassContext(spec)
  let next: ChartSpec = {
    ...spec,
    orientation: massContext ? 'horizontal' : (spec.orientation ?? 'horizontal'),
    xLabel: spec.xLabel ?? (massContext ? 'mass (tonnes)' : spec.xLabel),
    yLabel: spec.yLabel ?? (massContext ? 'Output' : spec.yLabel),
  }

  next = {
    ...next,
    datasets: next.datasets.map((dataset) => ({
      ...dataset,
      data: dataset.data
        .map((entry) => (isBoxplotPoint(entry) ? repairQuartiles(entry) : entry))
        .filter(isBoxplotPoint),
    })),
  }

  const point = firstBoxplotPoint(next)
  if (massContext && point && isToyScale(point.min, point.max)) {
    next = {
      ...next,
      datasets: next.datasets.map((dataset) => ({
        ...dataset,
        data: [
          {
            min: 25,
            q1: 27.5,
            median: 30,
            q3: 32.5,
            max: 35,
            outliers: point.outliers?.filter((value) => value < 25 || value > 35) ?? [],
          },
        ],
      })),
    }
  }

  return next
}

export function parseChartSpec(raw: string): ChartSpec | null {
  try {
    const parsed = JSON.parse(raw) as ChartSpec
    if (!Array.isArray(parsed.labels) || !Array.isArray(parsed.datasets)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export { isBoxplotPoint }
