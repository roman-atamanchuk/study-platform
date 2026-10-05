import type { AiScatterplotBlock } from '../types/aiVisualBlocks'
import { buildTicks, domainWithPadding, formatTick } from '../utils/chartSvgUtils'
import { AiChartNotes } from './AiChartNotes'

const SVG_WIDTH = 420
const SVG_HEIGHT = 260
const PAD_LEFT = 52
const PAD_RIGHT = 20
const PAD_TOP = 24
const PAD_BOTTOM = 52

export function AiScatterplotChart({ block }: { block: AiScatterplotBlock }) {
  const points = block.points.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
  )
  if (points.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-rose-300">
        Scatterplot data is incomplete — need at least one (x, y) point.
      </p>
    )
  }

  const rawXMin = Math.min(...points.map((point) => point.x))
  const rawXMax = Math.max(...points.map((point) => point.x))
  const rawYMin = Math.min(...points.map((point) => point.y))
  const rawYMax = Math.max(...points.map((point) => point.y))
  const xDomain = domainWithPadding(rawXMin, rawXMax)
  const yDomain = domainWithPadding(rawYMin, rawYMax)

  const chartLeft = PAD_LEFT
  const chartRight = SVG_WIDTH - PAD_RIGHT
  const chartTop = PAD_TOP
  const chartBottom = SVG_HEIGHT - PAD_BOTTOM

  const xFor = (value: number) =>
    chartLeft + ((value - xDomain.min) / xDomain.range) * (chartRight - chartLeft)
  const yFor = (value: number) =>
    chartBottom - ((value - yDomain.min) / yDomain.range) * (chartBottom - chartTop)

  const xTicks = buildTicks(rawXMin, rawXMax, 4)
  const yTicks = buildTicks(rawYMin, rawYMax, 4)

  return (
    <div className="min-w-0 max-w-full overflow-x-auto">
      {block.title ? (
        <p className="mb-2 text-sm font-medium text-violet-100">{block.title}</p>
      ) : null}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="h-auto w-full max-w-full"
        role="img"
        aria-label={block.title ?? 'Scatterplot'}
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

        {points.map((point, index) => (
          <circle
            key={`${point.x}-${point.y}-${index}`}
            cx={xFor(point.x)}
            cy={yFor(point.y)}
            r={5}
            fill="#06b6d4"
            stroke="#164e63"
            strokeWidth={1.5}
          />
        ))}

        {block.yLabel ? (
          <text
            x={14}
            y={(chartTop + chartBottom) / 2}
            textAnchor="middle"
            transform={`rotate(-90 14 ${(chartTop + chartBottom) / 2})`}
            fill="#64748b"
            fontSize={10}
            fontWeight={600}
          >
            {block.yLabel}
          </text>
        ) : null}
        {block.xLabel ? (
          <text
            x={(chartLeft + chartRight) / 2}
            y={SVG_HEIGHT - 12}
            textAnchor="middle"
            fill="#64748b"
            fontSize={10}
            fontWeight={600}
          >
            {block.xLabel}
          </text>
        ) : null}
      </svg>
      <AiChartNotes notes={block.notes} />
    </div>
  )
}
