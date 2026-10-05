import type { AiFinalAnswerBlock } from '../types/aiVisualBlocks'
import { AiMixedLatexText } from './AiMixedLatexText'

export function AiFinalAnswerView({ block }: { block: AiFinalAnswerBlock }) {
  return (
    <div className="rounded-xl border border-emerald-500/35 bg-black px-4 py-3">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
        Final answer
      </div>
      <AiMixedLatexText
        text={block.content}
        className="text-base font-semibold leading-7 text-emerald-50"
      />
    </div>
  )
}
