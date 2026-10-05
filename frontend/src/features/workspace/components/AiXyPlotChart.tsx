import type { XyPlotSpec } from '../types/chartTypes'
import { buildTicks, domainWithPadding, formatTick } from '../utils/chartSvgUtils'
import { AiChartNotes } from './AiChartNotes'
import { AiLatexBlock } from './AiLatexBlock'

const SVG_WIDTH = 420
const SVG_HEIGHT = 260
const PAD_LEFT = 52
const PAD_RIGHT = 20
const PAD_TOP = 24
const PAD_BOTTOM = 52

export function AiXyPlotChart({ spec }: { spec: XyPlotSpec }) {
  const points = spec.points.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
  )
  if (points.length < 2) {
    return (
      <p className="py-4 text-center text-xs text-rose-300">
        Graph data is incomplete — need at least two numeric (x, y) points.
      </p>
    )
  }

  const sorted = [...points].sort((a, b) => a.x - b.x)
  const highlightPoints = (spec.highlights ?? []).filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
  )
  const allX = [...sorted.map((point) => point.x), ...highlightPoints.map((point) => point.x)]
  const allY = [...sorted.map((point) => point.y), ...highlightPoints.map((point) => point.y)]

  const rawXMin = Math.min(...allX)
  const rawXMax = Math.max(...allX)
  const rawYMin = Math.min(...allY)
  const rawYMax = Math.max(...allY)
  const xDomain = domainWithPadding(rawXMin, rawXMax)
  const yDomain = domainWithPadding(rawYMin, rawYMax)
  const xMin = xDomain.min
  const yMin = yDomain.min
  const xRange = xDomain.range
  const yRange = yDomain.range

  const chartLeft = PAD_LEFT
  const chartRight = SVG_WIDTH - PAD_RIGHT
  const chartTop = PAD_TOP
  const chartBottom = SVG_HEIGHT - PAD_BOTTOM

  const xFor = (value: number) => chartLeft + ((value - xMin) / xRange) * (chartRight - chartLeft)
  const yFor = (value: number) => chartBottom - ((value - yMin) / yRange) * (chartBottom - chartTop)

  const xTicks = buildTicks(rawXMin, rawXMax)
  const yTicks = buildTicks(rawYMin, rawYMax)
  const polyline = sorted.map((point) => `${xFor(point.x)},${yFor(point.y)}`).join(' ')
  const connect = spec.connect !== false

  return (
    <div className="min-w-0 max-w-full overflow-x-auto">
      {spec.title ? (
        <p className="mb-2 text-sm font-medium text-violet-100">{spec.title}</p>
      ) : null}
      {spec.equation ? (
        <div className="mb-2 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2">
          <AiLatexBlock latex={spec.equation} />
        </div>
      ) : null}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="h-auto w-full max-w-full"
        role="img"
        aria-label={spec.title ?? 'XY plot'}
      >
        <rect
          x={chartLeft}
          y={chartTop}
          width={chartRight - chartLeft}
          height={chartBottom - chartTop}
          fill="rgba(0,0,0,0.55)"
          stroke="rgba(148,163,184,0.12)"
        />

        {yTicks.map((tick) => {
          const tickY = yFor(tick)
          return (
            <g key={`y-${tick}`}>
              <line
                x1={chartLeft}
                y1={tickY}
                x2={chartRight}
                y2={tickY}
                stroke="rgba(148,163,184,0.12)"
                strokeWidth={1}
              />
              <text x={chartLeft - 8} y={tickY + 4} textAnchor="end" fill="#94a3b8" fontSize={10}>
                {formatTick(tick)}
              </text>
            </g>
          )
        })}

        {xTicks.map((tick) => {
          const tickX = xFor(tick)
          return (
            <g key={`x-${tick}`}>
              <line
                x1={tickX}
                y1={chartBottom}
                x2={tickX}
                y2={chartBottom + 6}
                stroke="rgba(148,163,184,0.45)"
                strokeWidth={1}
              />
              <text x={tickX} y={chartBottom + 20} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                {formatTick(tick)}
              </text>
            </g>
          )
        })}

        <line
          x1={chartLeft}
          y1={chartTop}
          x2={chartLeft}
          y2={chartBottom}
          stroke="rgba(148,163,184,0.45)"
          strokeWidth={1.5}
        />
        <line
          x1={chartLeft}
          y1={chartBottom}
          x2={chartRight}
          y2={chartBottom}
          stroke="rgba(148,163,184,0.55)"
          strokeWidth={1.5}
        />

        {connect ? (
          <polyline
            points={polyline}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {!connect
          ? sorted.map((point, index) => (
              <circle
                key={`${point.x}-${point.y}-${index}`}
                cx={xFor(point.x)}
                cy={yFor(point.y)}
                r={4.5}
                fill="#06b6d4"
                stroke="#164e63"
                strokeWidth={1.5}
              />
            ))
          : null}

        {highlightPoints.map((point, index) => (
          <g key={`hl-${point.x}-${point.y}-${index}`}>
            <circle
              cx={xFor(point.x)}
              cy={yFor(point.y)}
              r={5.5}
              fill="#fbbf24"
              stroke="#78350f"
              strokeWidth={1.5}
            />
            {point.label ? (
              <text
                x={xFor(point.x)}
                y={yFor(point.y) - 10}
                textAnchor="middle"
                fill="#fde68a"
                fontSize={10}
                fontWeight={600}
              >
                {point.label}
              </text>
            ) : null}
          </g>
        ))}

        {spec.yLabel ? (
          <text
            x={14}
            y={(chartTop + chartBottom) / 2}
            textAnchor="middle"
            transform={`rotate(-90 14 ${(chartTop + chartBottom) / 2})`}
            fill="#64748b"
            fontSize={10}
            fontWeight={600}
          >
            {spec.yLabel}
          </text>
        ) : null}
        {spec.xLabel ? (
          <text
            x={(chartLeft + chartRight) / 2}
            y={SVG_HEIGHT - 12}
            textAnchor="middle"
            fill="#64748b"
            fontSize={10}
            fontWeight={600}
          >
            {spec.xLabel}
          </text>
        ) : null}
      </svg>

      <AiChartNotes notes={spec.notes} />
    </div>
  )
}
