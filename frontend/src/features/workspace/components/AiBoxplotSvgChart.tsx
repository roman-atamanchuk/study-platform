import type { BoxplotPointSpec, ChartSpec } from '../types/chartTypes'
import { firstBoxplotPoint, normalizeChartSpec } from '../utils/chartNormalization'
import { AiChartNotes } from './AiChartNotes'

const SVG_WIDTH = 400
const SVG_HEIGHT = 168
const AXIS_START = 52
const AXIS_END = 348
const TRACK_Y = 68
const BOX_HEIGHT = 36
const DOMAIN_PADDING_RATIO = 0.08

function formatTick(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function xFor(value: number, domainMin: number, domainRange: number): number {
  return AXIS_START + ((value - domainMin) / domainRange) * (AXIS_END - AXIS_START)
}

export function AiBoxplotSvgChart({ spec }: { spec: ChartSpec }) {
  const normalized = normalizeChartSpec(spec)
  const point = firstBoxplotPoint(normalized)
  if (!point) {
    return (
      <p className="py-4 text-center text-xs text-rose-300">
        Boxplot data is incomplete — need min, Q1, median, Q3, and max.
      </p>
    )
  }

  const label = normalized.labels[0] ?? normalized.datasets[0]?.label ?? 'Distribution'
  const axisLabel = normalized.xLabel ?? 'Value'
  const outliers = point.outliers ?? []
  const plotted = [point.min, point.q1, point.median, point.q3, point.max, ...outliers]
  const rawMin = Math.min(...plotted)
  const rawMax = Math.max(...plotted)
  const rawRange = rawMax - rawMin
  const padding = rawRange > 0 ? rawRange * DOMAIN_PADDING_RATIO : 1
  const domainMin = rawMin - padding
  const domainMax = rawMax + padding
  const domainRange = domainMax - domainMin || 1

  const minX = xFor(point.min, domainMin, domainRange)
  const q1X = xFor(point.q1, domainMin, domainRange)
  const medX = xFor(point.median, domainMin, domainRange)
  const q3X = xFor(point.q3, domainMin, domainRange)
  const maxX = xFor(point.max, domainMin, domainRange)
  const boxTop = TRACK_Y - BOX_HEIGHT / 2
  const boxBottom = TRACK_Y + BOX_HEIGHT / 2

  const tickValues = [
    { label: 'Min' as const, value: point.min },
    { label: 'Q1' as const, value: point.q1 },
    { label: 'Median' as const, value: point.median },
    { label: 'Q3' as const, value: point.q3 },
    { label: 'Max' as const, value: point.max },
  ]

  const valueOffsets = new Map<number, number>()
  tickValues.forEach((tick) => {
    valueOffsets.set(tick.value, (valueOffsets.get(tick.value) ?? 0) + 1)
  })

  const valueSeen = new Map<number, number>()

  return (
    <div className="min-w-0 max-w-full overflow-x-auto">
      {normalized.title ? (
        <p className="mb-2 text-sm font-medium text-violet-100">{normalized.title}</p>
      ) : null}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="h-auto w-full max-w-full"
        role="img"
        aria-label={normalized.title ?? 'Boxplot'}
      >
        <line x1={AXIS_START} y1={TRACK_Y} x2={AXIS_END} y2={TRACK_Y} stroke="rgba(148,163,184,0.35)" strokeWidth={1} />

        <line x1={minX} y1={TRACK_Y} x2={q1X} y2={TRACK_Y} stroke="#a78bfa" strokeWidth={2} />
        <line x1={q3X} y1={TRACK_Y} x2={maxX} y2={TRACK_Y} stroke="#a78bfa" strokeWidth={2} />
        <line x1={minX} y1={boxTop + 6} x2={minX} y2={boxBottom - 6} stroke="#a78bfa" strokeWidth={2} />
        <line x1={maxX} y1={boxTop + 6} x2={maxX} y2={boxBottom - 6} stroke="#a78bfa" strokeWidth={2} />

        <rect
          x={Math.min(q1X, q3X)}
          y={boxTop}
          width={Math.abs(q3X - q1X) || 2}
          height={BOX_HEIGHT}
          fill="rgba(139,92,246,0.32)"
          stroke="#a78bfa"
          strokeWidth={2}
          rx={3}
        />
        <line x1={medX} y1={boxTop} x2={medX} y2={boxBottom} stroke="#f8fafc" strokeWidth={2} />

        {outliers.map((value, index) => {
          const ox = xFor(value, domainMin, domainRange)
          return (
            <circle
              key={`${value}-${index}`}
              cx={ox}
              cy={TRACK_Y}
              r={4}
              fill="#06b6d4"
              stroke="#67e8f9"
              strokeWidth={1}
            />
          )
        })}

        {tickValues.map((tick, index) => {
          const baseX = xFor(tick.value, domainMin, domainRange)
          const duplicates = valueOffsets.get(tick.value) ?? 1
          const seen = valueSeen.get(tick.value) ?? 0
          valueSeen.set(tick.value, seen + 1)
          const stagger =
            duplicates > 1 ? (seen - (duplicates - 1) / 2) * 14 : 0
          const tickX = baseX + stagger

          return (
            <g key={`${tick.label}-${index}`}>
              <line
                x1={baseX}
                y1={TRACK_Y + 4}
                x2={baseX}
                y2={TRACK_Y + 10}
                stroke="rgba(148,163,184,0.5)"
                strokeWidth={1}
              />
              <text x={tickX} y={TRACK_Y + 24} textAnchor="middle" fill="#64748b" fontSize={9} fontWeight={600}>
                {tick.label}
              </text>
              <text x={tickX} y={TRACK_Y + 36} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                {formatTick(tick.value)}
              </text>
            </g>
          )
        })}

        <text x={24} y={TRACK_Y + 4} textAnchor="start" fill="#e2e8f0" fontSize={11}>
          {label}
        </text>
        <text x={(AXIS_START + AXIS_END) / 2} y={SVG_HEIGHT - 8} textAnchor="middle" fill="#cbd5e1" fontSize={11}>
          {axisLabel}
        </text>
      </svg>
      <AiChartNotes notes={normalized.notes} />
    </div>
  )
}

export type { BoxplotPointSpec }
