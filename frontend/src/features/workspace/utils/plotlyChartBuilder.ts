import type { Config, Data, Layout } from 'plotly.js'
import type { BoxplotPointSpec, ChartSpec } from '../types/chartTypes'
import { extractXyPointsFromChart, isBoxplotPoint } from './chartNormalization'

const PALETTE = ['#8b5cf6', '#06b6d4', '#10b981', '#f472b6', '#fbbf24', '#60a5fa']

const PLOTLY_DARK_LAYOUT: Partial<Layout> = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(15, 23, 42, 0.55)',
  font: {
    color: '#cbd5e1',
    family: 'ui-sans-serif, system-ui, sans-serif',
    size: 12,
  },
  hoverlabel: {
    bgcolor: 'rgba(15, 23, 42, 0.96)',
    bordercolor: 'rgba(139, 92, 246, 0.45)',
    font: { color: '#f8fafc', size: 12 },
  },
}

export const PLOTLY_CONFIG: Partial<Config> = {
  displayModeBar: false,
  responsive: true,
  scrollZoom: false,
}

function axisStyle(title?: string): Partial<Layout['xaxis']> {
  return {
    title: title ? { text: title, standoff: 12 } : undefined,
    gridcolor: 'rgba(148, 163, 184, 0.14)',
    zerolinecolor: 'rgba(148, 163, 184, 0.25)',
    linecolor: 'rgba(148, 163, 184, 0.35)',
    tickfont: { color: '#94a3b8' },
  }
}

/** Spread five-number summary into points Plotly can box-plot accurately. */
function sampleFromSummary(point: BoxplotPointSpec): number[] {
  const values = [
    point.min,
    point.min,
    point.q1,
    point.q1,
    point.median,
    point.median,
    point.median,
    point.q3,
    point.q3,
    point.max,
    point.max,
    ...(point.outliers ?? []),
  ]
  return values
}

function buildBoxplotTraces(spec: ChartSpec): Data[] {
  const horizontal = spec.orientation !== 'vertical'
  const traces: Data[] = []

  spec.datasets.forEach((dataset, datasetIndex) => {
    dataset.data.forEach((entry, entryIndex) => {
      if (!isBoxplotPoint(entry)) {
        return
      }
      const label = spec.labels[entryIndex] ?? dataset.label ?? 'Distribution'
      const values = sampleFromSummary(entry)
      const color = PALETTE[datasetIndex % PALETTE.length]

      traces.push({
        type: 'box',
        name: dataset.label ?? label,
        orientation: horizontal ? 'h' : 'v',
        ...(horizontal
          ? { x: values, y: values.map(() => label) }
          : { y: values, x: values.map(() => label) }),
        marker: {
          color,
          outliercolor: '#06b6d4',
          line: { color: '#c4b5fd', width: 1.5 },
        },
        fillcolor: 'rgba(139, 92, 246, 0.32)',
        line: { color: '#a78bfa', width: 2 },
        boxmean: false,
        boxpoints: (entry.outliers?.length ?? 0) > 0 ? 'outliers' : false,
        hovertemplate:
          `<b>${label}</b><br>` +
          `Min: ${entry.min}<br>` +
          `Q1: ${entry.q1}<br>` +
          `Median: ${entry.median}<br>` +
          `Q3: ${entry.q3}<br>` +
          `Max: ${entry.max}<extra></extra>`,
      })
    })
  })

  return traces
}

function buildBarLineTraces(spec: ChartSpec, chartType: 'bar' | 'line'): { data: Data[]; layout: Partial<Layout> } {
  const xyPoints = extractXyPointsFromChart(spec)
  if (xyPoints) {
    const color = PALETTE[0]
    return {
      data: [
        {
          type: 'scatter',
          mode: 'lines+markers',
          name: spec.datasets[0]?.label ?? 'Series',
          x: xyPoints.map((point) => point.x),
          y: xyPoints.map((point) => point.y),
          line: { color, width: 2.5, shape: 'spline' },
          marker: { color, size: 6 },
        } satisfies Data,
      ],
      layout: {
        xaxis: { ...axisStyle(spec.xLabel), type: 'linear' },
        yaxis: axisStyle(spec.yLabel),
      },
    }
  }

  const data: Data[] = spec.datasets.map((dataset, index) => {
    const color = PALETTE[index % PALETTE.length]
    if (chartType === 'line') {
      return {
        type: 'scatter',
        mode: 'lines+markers',
        name: dataset.label ?? `Series ${index + 1}`,
        x: spec.labels,
        y: dataset.data as number[],
        line: { color, width: 2.5, shape: 'spline' },
        marker: { color, size: 7 },
        fill: 'tozeroy',
        fillcolor: `${color}22`,
      } satisfies Data
    }
    return {
      type: 'bar',
      name: dataset.label ?? `Series ${index + 1}`,
      x: spec.labels,
      y: dataset.data as number[],
      marker: { color, line: { color: '#e2e8f0', width: 0.5 } },
    } satisfies Data
  })

  return {
    data,
    layout: {
      xaxis: axisStyle(spec.xLabel),
      yaxis: axisStyle(spec.yLabel),
      barmode: 'group',
    },
  }
}

function buildPieTraces(spec: ChartSpec): Data[] {
  const dataset = spec.datasets[0]
  const values = (dataset?.data as number[]) ?? []
  return [
    {
      type: 'pie',
      labels: spec.labels,
      values,
      hole: spec.type === 'doughnut' ? 0.45 : 0,
      marker: {
        colors: PALETTE.slice(0, spec.labels.length),
        line: { color: '#0f172a', width: 2 },
      },
      textfont: { color: '#e2e8f0' },
      hovertemplate: '%{label}: %{value}<extra></extra>',
    },
  ]
}

export function buildPlotlyFigure(spec: ChartSpec): { data: Data[]; layout: Partial<Layout> } {
  const type = spec.type ?? 'bar'
  let data: Data[] = []
  let extraLayout: Partial<Layout> = {}

  if (type === 'boxplot') {
    data = buildBoxplotTraces(spec)
    const horizontal = spec.orientation !== 'vertical'
    extraLayout = horizontal
      ? { xaxis: axisStyle(spec.xLabel), yaxis: axisStyle(spec.yLabel) }
      : { xaxis: axisStyle(spec.xLabel), yaxis: axisStyle(spec.yLabel) }
  } else if (type === 'line' || type === 'bar') {
    const built = buildBarLineTraces(spec, type)
    data = built.data
    extraLayout = built.layout
  } else if (type === 'pie' || type === 'doughnut') {
    data = buildPieTraces(spec)
    extraLayout = { showlegend: true, legend: { orientation: 'h', y: -0.1 } }
  }

  const layout: Partial<Layout> = {
    ...PLOTLY_DARK_LAYOUT,
    ...extraLayout,
    title: spec.title
      ? { text: spec.title, font: { color: '#e2e8f0', size: 14 }, x: 0.02, xanchor: 'left' }
      : undefined,
    margin: { l: 56, r: 24, t: spec.title ? 48 : 28, b: 48 },
    showlegend: data.length > 1,
    legend: { font: { color: '#cbd5e1' } },
  }

  return { data, layout }
}

export function chartHeight(spec: ChartSpec): number {
  if (spec.type === 'boxplot') {
    return Math.max(260, 120 + spec.labels.length * 56)
  }
  if (spec.type === 'pie' || spec.type === 'doughnut') {
    return 320
  }
  return 340
}
