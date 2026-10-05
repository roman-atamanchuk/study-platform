import type { AiRegressionBlock } from '../types/aiVisualBlocks'
import { buildTicks, domainWithPadding, formatTick } from '../utils/chartSvgUtils'
import { AiChartNotes } from './AiChartNotes'
import { AiLatexBlock } from './AiLatexBlock'

const SVG_WIDTH = 420
const SVG_HEIGHT = 280
const PAD_LEFT = 52
const PAD_RIGHT = 20
const PAD_TOP = 24
const PAD_BOTTOM = 52

export function AiRegressionChart({ block }: { block: AiRegressionBlock }) {
  const points = (block.points ?? []).filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
  )
  const hasLine = Boolean(block.line)

  const fallbackXMin =
    block.xRange?.min ?? (points.length ? Math.min(...points.map((point) => point.x)) : 0)
  const fallbackXMax =
    block.xRange?.max ?? (points.length ? Math.max(...points.map((point) => point.x)) : 10)
  const rawXMin = fallbackXMin === fallbackXMax ? fallbackXMin - 1 : fallbackXMin
  const rawXMax = fallbackXMin === fallbackXMax ? fallbackXMax + 1 : fallbackXMax

  const lineYValues = block.line
    ? [
        block.line.slope * rawXMin + block.line.intercept,
        block.line.slope * rawXMax + block.line.intercept,
      ]
    : []
  const allYValues = [...points.map((point) => point.y), ...lineYValues]
  const rawYMin = allYValues.length ? Math.min(...allYValues) : 0
  const rawYMax = allYValues.length ? Math.max(...allYValues) : 10

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

  const lineStart = block.line
    ? { x: rawXMin, y: block.line.slope * rawXMin + block.line.intercept }
    : null
  const lineEnd = block.line
    ? { x: rawXMax, y: block.line.slope * rawXMax + block.line.intercept }
    : null

  if (!hasLine && points.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-rose-300">
        Regression data is incomplete — need points or a fitted line.
      </p>
    )
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-auto">
      {block.title ? (
        <p className="mb-2 text-sm font-medium text-violet-100">{block.title}</p>
      ) : null}
      {block.equation ? (
        <div className="mb-2 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2">
          <AiLatexBlock latex={block.equation} />
        </div>
      ) : null}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="h-auto w-full max-w-full"
        role="img"
        aria-label={block.title ?? 'Regression plot'}
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

        {lineStart && lineEnd ? (
          <line
            x1={xFor(lineStart.x)}
            y1={yFor(lineStart.y)}
            x2={xFor(lineEnd.x)}
            y2={yFor(lineEnd.y)}
            stroke="#f472b6"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        ) : null}

        {points.map((point, index) => (
          <circle
            key={`${point.x}-${point.y}-${index}`}
            cx={xFor(point.x)}
            cy={yFor(point.y)}
            r={5}
            fill="#8b5cf6"
            stroke="#4c1d95"
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
