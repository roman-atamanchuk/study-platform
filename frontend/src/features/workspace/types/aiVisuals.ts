import type { ChartSpec } from './chartTypes'
import type { AiVisualBlock } from './aiVisualBlocks'

export type AiVisualSource = 'exam' | 'solution' | 'derived' | 'illustrative' | string

export interface AiDataTable {
  title?: string
  headers: string[]
  rows: string[][]
  source?: AiVisualSource
}

export interface AiFormulaVisual {
  name?: string
  latex: string
  source?: AiVisualSource
}

export interface AiVisualsPayload {
  tables?: AiDataTable[]
  charts?: ChartSpec[]
  formulas?: AiFormulaVisual[]
  blocks?: AiVisualBlock[]
}

export function parseAiVisuals(json: string | null | undefined): AiVisualsPayload | null {
  if (!json?.trim()) {
    return null
  }
  try {
    return JSON.parse(json) as AiVisualsPayload
  } catch {
    return null
  }
}

export function sourceLabel(source?: AiVisualSource): string | null {
  if (!source) {
    return null
  }
  switch (source) {
    case 'exam':
      return 'From exam page'
    case 'solution':
      return 'From official solution'
    case 'derived':
      return 'Derived from page data'
    case 'learning_material':
      return 'From learning materials'
    case 'illustrative':
      return 'Illustrative example'
    default:
      return source
  }
}
