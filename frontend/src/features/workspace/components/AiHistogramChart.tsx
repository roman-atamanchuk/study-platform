import type { AiHistogramBlock } from '../types/aiVisualBlocks'
import { formatTick } from '../utils/chartSvgUtils'
import { AiChartNotes } from './AiChartNotes'

const SVG_WIDTH = 420
const SVG_HEIGHT = 260
const PAD_LEFT = 48
const PAD_RIGHT = 20
const PAD_TOP = 24
const PAD_BOTTOM = 52
const BAR_GAP = 6

export function AiHistogramChart({ block }: { block: AiHistogramBlock }) {
  const bins = block.bins.filter((bin) => Number.isFinite(bin.frequency) && bin.frequency >= 0)
  if (bins.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-rose-300">
        Histogram data is incomplete — need at least one bin with frequency.
      </p>
    )
  }

  const chartLeft = PAD_LEFT
  const chartRight = SVG_WIDTH - PAD_RIGHT
  const chartTop = PAD_TOP
  const chartBottom = SVG_HEIGHT - PAD_BOTTOM
  const chartWidth = chartRight - chartLeft
  const chartHeight = chartBottom - chartTop
  const maxFrequency = Math.max(...bins.map((bin) => bin.frequency), 1)
  const barSlotWidth = chartWidth / bins.length
  const barWidth = Math.max(8, barSlotWidth - BAR_GAP)
  const yFor = (frequency: number) => chartBottom - (frequency / maxFrequency) * chartHeight
  const yTicks = Array.from(new Set([0, Math.ceil(maxFrequency / 2), maxFrequency])).sort(
    (a, b) => a - b,
  )

  return (
    <div className="min-w-0 max-w-full overflow-x-auto">
      {block.title ? (
        <p className="mb-2 text-sm font-medium text-violet-100">{block.title}</p>
      ) : null}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="h-auto w-full max-w-full"
        role="img"
        aria-label={block.title ?? 'Histogram'}
      >
        {yTicks.map((tick) => {
          const tickY = yFor(tick)
          return (
            <g key={tick}>
              <line
                x1={chartLeft}
                y1={tickY}
                x2={chartRight}
                y2={tickY}
                stroke={tick === 0 ? 'rgba(148,163,184,0.45)' : 'rgba(148,163,184,0.12)'}
                strokeWidth={tick === 0 ? 1.5 : 1}
              />
              <text x={chartLeft - 8} y={tickY + 4} textAnchor="end" fill="#94a3b8" fontSize={10}>
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

        {bins.map((bin, index) => {
          const barHeight = chartBottom - yFor(bin.frequency)
          const barX = chartLeft + index * barSlotWidth + (barSlotWidth - barWidth) / 2
          const barY = chartBottom - barHeight
          const labelX = barX + barWidth / 2

          return (
            <g key={`${bin.label}-${index}`}>
              <rect
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill="rgba(6,182,212,0.35)"
                stroke="#06b6d4"
                strokeWidth={1.5}
              />
              <text x={labelX} y={barY - 6} textAnchor="middle" fill="#e2e8f0" fontSize={10} fontWeight={600}>
                {formatTick(bin.frequency)}
              </text>
              <text x={labelX} y={chartBottom + 18} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                {bin.label}
              </text>
            </g>
          )
        })}

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
