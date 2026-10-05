import type { AiStepByStepBlock } from '../types/aiVisualBlocks'
import { AiMixedLatexText } from './AiMixedLatexText'

export function AiStepByStepView({ block }: { block: AiStepByStepBlock }) {
  return (
    <ol className="space-y-2">
      {block.steps.map((step, index) => (
        <li
          key={`${step}-${index}`}
          className="flex gap-3 rounded-xl border border-neutral-800 bg-black px-3 py-2.5"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-200">
            {index + 1}
          </span>
          <AiMixedLatexText text={step} className="min-w-0 pt-0.5 text-sm leading-6 text-slate-200" />
        </li>
      ))}
    </ol>
  )
}
