import { AiLatexBlock } from './AiLatexBlock'
import { sourceLabel, type AiFormulaVisual } from '../types/aiVisuals'

export function AiFormulaList({ formulas }: { formulas: AiFormulaVisual[] }) {
  return (
    <div className="space-y-3">
      {formulas.map((formula, index) => {
        const source = sourceLabel(formula.source)
        return (
          <div
            key={`${formula.name ?? 'formula'}-${index}`}
            className="rounded-xl border border-cyan-500/25 bg-black px-3 py-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              {formula.name ? <h4 className="text-sm font-semibold text-cyan-100">{formula.name}</h4> : null}
              {source ? <span className="text-[11px] text-slate-400">{source}</span> : null}
            </div>
            <AiLatexBlock latex={formula.latex} />
          </div>
        )
      })}
    </div>
  )
}
