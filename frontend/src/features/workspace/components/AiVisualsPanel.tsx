import type { ReactNode } from 'react'
import { AiChartBlock } from './AiChartBlock'
import { AiBoxplotBlockChart } from './AiBoxplotBlockChart'
import { AiContingencyTableView } from './AiContingencyTableView'
import { AiDataTableView } from './AiDataTableView'
import { AiFinalAnswerView } from './AiFinalAnswerView'
import { AiFormulaList } from './AiFormulaList'
import { AiHistogramChart } from './AiHistogramChart'
import { AiKnownLookingForTable } from './AiKnownLookingForTable'
import { AiProbabilityTreeChart } from './AiProbabilityTreeChart'
import { AiRegressionChart } from './AiRegressionChart'
import { AiScatterplotChart } from './AiScatterplotChart'
import { AiStepByStepView } from './AiStepByStepView'
import { AiXyPlotChart } from './AiXyPlotChart'
import {
  isBoxplotBlock,
  isContingencyTableBlock,
  isFinalAnswerBlock,
  isHistogramBlock,
  isKnownLookingForBlock,
  isProbabilityTreeBlock,
  isRegressionBlock,
  isScatterplotBlock,
  isStepByStepBlock,
  isXyPlotBlock,
} from '../types/aiVisualBlocks'
import { sourceLabel, type AiVisualsPayload } from '../types/aiVisuals'
import { AiChartNotes } from './AiChartNotes'

function blockCard(key: string, children: ReactNode) {
  return (
    <div
      key={key}
      className="rounded-xl border border-violet-500/25 bg-black p-3"
    >
      {children}
    </div>
  )
}

export function AiVisualsPanel({ visuals }: { visuals: AiVisualsPayload }) {
  const hasTables = (visuals.tables?.length ?? 0) > 0
  const hasCharts = (visuals.charts?.length ?? 0) > 0
  const hasFormulas = (visuals.formulas?.length ?? 0) > 0
  const hasBlocks = (visuals.blocks?.length ?? 0) > 0

  if (!hasTables && !hasCharts && !hasFormulas && !hasBlocks) {
    return null
  }

  return (
    <div className="mt-3 min-w-0 max-w-full space-y-4 border-t border-neutral-800 pt-3">
      {hasFormulas ? <AiFormulaList formulas={visuals.formulas ?? []} /> : null}

      {hasBlocks
        ? visuals.blocks?.map((block, index) => {
            if (isKnownLookingForBlock(block)) {
              return <AiKnownLookingForTable key={`known-${index}`} block={block} />
            }
            if (isContingencyTableBlock(block)) {
              return <AiContingencyTableView key={`contingency-${index}`} block={block} />
            }
            if (isProbabilityTreeBlock(block)) {
              return blockCard(
                `tree-${index}`,
                <>
                  <AiProbabilityTreeChart block={block} />
                  <AiChartNotes notes={block.notes} />
                </>,
              )
            }
            if (isXyPlotBlock(block)) {
              return blockCard(`xy-${index}`, <AiXyPlotChart spec={block} />)
            }
            if (isHistogramBlock(block)) {
              return blockCard(`hist-${index}`, <AiHistogramChart block={block} />)
            }
            if (isScatterplotBlock(block)) {
              return blockCard(`scatter-${index}`, <AiScatterplotChart block={block} />)
            }
            if (isRegressionBlock(block)) {
              return blockCard(`regression-${index}`, <AiRegressionChart block={block} />)
            }
            if (isBoxplotBlock(block)) {
              return blockCard(`boxplot-${index}`, <AiBoxplotBlockChart block={block} />)
            }
            if (isStepByStepBlock(block)) {
              return <AiStepByStepView key={`steps-${index}`} block={block} />
            }
            if (isFinalAnswerBlock(block)) {
              return <AiFinalAnswerView key={`answer-${index}`} block={block} />
            }
            return null
          })
        : null}

      {hasTables
        ? visuals.tables?.map((table, index) => (
            <AiDataTableView key={`${table.title ?? 'table'}-${index}`} table={table} />
          ))
        : null}

      {hasCharts
        ? visuals.charts?.map((chart, index) => {
            const source = sourceLabel(chart.source as string | undefined)
            return (
              <div key={`${chart.title ?? 'chart'}-${index}`}>
                {source ? <p className="mb-1 text-[11px] text-slate-400">{source}</p> : null}
                <AiChartBlock chart={chart} />
                <AiChartNotes notes={chart.notes} />
              </div>
            )
          })
        : null}
    </div>
  )
}
