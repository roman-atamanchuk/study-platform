import { lazy, Suspense, useMemo } from 'react'
import type { ChartSpec } from '../types/chartTypes'
import {
  extractXyPointsFromChart,
  hasRenderableChartData,
  normalizeChartSpec,
  parseChartSpec,
} from '../utils/chartNormalization'
import { buildPlotlyFigure, chartHeight, PLOTLY_CONFIG } from '../utils/plotlyChartBuilder'
import { AiBoxplotSvgChart } from './AiBoxplotSvgChart'
import { AiXyPlotChart } from './AiXyPlotChart'

export type { BoxplotPointSpec, ChartSpec } from '../types/chartTypes'

const Plot = lazy(async () => {
  const [plotlyModule, reactPlotlyModule] = await Promise.all([
    import('plotly.js-dist-min'),
    import('react-plotly.js/factory'),
  ])
  return { default: reactPlotlyModule.default(plotlyModule.default) }
})

function PlotlyChartInner({ spec }: { spec: ChartSpec }) {
  const normalized = useMemo(() => normalizeChartSpec(spec), [spec])
  const { data, layout } = useMemo(() => buildPlotlyFigure(normalized), [normalized])
  const height = chartHeight(normalized)

  return (
    <Plot
      data={data}
      layout={{ ...layout, height, autosize: true }}
      config={PLOTLY_CONFIG}
      useResizeHandler
      style={{ width: '100%', height }}
    />
  )
}

export function AiChartBlock({ spec, chart }: { spec?: string; chart?: ChartSpec }) {
  const parsed = chart ?? (spec ? parseChartSpec(spec) : null)
  if (!parsed) {
    return (
      <pre className="my-2 overflow-x-auto rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
        {spec ?? 'Invalid chart specification'}
      </pre>
    )
  }

  const normalized = normalizeChartSpec(parsed)

  if (normalized.type === 'boxplot') {
    return (
      <div className="my-3 min-w-0 max-w-full rounded-xl border border-violet-500/25 bg-black p-3">
        <AiBoxplotSvgChart spec={normalized} />
      </div>
    )
  }

  const xyPoints = extractXyPointsFromChart(normalized)
  if (xyPoints) {
    return (
      <div className="my-3 min-w-0 max-w-full rounded-xl border border-violet-500/25 bg-black p-3">
        <AiXyPlotChart
          spec={{
            title: normalized.title,
            xLabel: normalized.xLabel,
            yLabel: normalized.yLabel,
            points: xyPoints,
          }}
        />
      </div>
    )
  }

  if (!hasRenderableChartData(normalized)) {
    return (
      <div className="my-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
        <p className="text-xs text-rose-200">
          Chart data is incomplete — numeric values are missing for this graph.
        </p>
      </div>
    )
  }

  return (
    <div className="my-3 min-w-0 max-w-full rounded-xl border border-violet-500/25 bg-black p-3">
      <Suspense fallback={<p className="py-8 text-center text-xs text-slate-500">Loading chart…</p>}>
        <PlotlyChartInner spec={normalized} />
      </Suspense>
    </div>
  )
}
