export interface AiKnownLookingForBlock {
  type: 'known_looking_for_table'
  known?: Array<{ label: string; value: string }>
  lookingFor?: string
}

export interface AiContingencyTableBlock {
  type: 'contingency_table'
  title?: string
  columns: string[]
  rows: Array<Array<string | number>>
  highlight?: Array<{ row: string; column: string }>
}

export interface AiProbabilityTreeBranch {
  id: string
  label: string
  probability: string
}

export interface AiProbabilityTreeBlock {
  type: 'probability_tree'
  title?: string
  rootLabel?: string
  levels: [
    { label?: string; branches: AiProbabilityTreeBranch[] },
    { label?: string; branchesByParent: Record<string, AiProbabilityTreeBranch[]> },
  ]
  highlightPaths?: string[][]
  notes?: string[]
}

export interface AiXyPlotPoint {
  x: number
  y: number
}

export interface AiXyPlotHighlight {
  x: number
  y: number
  label?: string
}

export interface AiXyPlotBlock {
  type: 'xy_plot_block'
  title?: string
  xLabel?: string
  yLabel?: string
  equation?: string
  points: AiXyPlotPoint[]
  highlights?: AiXyPlotHighlight[]
  notes?: string[]
  connect?: boolean
}

export interface AiHistogramBin {
  label: string
  frequency: number
}

export interface AiHistogramBlock {
  type: 'histogram_block'
  title?: string
  xLabel?: string
  yLabel?: string
  bins: AiHistogramBin[]
  notes?: string[]
}

export interface AiScatterplotBlock {
  type: 'scatterplot_block'
  title?: string
  xLabel?: string
  yLabel?: string
  points: AiXyPlotPoint[]
  notes?: string[]
}

export interface AiRegressionLine {
  slope: number
  intercept: number
}

export interface AiRegressionBlock {
  type: 'regression_block'
  title?: string
  xLabel?: string
  yLabel?: string
  equation?: string
  points?: AiXyPlotPoint[]
  xRange?: { min: number; max: number }
  line?: AiRegressionLine
  notes?: string[]
}

export interface AiBoxplotBlock {
  type: 'boxplot_block'
  title?: string
  label?: string
  xLabel?: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers?: number[]
  notes?: string[]
}

export interface AiStepByStepBlock {
  type: 'step_by_step_block'
  steps: string[]
}

export interface AiFinalAnswerBlock {
  type: 'final_answer_block'
  content: string
}

export type AiVisualBlock =
  | AiKnownLookingForBlock
  | AiContingencyTableBlock
  | AiProbabilityTreeBlock
  | AiXyPlotBlock
  | AiHistogramBlock
  | AiScatterplotBlock
  | AiRegressionBlock
  | AiBoxplotBlock
  | AiStepByStepBlock
  | AiFinalAnswerBlock

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isXyPoint(value: unknown): value is AiXyPlotPoint {
  if (!value || typeof value !== 'object') {
    return false
  }
  const point = value as AiXyPlotPoint
  return isFiniteNumber(point.x) && isFiniteNumber(point.y)
}

function isBranch(value: unknown): value is AiProbabilityTreeBranch {
  if (!value || typeof value !== 'object') {
    return false
  }
  const branch = value as AiProbabilityTreeBranch
  return (
    typeof branch.id === 'string' &&
    typeof branch.label === 'string' &&
    typeof branch.probability === 'string'
  )
}

export function isKnownLookingForBlock(block: AiVisualBlock): block is AiKnownLookingForBlock {
  return block.type === 'known_looking_for_table'
}

export function isContingencyTableBlock(block: AiVisualBlock): block is AiContingencyTableBlock {
  return block.type === 'contingency_table'
}

export function isXyPlotBlock(block: AiVisualBlock): block is AiXyPlotBlock {
  if (block.type !== 'xy_plot_block') {
    return false
  }
  const highlights = block.highlights
  const notes = block.notes
  return (
    Array.isArray(block.points) &&
    block.points.length >= 2 &&
    block.points.every(isXyPoint) &&
    (highlights === undefined ||
      (Array.isArray(highlights) &&
        highlights.every(
          (point) =>
            isXyPoint(point) && (point.label === undefined || typeof point.label === 'string'),
        ))) &&
    (notes === undefined || (Array.isArray(notes) && notes.every((note) => typeof note === 'string')))
  )
}

export function isProbabilityTreeBlock(block: AiVisualBlock): block is AiProbabilityTreeBlock {
  if (block.type !== 'probability_tree') {
    return false
  }
  const first = block.levels?.[0]
  const second = block.levels?.[1]
  if (!first?.branches?.every(isBranch) || !second?.branchesByParent) {
    return false
  }
  return Object.values(second.branchesByParent).every(
    (branches) => Array.isArray(branches) && branches.every(isBranch),
  )
}

export function isHistogramBlock(block: AiVisualBlock): block is AiHistogramBlock {
  if (block.type !== 'histogram_block') {
    return false
  }
  return (
    Array.isArray(block.bins) &&
    block.bins.length > 0 &&
    block.bins.every(
      (bin) => typeof bin.label === 'string' && isFiniteNumber(bin.frequency) && bin.frequency >= 0,
    )
  )
}

export function isScatterplotBlock(block: AiVisualBlock): block is AiScatterplotBlock {
  if (block.type !== 'scatterplot_block') {
    return false
  }
  return Array.isArray(block.points) && block.points.length > 0 && block.points.every(isXyPoint)
}

export function isRegressionBlock(block: AiVisualBlock): block is AiRegressionBlock {
  if (block.type !== 'regression_block') {
    return false
  }
  const points = block.points
  const line = block.line
  const xRange = block.xRange
  const hasValidPoints =
    points === undefined || (Array.isArray(points) && points.every(isXyPoint))
  const hasValidLine =
    line === undefined ||
    (isFiniteNumber(line.slope) && isFiniteNumber(line.intercept))
  const hasValidXRange =
    xRange === undefined ||
    (isFiniteNumber(xRange.min) && isFiniteNumber(xRange.max) && xRange.min < xRange.max)
  const hasContent =
    Boolean(points?.length) ||
    line !== undefined ||
    typeof block.equation === 'string' ||
    Boolean(block.notes?.length)
  return hasValidPoints && hasValidLine && hasValidXRange && hasContent
}

export function isBoxplotBlock(block: AiVisualBlock): block is AiBoxplotBlock {
  if (block.type !== 'boxplot_block') {
    return false
  }
  return (
    isFiniteNumber(block.min) &&
    isFiniteNumber(block.q1) &&
    isFiniteNumber(block.median) &&
    isFiniteNumber(block.q3) &&
    isFiniteNumber(block.max)
  )
}

export function isStepByStepBlock(block: AiVisualBlock): block is AiStepByStepBlock {
  return (
    block.type === 'step_by_step_block' &&
    Array.isArray(block.steps) &&
    block.steps.length > 0 &&
    block.steps.every((step) => typeof step === 'string' && step.trim().length > 0)
  )
}

export function isFinalAnswerBlock(block: AiVisualBlock): block is AiFinalAnswerBlock {
  return (
    block.type === 'final_answer_block' &&
    typeof block.content === 'string' &&
    block.content.trim().length > 0
  )
}
