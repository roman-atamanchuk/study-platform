export interface BoxplotPointSpec {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers?: number[]
}

export interface XyPlotPoint {
  x: number
  y: number
}

export interface XyPlotHighlight {
  x: number
  y: number
  label?: string
}

export interface XyPlotSpec {
  title?: string
  xLabel?: string
  yLabel?: string
  equation?: string
  points: XyPlotPoint[]
  highlights?: XyPlotHighlight[]
  notes?: string[]
  connect?: boolean
}

export interface ChartDatasetSpec {
  label?: string
  data: number[] | BoxplotPointSpec[] | number[][]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
}

export interface ChartSpec {
  type?: 'bar' | 'line' | 'pie' | 'doughnut' | 'boxplot'
  title?: string
  xLabel?: string
  yLabel?: string
  orientation?: 'horizontal' | 'vertical'
  source?: string
  notes?: string[]
  labels: string[]
  datasets: ChartDatasetSpec[]
}
